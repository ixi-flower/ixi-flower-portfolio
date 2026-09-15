export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { postReactions, posts } from "@/lib/db/schema";

function getFingerprint(req: NextRequest, bodyFp?: string): string {
  const h = req.headers.get("x-fingerprint") || bodyFp || "";
  if (h && h.length >= 8 && h.length <= 120 && /^[a-zA-Z0-9._-]+$/.test(h)) return h;
  // fallback: ip hash
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "0.0.0.0";
  const ua = req.headers.get("user-agent") || "";
  // simple hash
  let hex = "";
  const s = `${ip}|${ua.slice(0, 80)}`;
  let h2 = 0;
  for (let i = 0; i < s.length; i++) h2 = (Math.imul(31, h2) + s.charCodeAt(i)) | 0;
  hex = `ip-${Math.abs(h2).toString(36)}`;
  return hex;
}

export async function GET(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get("postId") || req.nextUrl.searchParams.get("id");
  if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 });
  const fp = getFingerprint(req);
  const rows = await db.select({ kind: postReactions.kind }).from(postReactions).where(eq(postReactions.postId, postId));
  const likes = rows.filter((r) => r.kind === "like").length;
  const dislikes = rows.filter((r) => r.kind === "dislike").length;
  const mineRow = await db
    .select({ kind: postReactions.kind })
    .from(postReactions)
    .where(and(eq(postReactions.postId, postId), eq(postReactions.fingerprint, fp)))
    .limit(1);
  const mine = mineRow[0]?.kind ?? null;
  return NextResponse.json({ likes, dislikes, mine });
}

export async function POST(req: NextRequest) {
  let body: { postId?: string; kind?: string; fingerprint?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const postId = (body.postId || "").trim();
  const kind = (body.kind || "").trim();
  if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 });
  if (kind !== "like" && kind !== "dislike") return NextResponse.json({ error: "kind must be like|dislike" }, { status: 400 });

  // verify post exists
  const p = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId)).limit(1);
  if (!p.length) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const fp = getFingerprint(req, body.fingerprint);

  const existing = await db
    .select({ id: postReactions.id, kind: postReactions.kind })
    .from(postReactions)
    .where(and(eq(postReactions.postId, postId), eq(postReactions.fingerprint, fp)))
    .limit(1);

  if (existing.length) {
    if (existing[0].kind === kind) {
      // toggle off
      await db.delete(postReactions).where(eq(postReactions.id, existing[0].id));
    } else {
      // switch
      await db.update(postReactions).set({ kind }).where(eq(postReactions.id, existing[0].id));
    }
  } else {
    await db.insert(postReactions).values({ postId, fingerprint: fp, kind });
  }

  const rows = await db.select({ kind: postReactions.kind }).from(postReactions).where(eq(postReactions.postId, postId));
  const likes = rows.filter((r) => r.kind === "like").length;
  const dislikes = rows.filter((r) => r.kind === "dislike").length;
  const mineRow = await db
    .select({ kind: postReactions.kind })
    .from(postReactions)
    .where(and(eq(postReactions.postId, postId), eq(postReactions.fingerprint, fp)))
    .limit(1);
  const mine = mineRow[0]?.kind ?? null;
  return NextResponse.json({ likes, dislikes, mine });
}
