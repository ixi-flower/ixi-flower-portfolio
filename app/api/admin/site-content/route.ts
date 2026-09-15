export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth";
import { getAllSiteContent, getSiteContent, isValidKey, setSiteContent, validateSiteContent } from "@/lib/site-content";

export async function GET(request: NextRequest) {
  const err = await requireOwner(request);
  if (err) return err;

  const key = request.nextUrl.searchParams.get("key")?.trim();
  if (key) {
    if (!isValidKey(key)) {
      return NextResponse.json({ error: "Invalid key — expected playlist | waka | tech | courses | profile | banner" }, { status: 400 });
    }
    const value = await getSiteContent(key);
    return NextResponse.json({ key, value });
  }
  const all = await getAllSiteContent();
  return NextResponse.json(all);
}

export async function PUT(request: NextRequest) {
  const err = await requireOwner(request);
  if (err) return err;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body.key !== "string" || body.value === undefined) {
    return NextResponse.json({ error: "Expected { key: string, value: unknown }" }, { status: 400 });
  }
  const key = String(body.key).trim();
  if (!isValidKey(key)) {
    return NextResponse.json({ error: "Invalid key — expected playlist | waka | tech | courses | profile | banner" }, { status: 400 });
  }

  const parsed = validateSiteContent(key, body.value);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    return NextResponse.json({ error: msg || "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const saved = await setSiteContent(key, parsed.data);
    return NextResponse.json({ ok: true, key, value: saved });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Save failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
