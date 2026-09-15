export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getBlogPostById, getPostTags, publicPost, updateBlogPost, deleteBlogPost } from "@/lib/blog";
import { requireOwnerOrToken } from "@/lib/token-auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwnerOrToken(request, "blog:read");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const post = await getBlogPostById(id);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const tags = await getPostTags(id);
  return NextResponse.json({ post: { ...publicPost(post), tags } });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwnerOrToken(request, "blog:write");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const rawTagValue = (body as any).tags;
  const tags: string[] | undefined = Array.isArray(rawTagValue) ? (rawTagValue as unknown[]).map(String) : undefined;
  const updated = await updateBlogPost(id, {
    title: (body as any).title !== undefined ? String((body as any).title) : undefined,
    titleFa: (body as any).titleFa !== undefined ? String((body as any).titleFa) : undefined,
    slug: (body as any).slug !== undefined ? String((body as any).slug).trim() : undefined,
    slugFa: (body as any).slugFa !== undefined ? String((body as any).slugFa).trim() : undefined,
    excerpt: (body as any).excerpt !== undefined ? String((body as any).excerpt) : undefined,
    excerptFa: (body as any).excerptFa !== undefined ? String((body as any).excerptFa) : undefined,
    content: (body as any).content !== undefined ? String((body as any).content) : undefined,
    contentFa: (body as any).contentFa !== undefined ? String((body as any).contentFa) : undefined,
    coverUrl: (body as any).coverUrl !== undefined ? String((body as any).coverUrl).trim() : undefined,
    coverPublicId: (body as any).coverPublicId !== undefined ? String((body as any).coverPublicId).trim() : undefined,
    status: (body as any).status !== undefined ? String((body as any).status).trim() as any : undefined,
    metaTitle: (body as any).metaTitle !== undefined ? String((body as any).metaTitle).trim() : undefined,
    metaDescription: (body as any).metaDescription !== undefined ? String((body as any).metaDescription).trim() : undefined,
    tags,
  });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const t = await getPostTags(id);
  return NextResponse.json({ post: { ...publicPost(updated), tags: t } });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwnerOrToken(request, "blog:write");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const ok = await deleteBlogPost(id);
  if (!ok) return NextResponse.json({ error: "Not found or not deleted" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
