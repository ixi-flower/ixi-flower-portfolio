export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getVaultEntryById, toPublicVaultRow } from "@/lib/vault";
import { db } from "@/lib/db";
import { vaultEntries } from "@/lib/db/schema";
import { encryptVaultPassword } from "@/lib/vault-crypto";
import { eq } from "drizzle-orm";
import { requireOwnerOrToken } from "@/lib/token-auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reveal = request.nextUrl.searchParams.get("reveal") === "1";
  // reveal requires vault:reveal, plain read requires vault:read
  const scope = reveal ? "vault:reveal" : "vault:read";
  const auth = await requireOwnerOrToken(request, scope);
  if (auth instanceof NextResponse) return auth;
  const row = await getVaultEntryById(id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ entry: toPublicVaultRow(row, { reveal }) });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwnerOrToken(request, "vault:write");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const existing = await getVaultEntryById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if ((body as any).title !== undefined) {
    const t = String((body as any).title).trim();
    if (!t) return NextResponse.json({ error: "title required" }, { status: 400 });
    patch.title = t.slice(0, 240);
  }
  if ((body as any).site !== undefined) patch.site = (body as any).site == null ? null : String((body as any).site).trim().slice(0, 500) || null;
  if ((body as any).username !== undefined) patch.username = (body as any).username == null ? null : String((body as any).username).trim().slice(0, 240) || null;
  if ((body as any).notes !== undefined) patch.notes = (body as any).notes == null ? null : String((body as any).notes).trim().slice(0, 500) || null;
  if ((body as any).password !== undefined && String((body as any).password)) {
    const pw = String((body as any).password);
    if (pw.length > 500) return NextResponse.json({ error: "password too long" }, { status: 400 });
    const { ciphertext, iv, tag } = encryptVaultPassword(pw);
    patch.encCiphertext = ciphertext; patch.encIv = iv; patch.encTag = tag;
  }
  await db.update(vaultEntries).set(patch as any).where(eq(vaultEntries.id, id));
  const updated = await getVaultEntryById(id);
  return NextResponse.json({ entry: updated ? toPublicVaultRow(updated) : null });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwnerOrToken(request, "vault:write");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const existing = await getVaultEntryById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.delete(vaultEntries).where(eq(vaultEntries.id, id));
  return NextResponse.json({ ok: true });
}
