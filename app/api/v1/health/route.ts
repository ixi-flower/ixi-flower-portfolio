export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getTokenAuth } from "@/lib/token-auth";

export async function GET(request: NextRequest) {
  const auth = await getTokenAuth(request);
  return NextResponse.json({
    ok: true,
    service: "ixi-wave",
    version: "1.0.0",
    auth: auth ? { via: "token", name: auth.name, prefix: auth.prefix, scopes: auth.scopes } : { via: "none" },
    docs: "/api/v1/docs",
  });
}
