export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireOwner } from '@/lib/auth'
import { getAllBookmarks, createBookmark } from '@/lib/notes'

const STORI_TOKEN = 'stori_071605bfc09e1905bb68e1e07102c406869880c06e139861'
const STORI_BASE = 'https://storipalorium.vercel.app/api/v1'

export async function POST(request: NextRequest) {
  const err = await requireOwner(request)
  if (err) return err

  let token = STORI_TOKEN
  try {
    const body = await request.json().catch(() => null) as Record<string, unknown> | null
    if (body && typeof (body as any).token === 'string' && (body as any).token.trim()) {
      token = String((body as any).token).trim()
    }
  } catch {}

  let storiItems: Array<{ id: string; title: string; link: string; category: string; tags: string }> = []
  try {
    const r = await fetch(`${STORI_BASE}/items`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!r.ok) {
      const txt = await r.text().catch(() => '')
      return NextResponse.json({ error: `Storipalorium fetch failed: ${r.status} ${txt.slice(0, 300)}` }, { status: 502 })
    }
    const j = await r.json() as { items?: typeof storiItems }
    storiItems = j.items ?? []
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'fetch failed' }, { status: 502 })
  }

  if (storiItems.length === 0) {
    return NextResponse.json({ imported: 0, skipped: 0, total: 0 })
  }

  const existing = await getAllBookmarks()
  const existingUrls = new Set(existing.map(b => b.url.trim().toLowerCase()))

  let imported = 0
  let skipped = 0
  const created: typeof existing = []

  for (const it of storiItems) {
    const url = (it.link || '').trim()
    const title = (it.title || '').trim()
    if (!url || !title) { skipped++; continue }
    if (existingUrls.has(url.toLowerCase())) { skipped++; continue }
    // also dedupe within this batch
    if (created.some(c => c.url.toLowerCase() === url.toLowerCase())) { skipped++; continue }

    const tagsRaw = (it.tags || '').trim()
    // store tags comma-joined into folder column (backwards compat)
    const folder = tagsRaw ? tagsRaw.slice(0, 500) : (it.category || '').trim().slice(0, 80) || null
    // favicon from url
    let favicon: string | null = null
    try { favicon = new URL(url).origin + '/favicon.ico' } catch { favicon = null }

    try {
      const bm = await createBookmark({
        title: title.slice(0, 240),
        url,
        description: null,
        favicon,
        folder,
      })
      created.push(bm)
      existingUrls.add(url.toLowerCase())
      imported++
    } catch {
      skipped++
    }
  }

  return NextResponse.json({ imported, skipped, total: storiItems.length, bookmarks: created })
}
