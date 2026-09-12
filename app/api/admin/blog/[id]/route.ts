export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  getBlogPostById,
  updateBlogPost,
  deleteBlogPost,
  attachTags,
  publicPost,
  type BlogStatus,
} from "@/lib/blog";
import { requireOwner } from "@/lib/auth";

// GET /api/admin/blog/:id — owner-only, single post with tags
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const err = await requireOwner(request);
  if (err) return err;

  const { id } = await params;
  const post = await getBlogPostById(id);
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const [withTags] = await attachTags([post]);
  return NextResponse.json({ post: { ...publicPost(withTags as any), tags: (withTags as any).tags } });
}

// PATCH /api/admin/blog/:id — owner-only, update fields + tags
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const err = await requireOwner(request);
  if (err) return err;

  const { id } = await params;
  const existing = await getBlogPostById(id);
  if (!existing) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  // Build patch — only include keys that were present (undefined means "keep existing")
  const patch: Record<string, unknown> = {};

  if ("title" in body) patch.title = (body as any).title ? String((body as any).title).trim() : undefined;
  if ("titleFa" in body) patch.titleFa = (body as any).titleFa ? String((body as any).titleFa).trim() : (body as any).titleFa === null ? null : undefined;
  if ("slug" in body) patch.slug = (body as any).slug ? String((body as any).slug).trim() : undefined;
  if ("slugFa" in body) patch.slugFa = (body as any).slugFa ? String((body as any).slugFa).trim() : (body as any).slugFa === null ? null : undefined;
  if ("excerpt" in body) patch.excerpt = (body as any).excerpt != null ? String((body as any).excerpt).trim() : null;
  if ("excerptFa" in body) patch.excerptFa = (body as any).excerptFa != null ? String((body as any).excerptFa).trim() : null;
  if ("content" in body) patch.content = (body as any).content != null ? String((body as any).content) : undefined;
  if ("contentFa" in body) patch.contentFa = (body as any).contentFa != null ? String((body as any).contentFa) : undefined;
  if ("coverUrl" in body) patch.coverUrl = (body as any).coverUrl ? String((body as any).coverUrl).trim() : (body as any).coverUrl === null ? null : undefined;
  if ("coverImage" in body && !("coverUrl" in body)) patch.coverUrl = (body as any).coverImage ? String((body as any).coverImage).trim() : (body as any).coverImage === null ? null : undefined;
  if ("coverPublicId" in body) patch.coverPublicId = (body as any).coverPublicId ? String((body as any).coverPublicId).trim() : (body as any).coverPublicId === null ? null : undefined;
  if ("status" in body) patch.status = (body as any).status as BlogStatus;
  if ("metaTitle" in body) patch.metaTitle = (body as any).metaTitle ? String((body as any).metaTitle).trim() : (body as any).metaTitle === null ? null : undefined;
  if ("metaTitleFa" in body) patch.metaTitleFa = (body as any).metaTitleFa ? String((body as any).metaTitleFa).trim() : (body as any).metaTitleFa === null ? null : undefined;
  if ("metaDescription" in body) patch.metaDescription = (body as any).metaDescription ? String((body as any).metaDescription).trim() : (body as any).metaDescription === null ? null : undefined;
  if ("metaDescriptionFa" in body) patch.metaDescriptionFa = (body as any).metaDescriptionFa ? String((body as any).metaDescriptionFa).trim() : (body as any).metaDescriptionFa === null ? null : undefined;
  if ("publishedAt" in body) patch.publishedAt = (body as any).publishedAt as any;
  if ("tags" in body) {
    patch.tags = Array.isArray((body as any).tags)
      ? ((body as any).tags as unknown[]).map(String)
      : [];
  }

  const updated = await updateBlogPost(id, patch as any);
  if (!updated) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const [withTags] = await attachTags([updated]);
  return NextResponse.json({ post: { ...publicPost(withTags as any), tags: (withTags as any).tags } });
}

// DELETE /api/admin/blog/:id — owner-only
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const err = await requireOwner(request);
  if (err) return err;

  const { id } = await params;
  const ok = await deleteBlogPost(id);
  if (!ok) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
