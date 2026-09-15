export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { vaultEntries } from "@/lib/db/schema";
import { decryptRow } from "@/lib/vault-crypto";

/**
 * Owner-only bulk export — decrypts every entry server-side.
 * This is the ONLY endpoint that bulk-reveals passwords; the
 * collection GET /api/admin/vault never does.
 */
export async function GET(request: NextRequest) {
  const err = await requireOwner(request);
  if (err) return err;
  const rows = await db.select().from(vaultEntries).orderBy(asc(vaultEntries.sortOrder));
  const entries = rows.map((r) => {
    try {
      const password = decryptRow(r);
      return {
        title: r.title,
        site: r.site,
        username: r.username,
        password,
        notes: r.notes,
      };
    } catch {
      // skip undecryptable rows (wrong key after rotation)
      return null;
    }
  }).filter(Boolean);
  return NextResponse.json(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      count: entries.length,
      entries,
    },
    { headers: { "Cache-Control": "no-store", "Content-Disposition": 'attachment; filename="ixi-vault-export.json"' } }
  );
}
