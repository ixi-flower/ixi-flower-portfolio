export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";

type ImportNote = {
  id?: unknown
  parentId?: unknown
  title?: unknown
  content?: unknown
  icon?: unknown
  sortOrder?: unknown
}

function normalizeImport(raw: unknown): ImportNote[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw as ImportNote[]
  if (typeof raw === "object" && raw !== null) {
    const o = raw as Record<string, unknown>
    if (Array.isArray(o.notes)) return o.notes as ImportNote[]
    if (Array.isArray(o.entries)) return o.entries as ImportNote[]
    if (Array.isArray(o.items)) return o.items as ImportNote[]
  }
  return []
}

export async function POST(request: NextRequest) {
  const err = await requireOwner(request);
  if (err) return err;

  const contentType = request.headers.get("content-type") || ""
  let rawNotes: ImportNote[] = []
  let mode: "merge" | "replace" = "merge"

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | unknown[] | null
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    if (!Array.isArray(body) && typeof body === "object") {
      const m = (body as Record<string, unknown>).mode
      if (m === "replace" || m === "merge") mode = m
    }
    rawNotes = normalizeImport(body)
  } else {
    const text = await request.text()
    try {
      const parsed = JSON.parse(text)
      rawNotes = normalizeImport(parsed)
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        const m = (parsed as Record<string, unknown>).mode
        if (m === "replace" || m === "merge") mode = m as any
      }
    } catch {
      return NextResponse.json({ error: "Invalid JSON — send { notes: [{title,content?,icon?,parentId?,sortOrder?}] }" }, { status: 400 })
    }
    const qMode = request.nextUrl.searchParams.get("mode")
    if (qMode === "replace") mode = "replace"
  }

  if (rawNotes.length === 0) return NextResponse.json({ error: "No notes found — send { notes: [{title,content,icon,parentId}] }" }, { status: 400 })
  if (rawNotes.length > 500) return NextResponse.json({ error: "Too many notes (max 500 per import)" }, { status: 400 })

  const qConfirm = request.nextUrl.searchParams.get("confirm")
  if (mode === "replace" && qConfirm !== "1") {
    return NextResponse.json({ error: "Replace mode requires ?confirm=1 — this deletes all existing notes. Use merge to keep existing." }, { status: 400 })
  }

  // validate
  const valid: { oldId: string | null; title: string; content: string; icon: string | null; parentOldId: string | null; sortOrder: number }[] = []
  const errors: string[] = []
  for (let i = 0; i < rawNotes.length; i++) {
    const r = rawNotes[i] as any
    const title = String(r.title ?? "").trim()
    if (!title) { errors.push(`row ${i + 1}: title required`); continue }
    if (title.length > 240) { errors.push(`row ${i + 1}: title too long (max 240)`); continue }
    const content = r.content != null ? String(r.content) : ""
    if (content.length > 200000) { errors.push(`row ${i + 1}: content too long`); continue }
    const icon = r.icon != null ? String(r.icon).trim().slice(0, 40) || null : null
    const oldId = r.id != null ? String(r.id).trim() || null : null
    const parentOldId = r.parentId != null ? String(r.parentId).trim() || null : null
    const so = Number(r.sortOrder)
    const sortOrder = Number.isFinite(so) ? Math.max(0, Math.min(9999, Math.floor(so))) : i
    valid.push({ oldId, title, content, icon, parentOldId, sortOrder })
  }
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.slice(0, 10).join("; ") + (errors.length > 10 ? ` (+${errors.length - 10} more)` : ""), details: errors }, { status: 400 })
  }

  if (mode === "replace") {
    await db.delete(notes)
  }

  // Build oldId -> newId map (for hierarchy). Use existing oldId as key if present, else synthetic index key.
  const idMap = new Map<string, string>()
  const newRows: { id: string; oldId: string | null; title: string; content: string; icon: string | null; parentOldId: string | null; sortOrder: number }[] = []
  for (let i = 0; i < valid.length; i++) {
    const v = valid[i]
    const newId = crypto.randomUUID()
    const key = v.oldId ?? `__idx_${i}`
    // avoid collision if duplicate oldIds in file
    const mapKey = idMap.has(key) ? `${key}#${i}` : key
    if (v.oldId) idMap.set(v.oldId, newId)
    else idMap.set(mapKey, newId)
    newRows.push({ id: newId, oldId: v.oldId, title: v.title, content: v.content, icon: v.icon, parentOldId: v.parentOldId, sortOrder: v.sortOrder })
  }

  // Insert in parent-first order: iterative
  const existingIds = new Set<string>()
  if (mode === "merge") {
    const existing = await db.select({ id: notes.id }).from(notes)
    for (const r of existing) existingIds.add(r.id)
  }

  let inserted = 0
  const pending = [...newRows]
  // sort pending so parents with no parentOldId first
  pending.sort((a, b) => (a.parentOldId ? 1 : 0) - (b.parentOldId ? 1 : 0))

  let guard = 0
  while (pending.length > 0 && guard < 600) {
    guard++
    let progressed = false
    for (let i = pending.length - 1; i >= 0; i--) {
      const row = pending[i]
      let parentId: string | null = null
      if (row.parentOldId) {
        const mapped = idMap.get(row.parentOldId)
        if (mapped) parentId = mapped
        else if (existingIds.has(row.parentOldId)) parentId = row.parentOldId
        else {
          // orphan — attach to root
          parentId = null
        }
        // parent not yet inserted? defer
        if (mapped && pending.some(p => p.id === mapped)) continue
      }
      const now = new Date()
      await db.insert(notes).values({
        id: row.id,
        parentId,
        title: row.title,
        content: row.content,
        icon: row.icon,
        sortOrder: row.sortOrder,
        createdAt: now,
        updatedAt: now,
      })
      existingIds.add(row.id)
      pending.splice(i, 1)
      inserted++
      progressed = true
    }
    if (!progressed) {
      // cycle or missing parent — insert remaining as roots
      for (const row of [...pending]) {
        const now = new Date()
        await db.insert(notes).values({
          id: row.id,
          parentId: null,
          title: row.title,
          content: row.content,
          icon: row.icon,
          sortOrder: row.sortOrder,
          createdAt: now,
          updatedAt: now,
        })
        inserted++
      }
      break
    }
  }

  return NextResponse.json({ ok: true, mode, inserted, skipped: rawNotes.length - valid.length })
}
