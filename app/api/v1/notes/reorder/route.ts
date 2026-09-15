export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { reorderNotes } from "@/lib/notes";
import { requireOwnerOrToken } from "@/lib/token-auth";

export async function PUT(request: NextRequest) {
  const auth = await requireOwnerOrToken(request, "notes:write");
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const ids = (body as any)?.orderedIds;
  if (!Array.isArray(ids)) return NextResponse.json({ error: "orderedIds string[] required" }, { status: 400 });
  await reorderNotes(ids.map(String));
  return NextResponse.json({ ok: true });
}
