export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getBlogPosts, createBlogPost, attachTags, publicPost, POSTS_PER_PAGE, type BlogStatus } from "@/lib/blog";
import { requireOwnerOrToken } from "@/lib/token-auth";

// GET /api/v1/blog?q=&tag=&page=&status= — token blog:read (owner bypasses scope)
export async function GET(request: NextRequest) {
  const auth = await requireOwnerOrToken(request, "blog:read");
  if (auth instanceof NextResponse) return auth;
  const sp = request.nextUrl.searchParams;
  const q = (sp.get("q") || "").trim() || undefined;
  const tag = (sp.get("tag") || "").trim() || undefined;
  const page = parseInt(sp.get("page") || "1", 10);
  const perPage = Math.min(50, Math.max(1, parseInt(sp.get("perPage") || String(POSTS_PER_PAGE), 10)));
  const rawStatus = (sp.get("status") || "").trim();
  // Without owner/token with *, only published is allowed via public? For v1 we require token, so allow status filter
  const status = (rawStatus === "draft" || rawStatus === "published") ? (rawStatus as BlogStatus) : undefined;
  const { posts, total } = await getBlogPosts({ q, tag, page, perPage, status });
  const withTags = await attachTags(posts);
  return NextResponse.json({
    posts: withTags.map(({ tags, ...p }) => ({ ...publicPost(p), tags })),
    total,
    page: Math.max(1, page || 1),
    totalPages: Math.max(1, Math.ceil(total / perPage)),
    perPage,
  });
}

// POST /api/v1/blog — token blog:write
export async function POST(request: NextRequest) {
  const auth = await requireOwnerOrToken(request, "blog:write");
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const title = String((body as any).title ?? "").trim();
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
  const rawTagValue = (body as any).tags;
  const tags: string[] | undefined = Array.isArray(rawTagValue) ? (rawTagValue as unknown[]).map(String) : undefined;
  const statusRaw = String((body as any).status ?? "draft").trim();
  const status: BlogStatus = statusRaw === "published" ? "published" : "draft";
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
    coverUrl: (body as any).coverUrl ? String((body as any).coverUrl).trim() : (body as any).coverImage ? String((body as any).coverImage).trim() : undefined,
    coverPublicId: (body as any).coverPublicId ? String((body as any).coverPublicId).trim() : undefined,
    status,
    metaTitle: (body as any).metaTitle ? String((body as any).metaTitle).trim() : undefined,
    metaDescription: (body as any).metaDescription ? String((body as any).metaDescription).trim() : undefined,
    tags,
  });
  const [withTags] = await attachTags([post]);
  return NextResponse.json({ post: { ...publicPost(withTags as any), tags: (withTags as any).tags } }, { status: 201 });
}
