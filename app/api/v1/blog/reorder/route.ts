export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { reorderBlogPosts } from "@/lib/blog";
import { requireOwnerOrToken } from "@/lib/token-auth";

export async function PUT(request: NextRequest) {
  const auth = await requireOwnerOrToken(request, "blog:write");
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const ids = (body as any)?.orderedIds;
  if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: "orderedIds string[] required" }, { status: 400 });
  await reorderBlogPosts(ids.map(String));
  return NextResponse.json({ ok: true });
}
