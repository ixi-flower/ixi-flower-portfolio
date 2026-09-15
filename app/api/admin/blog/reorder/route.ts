export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { reorderBlogPosts } from "@/lib/blog";
import { requireOwner } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  const err = await requireOwner(request);
  if (err) return err;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const ids = (body as any)?.orderedIds;
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "orderedIds string[] required" }, { status: 400 });
  }
  const orderedIds = (ids as unknown[]).map(String).filter(Boolean);
  await reorderBlogPosts(orderedIds);
  return NextResponse.json({ ok: true });
}
