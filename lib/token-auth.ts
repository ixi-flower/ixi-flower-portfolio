import "server-only";
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { hashToken, lookupTokenByHash, touchToken, hasScope } from "@/lib/api-tokens";
import type { Scope } from "@/lib/api-tokens";

function extractBearer(request: Request): string | null {
  const h = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (m) return m[1].trim();
  // also allow x-api-token header
  return null;
}

function extractToken(request: Request): string | null {
  const bearer = extractBearer(request);
  if (bearer) return bearer;
  const alt = request.headers.get("x-api-token")?.trim();
  if (alt) return alt;
  // query fallback ?token= (convenience, not logged)
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("token")?.trim();
    if (q) return q;
  } catch {}
  return null;
}

export type TokenAuth = {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
};

export async function getTokenAuth(request: Request): Promise<TokenAuth | null> {
  const raw = extractToken(request);
  if (!raw) return null;
  if (!raw.startsWith("ixi_pat_")) return null;
  const hash = hashToken(raw);
  const row = await lookupTokenByHash(hash);
  if (!row) return null;
  // fire-and-forget touch (don't await to not block)
  touchToken(row.id).catch(() => {});
  return { id: row.id, name: row.name, prefix: row.prefix, scopes: row.scopes as string[] };
}

export async function requireToken(
  request: Request,
  requiredScope: Scope | string
): Promise<{ auth: TokenAuth } | NextResponse> {
  const auth = await getTokenAuth(request);
  if (!auth) {
    return NextResponse.json(
      { error: "Unauthorized — missing or invalid API token. Send Authorization: Bearer ixi_pat_..." },
      { status: 401, headers: { "WWW-Authenticate": 'Bearer realm="ixi-wave"' } }
    );
  }
  if (!hasScope(auth.scopes, requiredScope)) {
    return NextResponse.json(
      { error: `Forbidden — token missing scope "${requiredScope}". Token scopes: ${(auth.scopes as string[]).join(", ")}` },
      { status: 403 }
    );
  }
  return { auth };
}

// Allow either owner JWT cookie OR valid token with scope
export async function requireOwnerOrToken(
  request: Request,
  requiredScope: Scope | string
): Promise<{ via: "owner" | "token"; token?: TokenAuth } | NextResponse> {
  // try owner first (reuse lib/auth)
  const { getOwnerFromRequest } = await import("@/lib/auth");
  const owner = await getOwnerFromRequest(request);
  if (owner) return { via: "owner" };
  // fall back to token
  const res = await requireToken(request, requiredScope);
  if (res instanceof NextResponse) return res;
  return { via: "token", token: res.auth };
}
