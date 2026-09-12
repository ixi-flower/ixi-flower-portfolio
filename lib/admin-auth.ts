import "server-only";
import * as jose from "jose";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { adminUsers } from "./db/schema";
import { eq } from "drizzle-orm";

const COOKIE = "ixi_admin_token";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): Uint8Array {
  const s = process.env.ADMIN_JWT_SECRET || process.env.ADMIN_SECRET || "dev-secret-change-me";
  return new TextEncoder().encode(s);
}

export async function signToken(payload: { email: string; sub?: number }) {
  return await new jose.SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.sub ?? 0))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<{ email: string } | null> {
  try {
    const { payload } = await jose.jwtVerify(token, getSecret());
    const email = (payload.email as string) || "";
    if (!email) return null;
    return { email: email.toLowerCase() };
  } catch {
    return null;
  }
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export function cookieName() { return COOKIE; }
export function cookieMaxAge() { return MAX_AGE; }

export async function getAdminByEmail(email: string) {
  const rows = await db.select().from(adminUsers).where(eq(adminUsers.email, email.toLowerCase())).limit(1);
  return rows[0] ?? null;
}
