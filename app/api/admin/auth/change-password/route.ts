import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, cookieName, getAdminByEmail, verifyPassword, hashPassword } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const token = (await cookies()).get(cookieName())?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const current = String(body.current || "");
  const next = String(body.next || "");

  if (!current || !next) return NextResponse.json({ error: "Current and new password required" }, { status: 400 });
  if (next.length < 6) return NextResponse.json({ error: "New password too short (min 6)" }, { status: 400 });
  if (next.length > 128) return NextResponse.json({ error: "New password too long" }, { status: 400 });

  const user = await getAdminByEmail(payload.email);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const ok = await verifyPassword(current, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Current password incorrect" }, { status: 400 });

  const hash = await hashPassword(next);
  await db.update(adminUsers).set({ passwordHash: hash, updatedAt: new Date() }).where(eq(adminUsers.id, user.id));

  return NextResponse.json({ ok: true });
}
