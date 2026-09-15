export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth";
import { getAllBookmarks, createBookmark } from "@/lib/notes";

export async function GET(request: NextRequest) {
  const err = await requireOwner(request);
  if (err) return err;
  const bookmarks = await getAllBookmarks();
  return NextResponse.json({ bookmarks });
}

export async function POST(request: NextRequest) {
  const err = await requireOwner(request);
  if (err) return err;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const title = String((body as any).title ?? "").trim();
  const url = String((body as any).url ?? "").trim();
  if (!title || !url) return NextResponse.json({ error: "title and url required" }, { status: 400 });
  const description = (body as any).description != null ? String((body as any).description).trim() : null;
  const favicon = (body as any).favicon != null ? String((body as any).favicon).trim() : null;
  const folder = (body as any).folder != null ? String((body as any).folder).trim() : null;
  const bookmark = await createBookmark({ title, url, description, favicon, folder: folder || null });
  return NextResponse.json({ bookmark }, { status: 201 });
}
