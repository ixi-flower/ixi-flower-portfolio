import "server-only";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { apiTokens } from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// Scopes — the bridge covers 100% of site entities
// ---------------------------------------------------------------------------
export const ALL_SCOPES = [
  "*",
  "blog:read",
  "blog:write",
  "notes:read",
  "notes:write",
  "bookmarks:read",
  "bookmarks:write",
  "vault:read",
  "vault:reveal",
  "vault:write",
  "site-content:read",
  "site-content:write",
  "upload:write",
] as const;

export type Scope = (typeof ALL_SCOPES)[number];

export function isValidScope(s: string): s is Scope {
  return (ALL_SCOPES as readonly string[]).includes(s);
}

export function normalizeScopes(input: unknown): string[] {
  if (!input) return ["*"];
  const arr = Array.isArray(input) ? input : [input];
  const out = arr.map(String).map((s) => s.trim()).filter(Boolean);
  if (out.includes("*")) return ["*"];
  const valid = out.filter(isValidScope);
  return valid.length ? [...new Set(valid)] : ["*"];
}

export function hasScope(tokenScopes: string[], required: Scope | string): boolean {
  if (tokenScopes.includes("*")) return true;
  if (tokenScopes.includes(required)) return true;
  // vault:reveal implies vault:read
  if (required === "vault:read" && tokenScopes.includes("vault:reveal")) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Token generation + hashing
// ---------------------------------------------------------------------------
const PREFIX = "ixi_pat_";

export function hashToken(plaintext: string): string {
  return crypto.createHash("sha256").update(plaintext).digest("hex");
}

export function generateToken(): { plaintext: string; hash: string; prefix: string } {
  const rand = crypto.randomBytes(24).toString("hex"); // 48 hex chars
  const plaintext = `${PREFIX}${rand}`;
  const hash = hashToken(plaintext);
  const prefix = `${PREFIX}${rand.slice(0, 8)}`;
  return { plaintext, hash, prefix };
}

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------
export async function createApiToken(opts: {
  name: string;
  scopes: string[];
  expiresAt?: Date | null;
}): Promise<{ id: string; name: string; prefix: string; scopes: string[]; plaintext: string; expiresAt: Date | null }> {
  const { plaintext, hash, prefix } = generateToken();
  const id = crypto.randomUUID();
  const now = new Date();
  await db.insert(apiTokens).values({
    id,
    name: opts.name.trim().slice(0, 120),
    tokenHash: hash,
    prefix,
    scopes: opts.scopes,
    expiresAt: opts.expiresAt ?? null,
    createdAt: now,
    updatedAt: now,
  });
  return { id, name: opts.name.trim().slice(0, 120), prefix, scopes: opts.scopes, plaintext, expiresAt: opts.expiresAt ?? null };
}

export async function listApiTokens() {
  const rows = await db.select().from(apiTokens).orderBy(apiTokens.createdAt);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    prefix: r.prefix,
    scopes: r.scopes as string[],
    lastUsedAt: r.lastUsedAt,
    expiresAt: r.expiresAt,
    createdAt: r.createdAt,
  }));
}

export async function deleteApiToken(id: string) {
  const rows = await db.select().from(apiTokens).where(eq(apiTokens.id, id)).limit(1);
  if (!rows.length) return false;
  await db.delete(apiTokens).where(eq(apiTokens.id, id));
  return true;
}

export async function regenerateApiToken(id: string) {
  const rows = await db.select().from(apiTokens).where(eq(apiTokens.id, id)).limit(1);
  if (!rows.length) return null;
  const row = rows[0] as typeof rows[number];
  const { plaintext, hash, prefix } = generateToken();
  await db
    .update(apiTokens)
    .set({ tokenHash: hash, prefix, lastUsedAt: null, updatedAt: new Date() })
    .where(eq(apiTokens.id, id));
  return {
    id: row.id,
    name: row.name,
    prefix,
    scopes: row.scopes as string[],
    plaintext,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  };
}

export async function lookupTokenByHash(hash: string) {
  const rows = await db.select().from(apiTokens).where(eq(apiTokens.tokenHash, hash)).limit(1);
  if (!rows.length) return null;
  const row = rows[0] as typeof rows[number];
  // expiry check
  if (row.expiresAt && new Date(row.expiresAt).getTime() < Date.now()) return null;
  return row;
}

export async function touchToken(id: string) {
  await db.update(apiTokens).set({ lastUsedAt: new Date(), updatedAt: new Date() }).where(eq(apiTokens.id, id));
}
