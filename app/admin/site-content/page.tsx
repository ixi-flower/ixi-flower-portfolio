'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type PlaylistTrack = { title: string; artist: string; dur: string }
type WakaData = { total: string; daily: string; codingSince: string; age: string; langs: { name: string; pct: number }[] }
type TechItem = { name: string; yrs: string; level: 'Advanced' | 'Intermediate' | 'Beginner'; color: string; icon: string; invert?: boolean }

type Tab = 'playlist' | 'waka' | 'tech'

export default function AdminSiteContentPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('playlist')
  const [playlist, setPlaylist] = useState<PlaylistTrack[]>([])
  const [waka, setWaka] = useState<WakaData>({ total: '', daily: '', codingSince: '', age: '', langs: [] })
  const [tech, setTech] = useState<TechItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch('/api/admin/site-content', { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error(r.status === 401 || r.status === 403 ? 'Unauthorized — please login again' : 'Failed to load')
        return r.json()
      })
      .then((data) => {
        if (Array.isArray(data.playlist)) setPlaylist(data.playlist as PlaylistTrack[])
        else if (data.playlist === null || data.playlist === undefined) {
          // fallback defaults will be loaded via public endpoint on homepage; keep empty so admin sees "use defaults"
        }
        if (data.waka && typeof data.waka === 'object') setWaka(data.waka as WakaData)
        if (Array.isArray(data.tech)) setTech(data.tech as TechItem[])
        if (data.error) setErr(data.error)
      })
      .catch((e) => setErr(e instanceof Error ? e.message : 'Load failed'))
      .finally(() => setLoading(false))
  }, [])

  // Fallback: if DB empty, hydrate defaults client-side via public data or hardcoded
  useEffect(() => {
    if (!loading && playlist.length === 0 && tech.length === 0 && !waka.total) {
      // Seed from defaults so admin has something to edit immediately
      // These match lib/site-content.ts DEFAULT_* — kept inline to avoid server import
      fetch('/api/site-content', { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d.playlist) && d.playlist.length) setPlaylist(d.playlist)
          if (d.waka?.total) setWaka(d.waka)
          if (Array.isArray(d.tech) && d.tech.length) setTech(d.tech)
        })
        .catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  async function save(key: Tab, value: unknown) {
    setSaving(true); setMsg(null)
    try {
      const r = await fetch('/api/admin/site-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setMsg({ t: 'err', m: j.error || 'Save failed' }); return }
      setMsg({ t: 'ok', m: `${key} saved ✓` })
    } catch {
      setMsg({ t: 'err', m: 'Network error' })
    } finally { setSaving(false) }
  }

  async function logout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.replace('/admin/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <p className="text-zinc-600 text-sm text-center py-8 animate-pulse">$ loading site content…</p>
      </div>
    )
  }

  const sumPct = waka.langs.reduce((s, l) => s + (Number(l.pct) || 0), 0)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Site content — admin</h1>
          <p className="text-xs text-zinc-500 mt-1 font-mono">$ site-content --edit — playlist · waka · tech</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin" className="px-3 py-2 border border-zinc-800 text-sm text-zinc-400 hover:text-zinc-100 hover:border-zinc-700">← Admin</Link>
          <Link href="/" className="px-3 py-2 border border-zinc-800 text-sm text-zinc-400 hover:text-zinc-100 hover:border-zinc-700">Site</Link>
          <button onClick={logout} className="px-3 py-2 border border-zinc-800 text-sm text-zinc-500 hover:text-zinc-100 hover:border-zinc-700">Logout</button>
        </div>
      </div>

      {err && <div className="border border-red-900/50 bg-red-950/30 text-red-300 text-sm px-4 py-3 mb-4 font-mono">{err}</div>}
      {msg && (
        <div className={`text-xs px-3 py-2 border font-mono mb-4 ${msg.t === 'ok' ? 'border-emerald-900/50 bg-emerald-950/30 text-emerald-300' : 'border-red-900/50 bg-red-950/30 text-red-300'}`}>{msg.m}</div>
      )}

      {/* Tabs */}
      <div className="inline-flex border border-zinc-700 overflow-hidden mb-6">
        {(['playlist', 'waka', 'tech'] as Tab[]).map((k) => (
          <button
            key={k}
            onClick={() => { setTab(k); setMsg(null) }}
            className={`px-4 py-1.5 text-xs font-mono capitalize transition-colors ${tab === k ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'}`}
          >
            {k === 'playlist' ? 'Playlist' : k === 'waka' ? 'WakaTime' : 'Tech Stack'}
          </button>
        ))}
      </div>

      {tab === 'playlist' && (
        <div className="border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-zinc-100">Playlist — {playlist.length} tracks</h2>
            <button
              onClick={() => setPlaylist((p) => [...p, { title: '', artist: 'Bahram', dur: '3:00' }])}
              className="px-3 py-1.5 text-xs border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            >
              + Add track
            </button>
          </div>
          <div className="space-y-2">
            {playlist.map((t, i) => (
              <div key={i} className="flex flex-wrap gap-2 items-center p-2 border border-zinc-800 bg-zinc-900">
                <span className="text-[11px] text-zinc-600 w-6 text-center shrink-0">#{i + 1}</span>
                <input
                  value={t.title}
                  onChange={(e) => setPlaylist((prev) => prev.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x)))}
                  placeholder="Title"
                  className="flex-1 min-w-[120px] bg-zinc-950 border border-zinc-800 px-2 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                />
                <input
                  value={t.artist}
                  onChange={(e) => setPlaylist((prev) => prev.map((x, idx) => (idx === i ? { ...x, artist: e.target.value } : x)))}
                  placeholder="Artist"
                  className="w-28 bg-zinc-950 border border-zinc-800 px-2 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                />
                <input
                  value={t.dur}
                  onChange={(e) => setPlaylist((prev) => prev.map((x, idx) => (idx === i ? { ...x, dur: e.target.value } : x)))}
                  placeholder="3:16"
                  className="w-16 bg-zinc-950 border border-zinc-800 px-2 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono"
                />
                <div className="flex gap-1">
                  <button
                    onClick={() => setPlaylist((prev) => { const a = [...prev]; if (i > 0) [a[i - 1], a[i]] = [a[i], a[i - 1]]; return a })}
                    disabled={i === 0}
                    className="px-2 py-1 text-[11px] border border-zinc-800 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => setPlaylist((prev) => { const a = [...prev]; if (i < a.length - 1) [a[i], a[i + 1]] = [a[i + 1], a[i]]; return a })}
                    disabled={i === playlist.length - 1}
                    className="px-2 py-1 text-[11px] border border-zinc-800 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => setPlaylist((prev) => prev.filter((_, idx) => idx !== i))}
                    className="px-2 py-1 text-[11px] border border-red-900/50 text-red-400 hover:bg-red-950/30"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            {playlist.length === 0 && <p className="text-zinc-600 text-sm text-center py-6">No tracks — add one.</p>}
          </div>
          <button onClick={() => save('playlist', playlist)} disabled={saving} className="mt-4 px-4 py-2 bg-zinc-100 text-zinc-900 text-sm hover:bg-white disabled:opacity-50">
            {saving ? 'Saving…' : 'Save playlist'}
          </button>
          <p className="text-[11px] text-zinc-600 mt-2 font-mono">dur must be m:ss (e.g. 3:16). Order is playlist order.</p>
        </div>
      )}

      {tab === 'waka' && (
        <div className="border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">
          <h2 className="text-sm font-bold text-zinc-100">WakaTime card</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] text-zinc-500 font-mono">Total (e.g. 1,847h 32m)</span>
              <input value={waka.total} onChange={(e) => setWaka((v) => ({ ...v, total: e.target.value }))} className="mt-1 w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono" />
            </label>
            <label className="block">
              <span className="text-[11px] text-zinc-500 font-mono">Daily (e.g. 3 hrs 12 mins)</span>
              <input value={waka.daily} onChange={(e) => setWaka((v) => ({ ...v, daily: e.target.value }))} className="mt-1 w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono" />
            </label>
            <label className="block">
              <span className="text-[11px] text-zinc-500 font-mono">Coding since (e.g. 2019)</span>
              <input value={waka.codingSince} onChange={(e) => setWaka((v) => ({ ...v, codingSince: e.target.value }))} className="mt-1 w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600" />
            </label>
            <label className="block">
              <span className="text-[11px] text-zinc-500 font-mono">Age line (e.g. 17 (born 2007))</span>
              <input value={waka.age} onChange={(e) => setWaka((v) => ({ ...v, age: e.target.value }))} className="mt-1 w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600" />
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 font-mono">Top Languages — langs[]</span>
              <span className={`text-[11px] font-mono ${sumPct === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>sum {sumPct}% {sumPct !== 100 && '≠ 100'}</span>
            </div>
            {/* Bar preview */}
            <div className="h-2 w-full bg-zinc-800 flex overflow-hidden mt-2">
              {waka.langs.map((l, i) => (
                <div key={i} className={['bg-sky-500', 'bg-yellow-500', 'bg-violet-500', 'bg-emerald-500', 'bg-orange-500'][i % 5]} style={{ width: `${l.pct}%` }} />
              ))}
            </div>
            <div className="mt-3 space-y-2">
              {waka.langs.map((l, i) => (
                <div key={i} className="flex gap-2 items-center p-2 border border-zinc-800 bg-zinc-900">
                  <input
                    value={l.name}
                    onChange={(e) => setWaka((v) => ({ ...v, langs: v.langs.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)) }))}
                    placeholder="Language"
                    className="flex-1 bg-zinc-950 border border-zinc-800 px-2 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={l.pct}
                    onChange={(e) => setWaka((v) => ({ ...v, langs: v.langs.map((x, idx) => (idx === i ? { ...x, pct: Math.min(100, Math.max(0, Number(e.target.value) || 0)) } : x)) }))}
                    className="w-20 bg-zinc-950 border border-zinc-800 px-2 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono"
                  />
                  <span className="text-[11px] text-zinc-500">%</span>
                  <button onClick={() => setWaka((v) => ({ ...v, langs: v.langs.filter((_, idx) => idx !== i) }))} className="px-2 py-1 text-[11px] border border-red-900/50 text-red-400 hover:bg-red-950/30">✕</button>
                </div>
              ))}
            </div>
            <button onClick={() => setWaka((v) => ({ ...v, langs: [...v.langs, { name: '', pct: 10 }] }))} className="mt-2 px-3 py-1.5 text-xs border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700">+ Add language</button>
          </div>

          <button onClick={() => save('waka', waka)} disabled={saving} className="px-4 py-2 bg-zinc-100 text-zinc-900 text-sm hover:bg-white disabled:opacity-50">
            {saving ? 'Saving…' : 'Save WakaTime'}
          </button>
        </div>
      )}

      {tab === 'tech' && (
        <div className="border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-zinc-100">Tech stack — {tech.length} items</h2>
            <button
              onClick={() => setTech((t) => [...t, { name: '', yrs: '1+ yrs', level: 'Intermediate', color: '#888888', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg' }])}
              className="px-3 py-1.5 text-xs border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            >
              + Add
            </button>
          </div>
          <div className="space-y-2">
            {tech.map((item, i) => (
              <div key={i} className="p-3 border border-zinc-800 bg-zinc-900 space-y-2">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {item.icon ? <img src={item.icon} alt="" width={16} height={16} className={`h-4 w-4 object-contain bg-zinc-950 border p-0.5 ${item.invert ? 'invert' : ''}`} style={{ borderColor: item.color || '#333' }} /> : <span className="h-4 w-4 bg-zinc-800 border border-zinc-700 shrink-0" />}
                  <span className="text-xs font-medium text-zinc-200 truncate">{item.name || '(unnamed)'}</span>
                  <span className="text-[10px] text-zinc-500 whitespace-nowrap">{item.yrs}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300">{item.level}</span>
                  <div className="ml-auto flex gap-1">
                    <button
                      onClick={() => setTech((prev) => { const a = [...prev]; if (i > 0) [a[i - 1], a[i]] = [a[i], a[i - 1]]; return a })}
                      disabled={i === 0}
                      className="px-2 py-1 text-[11px] border border-zinc-800 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => setTech((prev) => { const a = [...prev]; if (i < a.length - 1) [a[i], a[i + 1]] = [a[i + 1], a[i]]; return a })}
                      disabled={i === tech.length - 1}
                      className="px-2 py-1 text-[11px] border border-zinc-800 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button onClick={() => setTech((prev) => prev.filter((_, idx) => idx !== i))} className="px-2 py-1 text-[11px] border border-red-900/50 text-red-400 hover:bg-red-950/30">✕</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input value={item.name} onChange={(e) => setTech((prev) => prev.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))} placeholder="Name (e.g. Rust)" className="bg-zinc-950 border border-zinc-800 px-2 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
                  <input value={item.yrs} onChange={(e) => setTech((prev) => prev.map((x, idx) => (idx === i ? { ...x, yrs: e.target.value } : x)))} placeholder="3+ yrs" className="bg-zinc-950 border border-zinc-800 px-2 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono" />
                  <select value={item.level} onChange={(e) => setTech((prev) => prev.map((x, idx) => (idx === i ? { ...x, level: e.target.value as TechItem['level'] } : x)))} className="bg-zinc-950 border border-zinc-800 px-2 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600">
                    <option>Advanced</option>
                    <option>Intermediate</option>
                    <option>Beginner</option>
                  </select>
                  <input value={item.color} onChange={(e) => setTech((prev) => prev.map((x, idx) => (idx === i ? { ...x, color: e.target.value } : x)))} placeholder="#3178c6" className="bg-zinc-950 border border-zinc-800 px-2 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono" />
                  <input value={item.icon} onChange={(e) => setTech((prev) => prev.map((x, idx) => (idx === i ? { ...x, icon: e.target.value } : x)))} placeholder="https://cdn.jsdelivr.net/.../icon.svg" className="sm:col-span-2 bg-zinc-950 border border-zinc-800 px-2 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
                  <label className="flex items-center gap-2 text-[11px] text-zinc-500">
                    <input type="checkbox" checked={!!item.invert} onChange={(e) => setTech((prev) => prev.map((x, idx) => (idx === i ? { ...x, invert: e.target.checked || undefined } : x)))} className="accent-zinc-100" />
                    invert (for dark icons like Next.js)
                  </label>
                </div>
              </div>
            ))}
            {tech.length === 0 && <p className="text-zinc-600 text-sm text-center py-6">No items — add one.</p>}
          </div>
          <button onClick={() => save('tech', tech)} disabled={saving} className="mt-4 px-4 py-2 bg-zinc-100 text-zinc-900 text-sm hover:bg-white disabled:opacity-50">
            {saving ? 'Saving…' : 'Save tech stack'}
          </button>
        </div>
      )}
    </div>
  )
}
