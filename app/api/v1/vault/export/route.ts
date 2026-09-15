export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { vaultEntries } from "@/lib/db/schema";
import { decryptRow } from "@/lib/vault-crypto";
import { requireOwnerOrToken } from "@/lib/token-auth";

export async function GET(request: NextRequest) {
  const auth = await requireOwnerOrToken(request, "vault:reveal");
  if (auth instanceof NextResponse) return auth;
  const rows = await db.select().from(vaultEntries).orderBy(asc(vaultEntries.sortOrder));
  const entries = rows.map((r) => {
    try {
      const password = decryptRow(r);
      return { title: r.title, site: r.site, username: r.username, password, notes: r.notes };
    } catch { return null; }
  }).filter(Boolean);
  return NextResponse.json({ version: 1, exportedAt: new Date().toISOString(), count: entries.length, entries }, { headers: { "Cache-Control": "no-store" } });
}
