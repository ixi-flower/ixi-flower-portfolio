import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, getAdminByEmail, verifyPassword, hashPassword, signToken, cookieName, cookieMaxAge } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const token = (await cookies()).get(cookieName())?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const current = String((body as any).current || "");
  const rawNew = String((body as any).newEmail || (body as any).email || "").trim().toLowerCase();

  if (!current || !rawNew) return NextResponse.json({ error: "Current password and new email required" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawNew)) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  if (rawNew.length > 240) return NextResponse.json({ error: "Email too long" }, { status: 400 });

  const user = await getAdminByEmail(payload.email);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const ok = await verifyPassword(current, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Current password incorrect" }, { status: 400 });

  if (rawNew === user.email.toLowerCase()) return NextResponse.json({ error: "New email is same as current" }, { status: 400 });

  const existing = await getAdminByEmail(rawNew);
  if (existing) return NextResponse.json({ error: "That email already has an account" }, { status: 409 });

  await db.update(adminUsers).set({ email: rawNew, updatedAt: new Date() }).where(eq(adminUsers.id, user.id));

  const newToken = await signToken({ email: rawNew, sub: user.id });
  const res = NextResponse.json({ ok: true, email: rawNew });
  res.cookies.set(cookieName(), newToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: cookieMaxAge(),
  });
  return res;
}
