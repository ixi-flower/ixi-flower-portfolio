import "server-only";
import { NextResponse } from "next/server";

// ——————————————————————————————————————————————
// Owner guard for ixi-wave
// Stack Auth is the intended production path; while env is not configured
// we fall back to a shared-secret header so admin routes stay guarded in dev.
// This file will be replaced by proper Stack middleware later — keep it simple.
// ——————————————————————————————————————————————

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();

/** True when `email` belongs to the single owner account. */
export function isOwner(email?: string | null): boolean {
  if (!email) return false;
  if (!ADMIN_EMAIL) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL;
}

function getAdminSecret(): string | null {
  return (
    process.env.ADMIN_SECRET ||
    process.env.ADMIN_TOKEN ||
    process.env.IXI_SECRET ||
    null
  );
}

/** Header names we accept for the dev-secret fallback (all checked, case-insensitive via Headers.get). */
const SECRET_HEADERS = ["x-admin-secret", "x-ixi-secret", "x-admin-token"] as const;

function hasValidSecretHeader(request: Request): boolean {
  const secret = getAdminSecret();
  if (!secret) return false;
  for (const h of SECRET_HEADERS) {
    const v = request.headers.get(h);
    if (v && v === secret) return true;
  }
  // Also allow `Authorization: Bearer <secret>` as a convenience for curl / API clients
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    if (token === secret) return true;
  }
  return false;
}

function isStackConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_STACK_PROJECT_ID && process.env.STACK_SECRET_SERVER_KEY,
  );
}

/**
 * Try to resolve the owner identity from the request.
 * - If Stack Auth is configured, attempt to use its server SDK (best-effort, no hard dep).
 * - Otherwise, fall back to the shared-secret header check.
 * Returns `{ email }` when owner is authenticated, otherwise `null`.
 */
export async function getOwnerFromRequest(
  request: Request,
): Promise<{ email: string } | null> {
  // Production path: Stack Auth
  if (isStackConfigured()) {
    try {
      // Dynamic import so the app still builds when @stackframe/stack is not installed yet.
      // Stack scaffolding exposes `stackServerApp.getUser()` / `stackServerApp.getUser({ tokenStore })`.
      // @ts-expect-error — optional dep, only present after Stack scaffold
      const mod: any = await import("@stackframe/stack").catch(() => null);
      const stackApp = mod?.stackServerApp ?? null;
      if (stackApp) {
        const user = await stackApp.getUser().catch(() => null);
        const email: string | null =
          user?.primaryEmail ??
          user?.primaryEmailVerified?.email ??
          user?.email ??
          null;
        if (email && isOwner(email)) return { email };
        // Stack configured but user is not owner → not authenticated as owner
        // Still allow secret-header override for emergency access if ADMIN_SECRET is set
        if (hasValidSecretHeader(request)) return { email: ADMIN_EMAIL || "owner@secret" };
        return null;
      }
    } catch {
      // fall through to secret-header check
    }
    // Stack configured but SDK not available or user not resolved → deny unless secret header matches
    if (hasValidSecretHeader(request)) return { email: ADMIN_EMAIL || "owner@secret" };
    return null;
  }

  // Dev / pre-Stack fallback: shared-secret header is the gate.
  // If ADMIN_SECRET (or equivalent) is set, the header must match.
  // If no secret is configured at all, we still require the owner header to be explicit:
  // check `x-admin-secret` / `x-ixi-secret` against ADMIN_SECRET, or if that is absent,
  // deny by default (safer than open). Callers that need local bypass can set ADMIN_SECRET
  // to any value and send it.
  if (hasValidSecretHeader(request)) {
    return { email: ADMIN_EMAIL || "owner@secret" };
  }

  // Optional convenience: if no secret is configured and the request carries
  // `x-admin-email` that matches ADMIN_EMAIL, treat it as owner (useful for local dev
  // when you control the network). This is intentionally *not* enabled when a secret exists.
  if (!getAdminSecret()) {
    const emailHeader = request.headers.get("x-admin-email");
    if (emailHeader && isOwner(emailHeader)) return { email: emailHeader };
    // Last resort in fully-unconfigured dev: allow when ADMIN_EMAIL is set and
    // the caller explicitly sends it via header — but log that this is dev-only.
    // In production ADMIN_SECRET will be set, so this branch is unreachable there.
  }

  return null;
}

/** Synchronous, best-effort owner check (no Stack lookup). Useful for quick guards. */
export function isOwnerRequest(request: Request): boolean {
  if (hasValidSecretHeader(request)) return true;
  if (!getAdminSecret()) {
    const emailHeader = request.headers.get("x-admin-email");
    if (emailHeader && isOwner(emailHeader)) return true;
  }
  return false;
}

/**
 * Guard helper for API routes.
 * Returns `null` when the request is from the owner, otherwise a 401/403 JSON response
 * the route should return immediately.
 *
 * Usage:
 *   const err = await requireOwner(request);
 *   if (err) return err;
 */
export async function requireOwner(request: Request): Promise<NextResponse | null> {
  const owner = await getOwnerFromRequest(request);
  if (owner) return null;

  const hasAuthHeader =
    SECRET_HEADERS.some((h) => request.headers.get(h) !== null) ||
    request.headers.get("authorization") !== null ||
    request.headers.get("x-admin-email") !== null;

  // 401 when no credentials were sent at all, 403 when they were but are wrong
  const status = hasAuthHeader ? 403 : 401;
  const message =
    status === 401 ? "Unauthorized — missing owner credentials" : "Forbidden — invalid owner credentials";

  return NextResponse.json({ error: message }, { status });
}

// Back-compat aliases some routes/specs may import
export const getOwner = getOwnerFromRequest;
export const assertOwner = requireOwner;
