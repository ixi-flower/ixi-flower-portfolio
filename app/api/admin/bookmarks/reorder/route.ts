export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth";
import { reorderBookmarks } from "@/lib/notes";

export async function PUT(request: NextRequest) {
  const err = await requireOwner(request);
  if (err) return err;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const ids = (body as any)?.orderedIds;
  if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: "orderedIds required" }, { status: 400 });
  await reorderBookmarks((ids as unknown[]).map(String));
  return NextResponse.json({ ok: true });
}
