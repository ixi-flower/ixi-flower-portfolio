export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireOwnerOrToken } from "@/lib/token-auth";
import { db } from "@/lib/db";
import { vaultEntries } from "@/lib/db/schema";
import { encryptVaultPassword } from "@/lib/vault-crypto";
import { eq } from "drizzle-orm";

type ImportEntry = { title?: unknown; site?: unknown; username?: unknown; password?: unknown; notes?: unknown };
function normalizeImport(raw: unknown): ImportEntry[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as ImportEntry[];
  if (typeof raw === "object" && raw !== null) {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.entries)) return o.entries as ImportEntry[];
    if (Array.isArray(o.vault)) return o.vault as ImportEntry[];
    if (Array.isArray(o.items)) return o.items as ImportEntry[];
  }
  return [];
}
function parseCSV(text: string): ImportEntry[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const hasHeader = /title/i.test(lines[0]) && /password/i.test(lines[0]);
  const rows = hasHeader ? lines.slice(1) : lines;
  const split = (line: string) => line.match(/(".*?"|[^",]+|(?<=,)(?=,))/g)?.map((s) => s.replace(/^"|"$/g, "").replace(/""/g, '"').trim()) ?? [];
  const entries: ImportEntry[] = [];
  for (const line of rows) {
    const cols = split(line);
    if (cols.length < 1 || cols.length > 5) continue;
    const [title, site, username, password, notes] = cols;
    if (!title && !password) continue;
    entries.push({ title, site, username, password, notes });
  }
  return entries;
}

export async function POST(request: NextRequest) {
  const auth = await requireOwnerOrToken(request, "vault:write");
  if (auth instanceof NextResponse) return auth;
  const contentType = request.headers.get("content-type") || "";
  let rawEntries: ImportEntry[] = [];
  let mode: "merge" | "replace" = "merge";
  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | unknown[] | null;
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    if (!Array.isArray(body) && typeof body === "object") {
      const m = (body as Record<string, unknown>).mode;
      if (m === "replace" || m === "merge") mode = m;
    }
    rawEntries = normalizeImport(body);
  } else if (contentType.includes("text/csv") || contentType.includes("text/plain")) {
    const text = await request.text();
    rawEntries = parseCSV(text);
    const m = request.nextUrl.searchParams.get("mode");
    if (m === "replace") mode = "replace";
  } else {
    const text = await request.text();
    try { const parsed = JSON.parse(text); rawEntries = normalizeImport(parsed); if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) { const m = (parsed as Record<string, unknown>).mode; if (m === "replace" || m === "merge") mode = m as any; } } catch { rawEntries = parseCSV(text); }
    const m2 = request.nextUrl.searchParams.get("mode");
    if (m2 === "replace") mode = "replace";
  }
  if (rawEntries.length === 0) return NextResponse.json({ error: "No entries found" }, { status: 400 });
  if (rawEntries.length > 500) return NextResponse.json({ error: "Too many (max 500)" }, { status: 400 });
  const valid: { title: string; site: string | null; username: string | null; password: string; notes: string | null }[] = [];
  const errors: string[] = [];
  for (let i = 0; i < rawEntries.length; i++) {
    const r = rawEntries[i];
    const title = String((r as any).title ?? "").trim();
    const password = String((r as any).password ?? "");
    if (!title) { errors.push(`row ${i + 1}: title required`); continue; }
    if (!password) { errors.push(`row ${i + 1}: password required`); continue; }
    if (title.length > 240) { errors.push(`row ${i + 1}: title too long`); continue; }
    if (password.length > 500) { errors.push(`row ${i + 1}: password too long`); continue; }
    valid.push({ title, site: (r as any).site != null ? String((r as any).site).trim().slice(0, 500) || null : null, username: (r as any).username != null ? String((r as any).username).trim().slice(0, 240) || null : null, password, notes: (r as any).notes != null ? String((r as any).notes).trim().slice(0, 500) || null : null });
  }
  if (errors.length) return NextResponse.json({ error: errors.slice(0, 10).join("; "), details: errors }, { status: 400 });
  if (mode === "replace") {
    if (request.nextUrl.searchParams.get("confirm") !== "1") return NextResponse.json({ error: "Replace requires ?confirm=1" }, { status: 400 });
    await db.delete(vaultEntries);
  }
  let startOrder = 0;
  if (mode === "merge") { const existing = await db.select().from(vaultEntries); startOrder = existing.length; }
  let inserted = 0;
  for (let i = 0; i < valid.length; i++) {
    const v = valid[i];
    const { ciphertext, iv, tag } = encryptVaultPassword(v.password);
    const id = crypto.randomUUID();
    const now = new Date();
    await db.insert(vaultEntries).values({ id, title: v.title, site: v.site, username: v.username, encCiphertext: ciphertext, encIv: iv, encTag: tag, notes: v.notes, sortOrder: startOrder + i, createdAt: now, updatedAt: now });
    inserted++;
  }
  return NextResponse.json({ ok: true, mode, inserted });
}
