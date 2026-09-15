export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getBookmarkById, updateBookmark, deleteBookmark } from "@/lib/notes";
import { requireOwnerOrToken } from "@/lib/token-auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwnerOrToken(request, "bookmarks:read");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const bm = await getBookmarkById(id);
  if (!bm) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ bookmark: bm });
}
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwnerOrToken(request, "bookmarks:write");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const patch: Record<string, unknown> = {};
  if ((body as any).title !== undefined) patch.title = String((body as any).title);
  if ((body as any).url !== undefined) patch.url = String((body as any).url);
  if ((body as any).description !== undefined) patch.description = (body as any).description == null ? null : String((body as any).description);
  if ((body as any).favicon !== undefined) patch.favicon = (body as any).favicon == null ? null : String((body as any).favicon);
  if ((body as any).folder !== undefined) patch.folder = (body as any).folder == null ? null : String((body as any).folder);
  const updated = await updateBookmark(id, patch as any);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ bookmark: updated });
}
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwnerOrToken(request, "bookmarks:write");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const ok = await deleteBookmark(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
