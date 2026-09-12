'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

type Post = {
  id: string; slug: string; title: string; excerpt: string | null
  status: string; publishedAt: string | null; updatedAt: string
  tags?: { id: number; slug: string; name: string }[]
}

function getHeaders(): Record<string, string> {
  const secret = typeof window !== 'undefined' ? localStorage.getItem('ixi_admin_secret') : null
  if (secret) return { 'x-admin-secret': secret }
  return { 'x-admin-email': 'amirabbas.rouintan2007@gmail.com' }
}

export default function AdminBlogList() {
  const [posts, setPosts] = useState<Post[]>([])
  const [q, setQ] = useState('')
  const [secret, setSecret] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [fetching, setFetching] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    setSecret(localStorage.getItem('ixi_admin_secret') || '')
  }, [])

  const saveSecret = () => {
    localStorage.setItem('ixi_admin_secret', secret.trim())
    setErr('')
    load(q)
  }

  const load = useCallback(async (query: string) => {
    setFetching(true); setErr('')
    try {
      const r = await fetch(`/api/admin/blog?q=${encodeURIComponent(query)}`, { headers: getHeaders(), cache: 'no-store' })
      if (r.status === 401 || r.status === 403) throw new Error('Unauthorized — set ADMIN_SECRET in settings below')
      if (!r.ok) throw new Error('Failed to load posts')
      const data = await r.json()
      setPosts(data.posts || [])
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Load failed')
    } finally { setFetching(false) }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => load(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q, load])

  const togglePublish = async (p: Post) => {
    setBusyId(p.id)
    try {
      const r = await fetch(`/api/admin/blog/${p.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({ status: p.status === 'published' ? 'draft' : 'published' }),
      })
      if (r.ok) await load(q.trim())
    } finally { setBusyId(null) }
  }

  const remove = async (p: Post) => {
    if (!confirm(`Delete "${p.title}"?`)) return
    setBusyId(p.id)
    try {
      const r = await fetch(`/api/admin/blog/${p.id}`, { method: 'DELETE', headers: getHeaders() })
      if (r.ok) await load(q.trim())
    } finally { setBusyId(null) }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Blog — admin</h1>
          <p className="text-xs text-zinc-500 mt-1">$ ls admin/blog — {posts.length} posts</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/blog/new" className="px-4 py-2 bg-zinc-100 text-zinc-900 text-sm hover:bg-white">+ New post</Link>
          <Link href="/" className="px-4 py-2 border border-zinc-800 text-sm text-zinc-400 hover:text-zinc-100">← Site</Link>
        </div>
      </div>

      {/* secret input */}
      <div className="mb-4 flex gap-2 items-center border border-zinc-800 bg-zinc-900 p-2">
        <span className="text-[11px] text-zinc-500 shrink-0">ADMIN_SECRET</span>
        <input value={secret} onChange={e => setSecret(e.target.value)} placeholder="ixi-dev-secret-2026" className="flex-1 bg-zinc-950 border border-zinc-800 px-2 py-1 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
        <button onClick={saveSecret} className="px-3 py-1 text-xs border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700">Save</button>
      </div>

      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search posts…" className="w-full max-w-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 mb-4" />

      {err && <div className="border border-red-900/50 bg-red-950/30 text-red-300 text-sm px-4 py-3 mb-4">{err}</div>}

      <div className="border border-zinc-800 bg-zinc-900/50 p-4">
        {fetching && posts.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center py-8">Loading…</p>
        ) : posts.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center py-8">No posts yet — create one.</p>
        ) : (
          <div className="space-y-2">
            {posts.map(p => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 p-3 border border-zinc-800 bg-zinc-900">
                <div className="flex-1 min-w-[200px]">
                  <div className="text-sm font-medium text-zinc-100 truncate">{p.title}</div>
                  <div className="text-[11px] text-zinc-500 mt-1 flex gap-3">
                    <span>/{p.slug}</span>
                    <span>{p.status}</span>
                    {p.tags && p.tags.length > 0 && <span>{p.tags.map(t => t.name).join(', ')}</span>}
                  </div>
                </div>
                <span className={`text-[11px] px-2 py-1 border ${p.status === 'published' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                  {p.status}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => togglePublish(p)} disabled={busyId === p.id} className={`text-xs px-3 py-1.5 border disabled:opacity-50 ${p.status === 'published' ? 'border-zinc-800 text-zinc-500 hover:bg-zinc-800' : 'border-emerald-900/50 text-emerald-400 hover:bg-emerald-950/30'}`}>
                    {p.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <Link href={`/admin/blog/${p.id}/edit`} className="text-xs px-3 py-1.5 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100">Edit</Link>
                  <button onClick={() => remove(p)} disabled={busyId === p.id} className="text-xs px-3 py-1.5 border border-red-900/50 text-red-400 hover:bg-red-950/30 disabled:opacity-50">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
