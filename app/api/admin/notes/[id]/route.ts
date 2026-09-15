export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth";
import { getNoteById, updateNote, deleteNote } from "@/lib/notes";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const err = await requireOwner(request);
  if (err) return err;
  const { id } = await params;
  const note = await getNoteById(id);
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ note });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const err = await requireOwner(request);
  if (err) return err;
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const patch: Record<string, unknown> = {};
  if ("title" in body) patch.title = String((body as any).title);
  if ("content" in body) patch.content = (body as any).content != null ? String((body as any).content) : "";
  if ("icon" in body) patch.icon = (body as any).icon != null ? String((body as any).icon) : null;
  if ("parentId" in body) patch.parentId = (body as any).parentId != null ? String((body as any).parentId) : null;
  const updated = await updateNote(id, patch as any);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ note: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const err = await requireOwner(request);
  if (err) return err;
  const { id } = await params;
  const ok = await deleteNote(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
