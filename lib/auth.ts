import "server-only";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const JWT_COOKIE = "ixi_admin_token";

function getJwtSecret(): Uint8Array {
  const s = process.env.ADMIN_JWT_SECRET || process.env.ADMIN_SECRET || "dev-secret-change-me";
  return new TextEncoder().encode(s);
}

function getAdminSecret(): string | null {
  return process.env.ADMIN_SECRET || process.env.ADMIN_TOKEN || process.env.IXI_SECRET || null;
}

const SECRET_HEADERS = ["x-admin-secret", "x-ixi-secret", "x-admin-token"] as const;

function hasValidSecretHeader(request: Request): boolean {
  const secret = getAdminSecret();
  if (!secret) return false;
  for (const h of SECRET_HEADERS) {
    const v = request.headers.get(h);
    if (v && v === secret) return true;
  }
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    if (token === secret) return true;
  }
  return false;
}

function getCookieToken(request: Request): string | null {
  // NextRequest has .cookies, plain Request needs header parse
  const anyReq = request as unknown as { cookies?: { get?: (n: string) => { value: string } | undefined } };
  const fromNext = anyReq.cookies?.get?.(JWT_COOKIE)?.value;
  if (fromNext) return fromNext;
  const cookieHeader = request.headers.get("cookie") || "";
  const m = cookieHeader.match(new RegExp(`(?:^|;\\s*)${JWT_COOKIE}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

async function hasValidJwtCookie(request: Request): Promise<boolean> {
  const token = getCookieToken(request);
  if (!token) return false;
  try {
    await jwtVerify(token, getJwtSecret());
    return true;
  } catch {
    return false;
  }
}

function isStackConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_STACK_PROJECT_ID && process.env.STACK_SECRET_SERVER_KEY);
}

export function isOwner(email?: string | null): boolean {
  if (!email) return false;
  if (!ADMIN_EMAIL) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL;
}

export async function getOwnerFromRequest(request: Request): Promise<{ email: string } | null> {
  // 1) JWT cookie — primary (Neon Auth)
  if (await hasValidJwtCookie(request)) {
    // email comes from JWT payload, but we treat presence as owner (only owner has account)
    // Extract email from token for display
    const token = getCookieToken(request)!;
    try {
      const { payload } = await jwtVerify(token, getJwtSecret());
      const email = String((payload as Record<string, unknown>).email || ADMIN_EMAIL || "owner");
      return { email };
    } catch {
      return { email: ADMIN_EMAIL || "owner" };
    }
  }

  // 2) Stack Auth (hosted) when configured
  if (isStackConfigured()) {
    try {
      // @ts-ignore optional dep - only when Stack scaffold is present
      const mod: unknown = await import("@stackframe/stack" as string).catch(() => null);
      const stackApp = (mod as { stackServerApp?: { getUser: () => Promise<{ primaryEmail?: string; email?: string } | null> } } | null)?.stackServerApp ?? null;
      if (stackApp) {
        const user = await stackApp.getUser().catch(() => null);
        const email: string | null = user?.primaryEmail ?? user?.email ?? null;
        if (email && isOwner(email)) return { email };
        if (hasValidSecretHeader(request)) return { email: ADMIN_EMAIL || "owner@secret" };
        return null;
      }
    } catch {}
    if (hasValidSecretHeader(request)) return { email: ADMIN_EMAIL || "owner@secret" };
    return null;
  }

  // 3) Fallback: shared-secret header
  if (hasValidSecretHeader(request)) return { email: ADMIN_EMAIL || "owner@secret" };

  if (!getAdminSecret()) {
    const emailHeader = request.headers.get("x-admin-email");
    if (emailHeader && isOwner(emailHeader)) return { email: emailHeader };
  }
  return null;
}

export function isOwnerRequest(request: Request): boolean {
  if (hasValidSecretHeader(request)) return true;
  const cookieHeader = request.headers.get("cookie") || "";
  if (cookieHeader.includes(JWT_COOKIE + "=")) return true;
  if (!getAdminSecret()) {
    const emailHeader = request.headers.get("x-admin-email");
    if (emailHeader && isOwner(emailHeader)) return true;
  }
  return false;
}

export async function requireOwner(request: Request): Promise<NextResponse | null> {
  const owner = await getOwnerFromRequest(request);
  if (owner) return null;
  const hasAuthHeader =
    SECRET_HEADERS.some((h) => request.headers.get(h) !== null) ||
    request.headers.get("authorization") !== null ||
    request.headers.get("x-admin-email") !== null ||
    request.headers.get("cookie")?.includes(JWT_COOKIE) === true;
  const status = hasAuthHeader ? 403 : 401;
  const message = status === 401 ? "Unauthorized — missing owner credentials" : "Forbidden — invalid owner credentials";
  return NextResponse.json({ error: message }, { status });
}

export const getOwner = getOwnerFromRequest;
export const assertOwner = requireOwner;
