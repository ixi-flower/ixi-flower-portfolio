export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  getBlogPosts,
  createBlogPost,
  attachTags,
  publicPost,
  POSTS_PER_PAGE,
  type BlogStatus,
} from "@/lib/blog";
import { requireOwner } from "@/lib/auth";

// GET /api/admin/blog?q=&status=&tag=&page=  — owner-only, all statuses
export async function GET(request: NextRequest) {
  const err = await requireOwner(request);
  if (err) return err;

  const sp = request.nextUrl.searchParams;
  const page = parseInt(sp.get("page") || "1", 10);
  const q = (sp.get("q") || "").trim();
  const statusRaw = (sp.get("status") || "").trim();
  const tag = (sp.get("tag") || "").trim();

  const status =
    statusRaw === "draft" || statusRaw === "published"
      ? (statusRaw as BlogStatus)
      : undefined;

  const { posts, total } = await getBlogPosts({
    status,
    q: q || undefined,
    tag: tag || undefined,
    page,
    perPage: POSTS_PER_PAGE,
  });

  const withTags = await attachTags(posts);

  return NextResponse.json({
    posts: withTags.map(({ tags, ...p }) => ({ ...publicPost(p), tags })),
    total,
    page: Math.max(1, page || 1),
    totalPages: Math.max(1, Math.ceil(total / POSTS_PER_PAGE)),
  });
}

// POST /api/admin/blog  — owner-only, create post
export async function POST(request: NextRequest) {
  const err = await requireOwner(request);
  if (err) return err;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const title = String((body as any).title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  // Accept both camelCase variations filmshab used (coverImage) and current schema (coverUrl)
  const rawTagValue = (body as any).tags;
  const tags: string[] | undefined = Array.isArray(rawTagValue)
    ? (rawTagValue as unknown[]).map(String)
    : undefined;

  const statusRaw = String((body as any).status ?? "draft").trim();
  const status: BlogStatus = statusRaw === "published" ? "published" : "draft";

  // Use ADMIN_EMAIL as authorId when Stack not configured
  const authorId = process.env.ADMIN_EMAIL || "owner";

  const post = await createBlogPost(authorId, {
    title,
    titleFa: (body as any).titleFa ? String((body as any).titleFa).trim() : undefined,
    slug: (body as any).slug ? String((body as any).slug).trim() : undefined,
    slugFa: (body as any).slugFa ? String((body as any).slugFa).trim() : undefined,
    excerpt: (body as any).excerpt ? String((body as any).excerpt).trim() : undefined,
    excerptFa: (body as any).excerptFa ? String((body as any).excerptFa).trim() : undefined,
    content: (body as any).content ? String((body as any).content) : undefined,
    contentFa: (body as any).contentFa ? String((body as any).contentFa) : undefined,
    coverUrl: (body as any).coverUrl
      ? String((body as any).coverUrl).trim()
      : (body as any).coverImage
        ? String((body as any).coverImage).trim()
        : undefined,
    coverPublicId: (body as any).coverPublicId
      ? String((body as any).coverPublicId).trim()
      : undefined,
    status,
    metaTitle: (body as any).metaTitle ? String((body as any).metaTitle).trim() : undefined,
    metaTitleFa: (body as any).metaTitleFa ? String((body as any).metaTitleFa).trim() : undefined,
    metaDescription: (body as any).metaDescription
      ? String((body as any).metaDescription).trim()
      : undefined,
    metaDescriptionFa: (body as any).metaDescriptionFa
      ? String((body as any).metaDescriptionFa).trim()
      : undefined,
    tags,
  });

  const [withTags] = await attachTags([post]);

  return NextResponse.json(
    { post: { ...publicPost(withTags as any), tags: (withTags as any).tags } },
    { status: 201 },
  );
}
