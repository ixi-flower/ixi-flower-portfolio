export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth";
import { getBookmarkById, updateBookmark, deleteBookmark } from "@/lib/notes";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const err = await requireOwner(request);
  if (err) return err;
  const { id } = await params;
  const b = await getBookmarkById(id);
  if (!b) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ bookmark: b });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const err = await requireOwner(request);
  if (err) return err;
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const patch: Record<string, unknown> = {};
  if ("title" in body) patch.title = String((body as any).title);
  if ("url" in body) patch.url = String((body as any).url);
  if ("description" in body) patch.description = (body as any).description != null ? String((body as any).description) : null;
  if ("favicon" in body) patch.favicon = (body as any).favicon != null ? String((body as any).favicon) : null;
  if ("folder" in body) patch.folder = (body as any).folder != null ? String((body as any).folder) : null;
  const updated = await updateBookmark(id, patch as any);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ bookmark: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const err = await requireOwner(request);
  if (err) return err;
  const { id } = await params;
  const ok = await deleteBookmark(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
