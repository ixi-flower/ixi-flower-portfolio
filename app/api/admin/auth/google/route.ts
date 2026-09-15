import { NextResponse } from "next/server";
import * as jose from "jose";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { signToken, cookieName, cookieMaxAge } from "@/lib/admin-auth";

const GOOGLE_JWKS = jose.createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

function getClientId(): string {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
    process.env.GOOGLE_CLIENT_ID?.trim() ||
    ""
  );
}

function getAdminEmail(): string {
  return (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
}

export async function POST(request: Request) {
  const clientId = getClientId();
  if (!clientId) {
    return NextResponse.json(
      { error: "Google login not configured — set NEXT_PUBLIC_GOOGLE_CLIENT_ID" },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const idToken = String(body.idToken || body.credential || body.token || "").trim();
  if (!idToken) return NextResponse.json({ error: "Missing ID token" }, { status: 400 });

  let payload: jose.JWTPayload;
  try {
    const verified = await jose.jwtVerify(idToken, GOOGLE_JWKS, {
      issuer: "https://accounts.google.com",
      audience: clientId,
    });
    payload = verified.payload;
  } catch (e1) {
    // google also issues iss = "accounts.google.com" without scheme
    try {
      const verified = await jose.jwtVerify(idToken, GOOGLE_JWKS, {
        audience: clientId,
      });
      const iss = String(verified.payload.iss || "");
      if (iss !== "https://accounts.google.com" && iss !== "accounts.google.com") {
        throw new Error(`bad iss: ${iss}`);
      }
      payload = verified.payload;
    } catch (e2) {
      const msg = e2 instanceof Error ? e2.message : String(e2 ?? e1);
      return NextResponse.json({ error: `Invalid Google token: ${msg}` }, { status: 401 });
    }
  }

  const email = String(payload.email || "").trim().toLowerCase();
  const emailVerified = payload.email_verified as boolean | undefined;
  if (!email) return NextResponse.json({ error: "Google token has no email" }, { status: 400 });
  if (emailVerified === false) return NextResponse.json({ error: "Google email not verified" }, { status: 400 });

  // owner gate: must match ADMIN_EMAIL or exist in admin_users
  const adminEmail = getAdminEmail();
  let user: typeof adminUsers.$inferSelect | null = null;
  try {
    const rows = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
    user = rows[0] ?? null;
  } catch {
    user = null;
  }
  const isOwner = Boolean((adminEmail && email === adminEmail) || user);
  if (!isOwner) {
    return NextResponse.json({ error: "Not authorized — owner only" }, { status: 403 });
  }

  // auto-provision row for ADMIN_EMAIL if missing (so change-email/password stay consistent)
  if (!user && adminEmail && email === adminEmail) {
    try {
      // passwordHash placeholder — Google-only owner can still set a password via change-password
      // use bcrypt hash of random so login-by-password fails until they set one
      const bcrypt = await import("bcryptjs");
      const ph = await bcrypt.hash(`google-${Date.now()}-${Math.random()}`, 10);
      const inserted = await db
        .insert(adminUsers)
        .values({ email, passwordHash: ph })
        .returning();
      user = inserted[0] ?? null;
    } catch {
      // ignore — sign token anyway
    }
  }

  const sub = user?.id ?? 0;
  const token = await signToken({ email, sub });

  const res = NextResponse.json({ ok: true, email });
  res.cookies.set(cookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: cookieMaxAge(),
  });
  return res;
}
