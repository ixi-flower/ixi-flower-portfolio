export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { reorderVaultEntries } from "@/lib/vault";
import { requireOwnerOrToken } from "@/lib/token-auth";
export async function PUT(request: NextRequest) {
  const auth = await requireOwnerOrToken(request, "vault:write");
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const ids = (body as any)?.orderedIds;
  if (!Array.isArray(ids)) return NextResponse.json({ error: "orderedIds string[] required" }, { status: 400 });
  await reorderVaultEntries(ids.map(String));
  return NextResponse.json({ ok: true });
}
