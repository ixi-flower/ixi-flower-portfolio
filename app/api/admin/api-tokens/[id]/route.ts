export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth";
import { deleteApiToken } from "@/lib/api-tokens";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const err = await requireOwner(request);
  if (err) return err;
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const ok = await deleteApiToken(id);
  if (!ok) return NextResponse.json({ error: "Token not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
