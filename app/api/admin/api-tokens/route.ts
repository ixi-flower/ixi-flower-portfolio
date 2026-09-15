export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth";
import { listApiTokens, createApiToken, normalizeScopes, ALL_SCOPES } from "@/lib/api-tokens";

export async function GET(request: NextRequest) {
  const err = await requireOwner(request);
  if (err) return err;
  const tokens = await listApiTokens();
  return NextResponse.json({ tokens, scopes: [...ALL_SCOPES] });
}

export async function POST(request: NextRequest) {
  const err = await requireOwner(request);
  if (err) return err;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const name = String((body as any).name ?? "").trim();
  if (!name) return NextResponse.json({ error: "name is required (e.g. My CI)" }, { status: 400 });
  if (name.length > 120) return NextResponse.json({ error: "name too long (max 120)" }, { status: 400 });
  const scopes = normalizeScopes((body as any).scopes ?? (body as any).scope);
  // validate scopes were valid (normalize already falls back to * if junk)
  let expiresAt: Date | null = null;
  const expRaw = (body as any).expiresAt;
  if (expRaw) {
    const d = new Date(String(expRaw));
    if (isNaN(d.getTime())) return NextResponse.json({ error: "expiresAt must be ISO date" }, { status: 400 });
    if (d.getTime() <= Date.now()) return NextResponse.json({ error: "expiresAt must be in the future" }, { status: 400 });
    expiresAt = d;
  }
  const created = await createApiToken({ name, scopes, expiresAt });
  // plaintext is shown ONLY here — never stored, only hash in DB
  return NextResponse.json(
    {
      token: created.plaintext,
      id: created.id,
      name: created.name,
      prefix: created.prefix,
      scopes: created.scopes,
      expiresAt: created.expiresAt,
      warning: "Copy this token now — it will never be shown again. Store it securely.",
    },
    { status: 201, headers: { "Cache-Control": "no-store" } }
  );
}
