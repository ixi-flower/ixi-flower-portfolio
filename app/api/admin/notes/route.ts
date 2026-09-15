export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth";
import { getAllNotes, createNote } from "@/lib/notes";

export async function GET(request: NextRequest) {
  const err = await requireOwner(request);
  if (err) return err;
  const notes = await getAllNotes();
  return NextResponse.json({ notes });
}

export async function POST(request: NextRequest) {
  const err = await requireOwner(request);
  if (err) return err;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const iconVal = (body as any).icon != null ? String((body as any).icon).trim() : null;
  const fallbackTitle = iconVal === "📁" || iconVal === "🗂️" ? "New Folder" : "New Note";
  const title = String((body as any).title ?? "").trim() || fallbackTitle;
  const content = (body as any).content != null ? String((body as any).content) : "";
  const parentId = (body as any).parentId != null ? String((body as any).parentId) : null;
  const note = await createNote({ title, content, parentId, icon: iconVal || null });
  return NextResponse.json({ note }, { status: 201 });
}
