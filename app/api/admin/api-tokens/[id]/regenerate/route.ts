export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth";
import { regenerateApiToken } from "@/lib/api-tokens";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const err = await requireOwner(request);
  if (err) return err;
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const res = await regenerateApiToken(id);
  if (!res) return NextResponse.json({ error: "Token not found" }, { status: 404 });
  return NextResponse.json(
    { token: res.plaintext, prefix: res.prefix, id: res.id, name: res.name, scopes: res.scopes, warning: "Copy now — plaintext shown only once." },
    { headers: { "Cache-Control": "no-store" } },
  );
}
