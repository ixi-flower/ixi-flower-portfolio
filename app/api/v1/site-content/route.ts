export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAllSiteContent, getSiteContent, isValidKey, setSiteContent, validateSiteContent } from "@/lib/site-content";
import { requireOwnerOrToken } from "@/lib/token-auth";

export async function GET(request: NextRequest) {
  const auth = await requireOwnerOrToken(request, "site-content:read");
  if (auth instanceof NextResponse) return auth;
  const key = request.nextUrl.searchParams.get("key")?.trim();
  if (key) {
    if (!isValidKey(key)) return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    const value = await getSiteContent(key);
    return NextResponse.json({ key, value });
  }
  const all = await getAllSiteContent();
  return NextResponse.json(all);
}

export async function PUT(request: NextRequest) {
  const auth = await requireOwnerOrToken(request, "site-content:write");
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body.key !== "string" || body.value === undefined) return NextResponse.json({ error: "Expected { key, value }" }, { status: 400 });
  const key = String(body.key).trim();
  if (!isValidKey(key)) return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  const parsed = validateSiteContent(key, body.value);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    return NextResponse.json({ error: msg, issues: parsed.error.issues }, { status: 400 });
  }
  const saved = await setSiteContent(key, parsed.data);
  return NextResponse.json({ ok: true, key, value: saved });
}
