export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAllBookmarks, createBookmark } from "@/lib/notes";
import { requireOwnerOrToken } from "@/lib/token-auth";

export async function GET(request: NextRequest) {
  const auth = await requireOwnerOrToken(request, "bookmarks:read");
  if (auth instanceof NextResponse) return auth;
  const bookmarks = await getAllBookmarks();
  return NextResponse.json({ bookmarks });
}

export async function POST(request: NextRequest) {
  const auth = await requireOwnerOrToken(request, "bookmarks:write");
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const title = String((body as any).title ?? "").trim();
  const url = String((body as any).url ?? "").trim();
  if (!title || !url) return NextResponse.json({ error: "title and url required" }, { status: 400 });
  const bm = await createBookmark({
    title, url,
    description: (body as any).description != null ? String((body as any).description).trim() : null,
    favicon: (body as any).favicon != null ? String((body as any).favicon).trim() : null,
    folder: (body as any).folder != null ? String((body as any).folder).trim() || null : null,
  });
  return NextResponse.json({ bookmark: bm }, { status: 201 });
}
