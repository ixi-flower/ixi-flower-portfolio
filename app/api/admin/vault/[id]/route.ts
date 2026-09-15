export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { vaultEntries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { encryptVaultPassword, decryptRow } from "@/lib/vault-crypto";
import { toPublicVaultRow } from "@/lib/vault";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const err = await requireOwner(request);
  if (err) return err;
  const { id } = await params;
  const rows = await db.select().from(vaultEntries).where(eq(vaultEntries.id, id)).limit(1);
  const row = rows[0];
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const reveal = request.nextUrl.searchParams.get("reveal") === "1";
  // Only reveal decrypted password when explicitly requested
  if (reveal) {
    try {
      const password = decryptRow(row);
      return NextResponse.json({ entry: { ...toPublicVaultRow(row, { reveal: false }), password } });
    } catch {
      return NextResponse.json({ error: "Decrypt failed — check ADMIN_JWT_SECRET" }, { status: 500 });
    }
  }
  return NextResponse.json({ entry: toPublicVaultRow(row) });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const err = await requireOwner(request);
  if (err) return err;
  const { id } = await params;
  const existing = await db.select().from(vaultEntries).where(eq(vaultEntries.id, id)).limit(1);
  if (!existing[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if ("title" in body) {
    const v = String((body as any).title ?? "").trim();
    if (!v) return NextResponse.json({ error: "title required" }, { status: 400 });
    patch.title = v.slice(0, 240);
  }
  if ("site" in body) patch.site = (body as any).site != null ? String((body as any).site).trim().slice(0, 500) || null : null;
  if ("username" in body) patch.username = (body as any).username != null ? String((body as any).username).trim().slice(0, 240) || null : null;
  if ("notes" in body) patch.notes = (body as any).notes != null ? String((body as any).notes).trim().slice(0, 500) || null : null;
  if ("password" in body) {
    const pw = String((body as any).password ?? "");
    if (!pw) return NextResponse.json({ error: "password required" }, { status: 400 });
    if (pw.length > 500) return NextResponse.json({ error: "password too long" }, { status: 400 });
    const { ciphertext, iv, tag } = encryptVaultPassword(pw);
    (patch as any).encCiphertext = ciphertext;
    (patch as any).encIv = iv;
    (patch as any).encTag = tag;
  }
  await db.update(vaultEntries).set(patch as any).where(eq(vaultEntries.id, id));
  const rows = await db.select().from(vaultEntries).where(eq(vaultEntries.id, id)).limit(1);
  return NextResponse.json({ entry: toPublicVaultRow(rows[0]!) });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const err = await requireOwner(request);
  if (err) return err;
  const { id } = await params;
  const r: any = await db.delete(vaultEntries).where(eq(vaultEntries.id, id));
  if (r?.rowCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
