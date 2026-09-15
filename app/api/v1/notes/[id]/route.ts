export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getNoteById, updateNote, deleteNote } from "@/lib/notes";
import { requireOwnerOrToken } from "@/lib/token-auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwnerOrToken(request, "notes:read");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const note = await getNoteById(id);
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ note });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwnerOrToken(request, "notes:write");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const patch: Record<string, unknown> = {};
  if ((body as any).title !== undefined) patch.title = String((body as any).title);
  if ((body as any).content !== undefined) patch.content = String((body as any).content);
  if ((body as any).icon !== undefined) patch.icon = (body as any).icon == null ? null : String((body as any).icon);
  if ((body as any).parentId !== undefined) patch.parentId = (body as any).parentId == null ? null : String((body as any).parentId);
  const updated = await updateNote(id, patch as any);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ note: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwnerOrToken(request, "notes:write");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const ok = await deleteNote(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
