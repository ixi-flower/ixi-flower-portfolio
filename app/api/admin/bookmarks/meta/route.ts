export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireOwner } from '@/lib/auth'

function extractMeta(html: string): { title: string | null; description: string | null } {
  let title: string | null = null
  let description: string | null = null

  // og:title
  let m = html.match(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
  if (m) title = m[1].trim()
  if (!title) {
    m = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:title["']/i)
    if (m) title = m[1].trim()
  }
  if (!title) {
    m = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (m) title = m[1].trim()
  }

  // og:description
  m = html.match(/<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
  if (m) description = m[1].trim()
  if (!description) {
    m = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:description["']/i)
    if (m) description = m[1].trim()
  }
  if (!description) {
    m = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)["']/i)
    if (m) description = m[1].trim()
  }
  if (!description) {
    m = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*name=["']description["']/i)
    if (m) description = m[1].trim()
  }

  // decode basic entities
  const decode = (s: string) =>
    s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")

  return {
    title: title ? decode(title).slice(0, 240) : null,
    description: description ? decode(description).slice(0, 500) : null,
  }
}

export async function GET(request: NextRequest) {
  const err = await requireOwner(request)
  if (err) return err
  const url = request.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })
  try {
    new URL(url)
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 })
  }
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ixi-wave-bookmark/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    })
    if (!r.ok) return NextResponse.json({ title: null, description: null, status: r.status })
    const ct = r.headers.get('content-type') || ''
    if (!ct.includes('text/html') && !ct.includes('text/')) {
      return NextResponse.json({ title: null, description: null })
    }
    const html = await r.text()
    const meta = extractMeta(html.slice(0, 200000))
    return NextResponse.json(meta)
  } catch (e) {
    return NextResponse.json({ title: null, description: null, error: e instanceof Error ? e.message : 'fetch failed' })
  }
}
