export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";

export async function GET(request: NextRequest) {
  const err = await requireOwner(request);
  if (err) return err;
  const rows = await db.select().from(notes).orderBy(asc(notes.sortOrder), asc(notes.createdAt));
  const data = rows.map((r) => ({
    id: r.id,
    parentId: r.parentId,
    title: r.title,
    content: r.content,
    icon: r.icon,
    sortOrder: r.sortOrder,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
  return NextResponse.json(
    { version: 1, exportedAt: new Date().toISOString(), count: data.length, notes: data },
    { headers: { "Cache-Control": "no-store", "Content-Disposition": 'attachment; filename="ixi-notes-export.json"' } },
  );
}
