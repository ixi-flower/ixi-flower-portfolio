import "server-only";
import { asc, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { vaultEntries } from "@/lib/db/schema";
import { eq, like, or } from "drizzle-orm";
import { decryptRow } from "@/lib/vault-crypto";

export async function getVaultEntries(q?: string) {
  if (q?.trim()) {
    const pat = `%${q.trim()}%`;
    const rows = await db
      .select()
      .from(vaultEntries)
      .where(or(like(vaultEntries.title, pat), like(vaultEntries.site, pat), like(vaultEntries.username, pat)))
      .orderBy(asc(vaultEntries.sortOrder), desc(vaultEntries.updatedAt));
    return rows;
  }
  const rows = await db.select().from(vaultEntries).orderBy(asc(vaultEntries.sortOrder), desc(vaultEntries.updatedAt));
  return rows;
}

export async function getVaultEntryById(id: string) {
  const rows = await db.select().from(vaultEntries).where(eq(vaultEntries.id, id)).limit(1);
  return rows[0] ?? null;
}

export function toPublicVaultRow(row: typeof vaultEntries.$inferSelect, opts?: { reveal?: boolean }) {
  const base = {
    id: row.id,
    title: row.title,
    site: row.site,
    username: row.username,
    notes: row.notes,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
  if (opts?.reveal) {
    try {
      const password = decryptRow(row);
      return { ...base, password };
    } catch {
      return { ...base, password: "" };
    }
  }
  return { ...base, hasPassword: true };
}

export async function reorderVaultEntries(orderedIds: string[]) {
  for (let i = 0; i < orderedIds.length; i++) {
    await db.update(vaultEntries).set({ sortOrder: i, updatedAt: new Date() } as any).where(eq(vaultEntries.id, orderedIds[i]));
  }
}
