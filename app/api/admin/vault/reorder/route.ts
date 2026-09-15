export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth";
import { reorderVaultEntries } from "@/lib/vault";

export async function PUT(request: NextRequest) {
  const err = await requireOwner(request);
  if (err) return err;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const orderedIds = Array.isArray((body as any)?.orderedIds) ? (body as any).orderedIds.map(String) : null;
  if (!orderedIds || orderedIds.length === 0) return NextResponse.json({ error: "orderedIds required" }, { status: 400 });
  await reorderVaultEntries(orderedIds);
  return NextResponse.json({ ok: true });
}
