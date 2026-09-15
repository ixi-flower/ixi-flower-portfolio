export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { vaultEntries } from "@/lib/db/schema";
import { encryptVaultPassword } from "@/lib/vault-crypto";
import { getVaultEntries, toPublicVaultRow } from "@/lib/vault";

export async function GET(request: NextRequest) {
  const err = await requireOwner(request);
  if (err) return err;
  const q = request.nextUrl.searchParams.get("q") || undefined;
  const rows = await getVaultEntries(q);
  // never bulk-reveal passwords — per-entry GET /[id]?reveal=1 only
  return NextResponse.json({ entries: rows.map((r) => toPublicVaultRow(r)) });
}

export async function POST(request: NextRequest) {
  const err = await requireOwner(request);
  if (err) return err;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const title = String((body as any).title ?? "").trim();
  const password = String((body as any).password ?? "");
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
  if (!password) return NextResponse.json({ error: "password is required" }, { status: 400 });
  if (title.length > 240) return NextResponse.json({ error: "title too long" }, { status: 400 });
  if (password.length > 500) return NextResponse.json({ error: "password too long" }, { status: 400 });
  const site = (body as any).site != null ? String((body as any).site).trim().slice(0, 500) || null : null;
  const username = (body as any).username != null ? String((body as any).username).trim().slice(0, 240) || null : null;
  const notes = (body as any).notes != null ? String((body as any).notes).trim().slice(0, 500) || null : null;
  const { ciphertext, iv, tag } = encryptVaultPassword(password);
  const id = crypto.randomUUID();
  const now = new Date();
  await db.insert(vaultEntries).values({
    id,
    title,
    site,
    username,
    encCiphertext: ciphertext,
    encIv: iv,
    encTag: tag,
    notes,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
  });
  const rows = await db.select().from(vaultEntries).where((await import("drizzle-orm")).eq(vaultEntries.id, id)).limit(1);
  const row = rows[0];
  return NextResponse.json({ entry: row ? toPublicVaultRow(row, { reveal: true }) : { id, title } }, { status: 201 });
}
