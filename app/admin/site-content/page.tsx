'use client'
import React, { useEffect, useState, Suspense, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, Trash2, ChevronUp, ChevronDown, LogOut, GripVertical, Play, Pause, Upload, X as XIcon, Music2 } from 'lucide-react'

type PlaylistTrack = { title: string; artist: string; dur: string; url?: string }
type WakaData = { total: string; daily: string; codingSince: string; age: string; langs: { name: string; pct: number }[]; editors?: { name: string; pct: number }[]; os?: { name: string; pct: number }[] }
type TechItem = { name: string; yrs: string; level: 'Advanced' | 'Intermediate' | 'Beginner'; color: string; icon: string; invert?: boolean }
type CourseItem = { title: string; provider: string; year: string; link?: string; status: "completed" | "in-progress" }

type BannerData = { enabled: boolean; text: string; link?: string; dismissible?: boolean }
type Tab = 'playlist' | 'waka' | 'tech' | 'courses' | 'banner'
const TAB_KEYS: Tab[] = ['playlist', 'waka', 'tech', 'courses', 'banner']

function SiteContentInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as Tab) || 'playlist'
  const [tab, setTab] = useState<Tab>(TAB_KEYS.includes(initialTab) ? initialTab : 'playlist')
  const [playlist, setPlaylist] = useState<PlaylistTrack[]>([])
  const [waka, setWaka] = useState<WakaData>({ total: '', daily: '', codingSince: '', age: '', langs: [] })
  const [tech, setTech] = useState<TechItem[]>([])
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [banner, setBanner] = useState<BannerData>({ enabled: false, text: "", link: "", dismissible: true })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null)
  const [err, setErr] = useState('')
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [showAddTrack, setShowAddTrack] = useState(false)

  useEffect(() => {
    const t = searchParams.get('tab') as Tab | null
    if (t && (TAB_KEYS as string[]).includes(t)) setTab(t)
  }, [searchParams])

  function switchTab(k: Tab) {
    setTab(k); setMsg(null)
    router.replace(`/admin/site-content?tab=${k}`, { scroll: false })
  }

  useEffect(() => {
    fetch('/api/admin/site-content', { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error(r.status === 401 || r.status === 403 ? 'Unauthorized — please login again' : 'Failed to load')
        return r.json()
      })
      .then((data) => {
        if (Array.isArray(data.playlist)) setPlaylist(data.playlist as PlaylistTrack[])
        if (data.waka && typeof data.waka === 'object') setWaka(data.waka as WakaData)
        if (Array.isArray(data.tech)) setTech(data.tech as TechItem[])
        if (Array.isArray(data.courses)) setCourses(data.courses as CourseItem[])
        if (data.banner && typeof data.banner === 'object') setBanner(data.banner as BannerData)
        if (data.error) setErr(data.error)
      })
      .catch((e) => setErr(e instanceof Error ? e.message : 'Load failed'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!loading && playlist.length === 0 && tech.length === 0 && !waka.total && courses.length === 0) {
      fetch('/api/site-content', { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d.playlist) && d.playlist.length) setPlaylist(d.playlist)
          if (d.waka?.total) setWaka(d.waka)
          if (Array.isArray(d.tech) && d.tech.length) setTech(d.tech)
          if (Array.isArray(d.courses) && d.courses.length) setCourses(d.courses)
          if (d.banner && typeof d.banner === 'object' && (d.banner as BannerData).text !== undefined) setBanner(d.banner as BannerData)
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
        <p className="text-zinc-600 text-sm text-center py-8 animate-pulse font-mono">$ loading site content…</p>
      </div>
    )
  }

  const sumPct = waka.langs.reduce((s, l) => s + (Number(l.pct) || 0), 0)
  const sumEditors = (waka.editors ?? []).reduce((s, l) => s + (Number(l.pct) || 0), 0)
  const sumOs = (waka.os ?? []).reduce((s, l) => s + (Number(l.pct) || 0), 0)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 admin-fade">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6 admin-fade">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Site content — admin</h1>
          <p className="text-xs text-zinc-500 mt-1 font-mono">$ site-content --edit — playlist · waka · tech · courses · banner</p>
        </div>
        {/* sidebar already has these on desktop — hide here */}
        <div className="flex gap-2 md:hidden">
          <Link href="/admin" className="px-3 py-2 border border-zinc-800 text-sm text-zinc-400 hover:text-zinc-100 hover:border-zinc-700">← Admin</Link>
          <Link href="/" className="px-3 py-2 border border-zinc-800 text-sm text-zinc-400 hover:text-zinc-100 hover:border-zinc-700">Site</Link>
          <button onClick={logout} className="inline-flex items-center gap-1.5 px-3 py-2 border border-zinc-800 text-sm text-zinc-500 hover:text-red-400 hover:border-red-500/40 hover:bg-red-950/20 hover:shadow-[0_0_12px_rgba(239,68,68,0.25)] transition-all"><LogOut className="h-3.5 w-3.5" /> Logout</button>
        </div>
      </div>

      {err && <div className="border border-red-900/50 bg-red-950/30 text-red-300 text-sm px-4 py-3 mb-4 font-mono admin-fade">{err}</div>}
      {msg && (
        <div className={`text-xs px-3 py-2 border font-mono mb-4 admin-fade ${msg.t === 'ok' ? 'border-emerald-900/50 bg-emerald-950/30 text-emerald-300' : 'border-red-900/50 bg-red-950/30 text-red-300'}`}>{msg.m}</div>
      )}

      <div className="inline-flex border border-zinc-700 overflow-hidden mb-6 admin-fade admin-fade-d1">
        {TAB_KEYS.map((k) => (
          <button
            key={k}
            onClick={() => switchTab(k)}
            className={`px-4 py-1.5 text-xs font-mono capitalize transition-colors ${tab === k ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'}`}
          >
            {k === 'playlist' ? 'Playlist' : k === 'waka' ? 'WakaTime' : k === 'tech' ? 'Tech Stack' : k === 'courses' ? 'Courses' : 'Banner'}
          </button>
        ))}
      </div>

      {tab === 'playlist' && (
        <div className="border border-zinc-800 bg-zinc-900/50 p-4 admin-fade admin-fade-d2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-zinc-100">Playlist — {playlist.length} tracks</h2>
            <button
              onClick={() => setShowAddTrack(true)}
              className="px-3 py-1.5 text-xs border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            >
              <span className="inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Add track</span>
            </button>
          </div>
          {showAddTrack && (
            <AddTrackModal
              onClose={() => setShowAddTrack(false)}
              onAdd={(t) => {
                setPlaylist((p) => [...p, t])
                setShowAddTrack(false)
              }}
            />
          )}
          <div className="space-y-2">
            {playlist.map((t, i) => (
              <div
                key={i}
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragOver={(e) => {
                  e.preventDefault()
                  if (dragIdx === null || dragIdx === i) return
                  const a = [...playlist]
                  const [m] = a.splice(dragIdx, 1)
                  a.splice(i, 0, m)
                  setPlaylist(a)
                  setDragIdx(i)
                }}
                onDragEnd={() => setDragIdx(null)}
                onDrop={() => setDragIdx(null)}
                className={`${dragIdx === i ? 'opacity-40 border-zinc-600' : 'border-zinc-800'} transition-opacity`}
              >
                <div className="flex items-center gap-1">
                  <span title="Drag to reorder" className="shrink-0 h-8 w-6 flex items-center justify-center text-zinc-600 cursor-grab active:cursor-grabbing hover:text-zinc-400"><GripVertical className="h-3.5 w-3.5" /></span>
                  <div className="flex-1 min-w-0">
                    <PlaylistRow track={t} idx={i} total={playlist.length} onChange={(patch) => setPlaylist((prev) => prev.map((x, j) => (j === i ? { ...x, ...patch } : x)))} onMoveUp={() => setPlaylist((prev) => { const a = [...prev]; if (i > 0) [a[i - 1], a[i]] = [a[i], a[i - 1]]; return a })} onMoveDown={() => setPlaylist((prev) => { const a = [...prev]; if (i < a.length - 1) [a[i], a[i + 1]] = [a[i + 1], a[i]]; return a })} onRemove={() => setPlaylist((prev) => prev.filter((_, j) => j !== i))} />
                  </div>
                </div>
              </div>
            ))}
            {playlist.length === 0 && <p className="text-zinc-600 text-sm text-center py-6">No tracks — add one.</p>}
          </div>
          <button onClick={() => save('playlist', playlist)} disabled={saving} className="mt-4 px-4 py-2 bg-zinc-100 text-zinc-900 text-sm hover:bg-white disabled:opacity-50">
            {saving ? 'Saving…' : 'Save playlist'}
          </button>
          <p className="text-[11px] text-zinc-600 mt-2 font-mono">Drag the ⋮⋮ handle or use ↑↓ to reorder · upload mp3/flac/ogg/m4a → Cloudinary (ixi-wave/tracks)</p>
        </div>
      )}

      {tab === 'waka' && (
        <div className="border border-zinc-800 bg-zinc-900/50 p-4 space-y-4 admin-fade admin-fade-d2">
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
            <div className="h-2 w-full bg-zinc-800 flex overflow-hidden mt-2">
              {waka.langs.map((l, i) => (
                <div key={i} className={['bg-sky-500', 'bg-yellow-500', 'bg-violet-500', 'bg-emerald-500', 'bg-orange-500'][i % 5]} style={{ width: `${l.pct}%` }} />
              ))}
            </div>
            <div className="mt-3 space-y-2">
              {waka.langs.map((l, i) => (
                <div key={i} className="flex gap-2 items-center p-2 border border-zinc-800 bg-zinc-900">
                  <input value={l.name} onChange={(e) => setWaka((v) => ({ ...v, langs: v.langs.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)) }))} placeholder="Language" className="flex-1 bg-zinc-950 border border-zinc-800 px-2 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600" />
                  <input type="number" min={0} max={100} value={l.pct} onChange={(e) => setWaka((v) => ({ ...v, langs: v.langs.map((x, idx) => (idx === i ? { ...x, pct: Math.min(100, Math.max(0, Number(e.target.value) || 0)) } : x)) }))} className="w-20 bg-zinc-950 border border-zinc-800 px-2 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono" />
                  <span className="text-[11px] text-zinc-500">%</span>
                  <button onClick={() => setWaka((v) => ({ ...v, langs: v.langs.filter((_, idx) => idx !== i) }))} className="h-7 w-7 flex items-center justify-center border border-red-900/50 text-red-400 hover:bg-red-950/30"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
            <button onClick={() => setWaka((v) => ({ ...v, langs: [...v.langs, { name: '', pct: 10 }] }))} className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"><Plus className="h-3 w-3" /> Add language</button>
          </div>

          <div className="border-t border-zinc-800 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 font-mono">Editors — editors[] (for --editors tab)</span>
              <span className={`text-[11px] font-mono ${sumEditors === 100 ? 'text-emerald-400' : sumEditors === 0 ? 'text-zinc-600' : 'text-amber-400'}`}>sum {sumEditors}% {sumEditors !== 100 && sumEditors !== 0 && '≠ 100'}</span>
            </div>
            <div className="h-2 w-full bg-zinc-800 flex overflow-hidden mt-2">
              {(waka.editors ?? []).map((l, i) => (
                <div key={i} className={['bg-sky-500', 'bg-violet-500', 'bg-emerald-500', 'bg-yellow-500'][i % 4]} style={{ width: `${l.pct}%` }} />
              ))}
            </div>
            <div className="mt-3 space-y-2">
              {(waka.editors ?? []).map((l, i) => (
                <div key={i} className="flex gap-2 items-center p-2 border border-zinc-800 bg-zinc-900">
                  <input value={l.name} onChange={(e) => setWaka((v) => ({ ...v, editors: (v.editors ?? []).map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)) }))} placeholder="Editor (VS Code, Neovim, Claude Code…)" className="flex-1 bg-zinc-950 border border-zinc-800 px-2 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600" />
                  <input type="number" min={0} max={100} value={l.pct} onChange={(e) => setWaka((v) => ({ ...v, editors: (v.editors ?? []).map((x, idx) => (idx === i ? { ...x, pct: Math.min(100, Math.max(0, Number(e.target.value) || 0)) } : x)) }))} className="w-20 bg-zinc-950 border border-zinc-800 px-2 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono" />
                  <span className="text-[11px] text-zinc-500">%</span>
                  <button onClick={() => setWaka((v) => ({ ...v, editors: (v.editors ?? []).filter((_, idx) => idx !== i) }))} className="h-7 w-7 flex items-center justify-center border border-red-900/50 text-red-400 hover:bg-red-950/30"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
            <button onClick={() => setWaka((v) => ({ ...v, editors: [...(v.editors ?? []), { name: '', pct: 10 }] }))} className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"><Plus className="h-3 w-3" /> Add editor</button>
          </div>

          <div className="border-t border-zinc-800 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 font-mono">Operating Systems — os[] (for --os tab)</span>
              <span className={`text-[11px] font-mono ${sumOs === 100 ? 'text-emerald-400' : sumOs === 0 ? 'text-zinc-600' : 'text-amber-400'}`}>sum {sumOs}% {sumOs !== 100 && sumOs !== 0 && '≠ 100'}</span>
            </div>
            <div className="h-2 w-full bg-zinc-800 flex overflow-hidden mt-2">
              {(waka.os ?? []).map((l, i) => (
                <div key={i} className={['bg-orange-500', 'bg-sky-600', 'bg-zinc-500'][i % 3]} style={{ width: `${l.pct}%` }} />
              ))}
            </div>
            <div className="mt-3 space-y-2">
              {(waka.os ?? []).map((l, i) => (
                <div key={i} className="flex gap-2 items-center p-2 border border-zinc-800 bg-zinc-900">
                  <input value={l.name} onChange={(e) => setWaka((v) => ({ ...v, os: (v.os ?? []).map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)) }))} placeholder="OS (Linux, Windows, macOS…)" className="flex-1 bg-zinc-950 border border-zinc-800 px-2 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600" />
                  <input type="number" min={0} max={100} value={l.pct} onChange={(e) => setWaka((v) => ({ ...v, os: (v.os ?? []).map((x, idx) => (idx === i ? { ...x, pct: Math.min(100, Math.max(0, Number(e.target.value) || 0)) } : x)) }))} className="w-20 bg-zinc-950 border border-zinc-800 px-2 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono" />
                  <span className="text-[11px] text-zinc-500">%</span>
                  <button onClick={() => setWaka((v) => ({ ...v, os: (v.os ?? []).filter((_, idx) => idx !== i) }))} className="h-7 w-7 flex items-center justify-center border border-red-900/50 text-red-400 hover:bg-red-950/30"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
            <button onClick={() => setWaka((v) => ({ ...v, os: [...(v.os ?? []), { name: '', pct: 10 }] }))} className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"><Plus className="h-3 w-3" /> Add OS</button>
          </div>

          <button onClick={() => save('waka', waka)} disabled={saving} className="px-4 py-2 bg-zinc-100 text-zinc-900 text-sm hover:bg-white disabled:opacity-50">
            {saving ? 'Saving…' : 'Save WakaTime'}
          </button>
        </div>
      )}

      {tab === 'tech' && (
        <div className="border border-zinc-800 bg-zinc-900/50 p-4 admin-fade admin-fade-d2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-zinc-100">Tech stack — {tech.length} items</h2>
            <button onClick={() => setTech((t) => [...t, { name: '', yrs: '1+ yrs', level: 'Intermediate', color: '#888888', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg' }])} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"><Plus className="h-3 w-3" /> Add</button>
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
                    <button onClick={() => setTech((prev) => { const a = [...prev]; if (i > 0) [a[i - 1], a[i]] = [a[i], a[i - 1]]; return a })} disabled={i === 0} className="h-7 w-7 flex items-center justify-center border border-zinc-800 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"><ChevronUp className="h-3 w-3" /></button>
                    <button onClick={() => setTech((prev) => { const a = [...prev]; if (i < a.length - 1) [a[i], a[i + 1]] = [a[i + 1], a[i]]; return a })} disabled={i === tech.length - 1} className="h-7 w-7 flex items-center justify-center border border-zinc-800 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"><ChevronDown className="h-3 w-3" /></button>
                    <button onClick={() => setTech((prev) => prev.filter((_, idx) => idx !== i))} className="h-7 w-7 flex items-center justify-center border border-red-900/50 text-red-400 hover:bg-red-950/30"><Trash2 className="h-3 w-3" /></button>
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

      {tab === 'courses' && (
        <div className="border border-zinc-800 bg-zinc-900/50 p-4 admin-fade admin-fade-d2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-zinc-100">Courses — {courses.length} items</h2>
            <button onClick={() => setCourses((c) => [...c, { title: '', provider: '', year: '2024', link: '', status: 'completed' }])} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"><Plus className="h-3 w-3" /> Add course</button>
          </div>
          <div className="space-y-2">
            {courses.map((course, i) => (
              <div key={i} className="p-3 border border-zinc-800 bg-zinc-900 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-600 w-6 text-center shrink-0">#{i + 1}</span>
                  <span className="text-xs font-medium text-zinc-200 truncate flex-1">{course.title || '(untitled)'}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 border whitespace-nowrap ${course.status === 'completed' ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-amber-950/40 border-amber-800 text-amber-300'}`}>{course.status}</span>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setCourses((prev) => { const a = [...prev]; if (i > 0) [a[i - 1], a[i]] = [a[i], a[i - 1]]; return a })} disabled={i === 0} className="h-7 w-7 flex items-center justify-center border border-zinc-800 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"><ChevronUp className="h-3 w-3" /></button>
                    <button onClick={() => setCourses((prev) => { const a = [...prev]; if (i < a.length - 1) [a[i], a[i + 1]] = [a[i + 1], a[i]]; return a })} disabled={i === courses.length - 1} className="h-7 w-7 flex items-center justify-center border border-zinc-800 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"><ChevronDown className="h-3 w-3" /></button>
                    <button onClick={() => setCourses((prev) => prev.filter((_, idx) => idx !== i))} className="h-7 w-7 flex items-center justify-center border border-red-900/50 text-red-400 hover:bg-red-950/30"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input value={course.title} onChange={(e) => setCourses((prev) => prev.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x)))} placeholder="Title (e.g. Advanced React)" className="bg-zinc-950 border border-zinc-800 px-2 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
                  <input value={course.provider} onChange={(e) => setCourses((prev) => prev.map((x, idx) => (idx === i ? { ...x, provider: e.target.value } : x)))} placeholder="Provider (e.g. Udemy)" className="bg-zinc-950 border border-zinc-800 px-2 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
                  <input value={course.year} onChange={(e) => setCourses((prev) => prev.map((x, idx) => (idx === i ? { ...x, year: e.target.value } : x)))} placeholder="Year (e.g. 2023)" className="bg-zinc-950 border border-zinc-800 px-2 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono" />
                  <input value={course.link || ''} onChange={(e) => setCourses((prev) => prev.map((x, idx) => (idx === i ? { ...x, link: e.target.value } : x)))} placeholder="https://... (optional)" className="bg-zinc-950 border border-zinc-800 px-2 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono" />
                  <select value={course.status} onChange={(e) => setCourses((prev) => prev.map((x, idx) => (idx === i ? { ...x, status: e.target.value as CourseItem['status'] } : x)))} className="bg-zinc-950 border border-zinc-800 px-2 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600">
                    <option value="completed">completed</option>
                    <option value="in-progress">in-progress</option>
                  </select>
                </div>
              </div>
            ))}
            {courses.length === 0 && <p className="text-zinc-600 text-sm text-center py-6">No courses — add one.</p>}
          </div>
          <button onClick={() => save('courses', courses)} disabled={saving} className="mt-4 px-4 py-2 bg-zinc-100 text-zinc-900 text-sm hover:bg-white disabled:opacity-50">
            {saving ? 'Saving…' : 'Save courses'}
          </button>
          <p className="text-[11px] text-zinc-600 mt-2 font-mono">Saved to site_settings jsonb key=courses — no migration needed.</p>
        </div>
      )}

      {tab === 'banner' && (
        <div className="border border-zinc-800 bg-zinc-900/50 p-4 space-y-4 admin-fade admin-fade-d2">
          <h2 className="text-sm font-bold text-zinc-100">Top banner</h2>
          <p className="text-[11px] text-zinc-500 font-mono">Shown at the very top of the main page above the ASCII header — only when enabled and text is non-empty.</p>

          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={banner.enabled} onChange={(e) => setBanner((v) => ({ ...v, enabled: e.target.checked }))} className="accent-zinc-100 h-4 w-4" />
            Enable banner
          </label>

          <label className="block">
            <span className="text-[11px] text-zinc-500 font-mono">Text — max 200 chars ({banner.text.length}/200)</span>
            <input value={banner.text} onChange={(e) => setBanner((v) => ({ ...v, text: e.target.value.slice(0, 200) }))} placeholder="e.g. New album out now →" maxLength={200} className="mt-1 w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono" />
          </label>

          <label className="block">
            <span className="text-[11px] text-zinc-500 font-mono">Link — optional URL (leave empty for plain text)</span>
            <input value={banner.link || ''} onChange={(e) => setBanner((v) => ({ ...v, link: e.target.value }))} placeholder="https://..." className="mt-1 w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono" />
          </label>

          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={banner.dismissible !== false} onChange={(e) => setBanner((v) => ({ ...v, dismissible: e.target.checked }))} className="accent-zinc-100 h-4 w-4" />
            Dismissible — show [×] to hide for session
          </label>

          <div className="border border-zinc-800 bg-zinc-950 p-3">
            <span className="text-[11px] text-zinc-500 font-mono">Preview</span>
            <div className="mt-2 border border-zinc-800 bg-zinc-900 px-3 py-2 flex items-center justify-center gap-2 text-xs font-mono">
              <span className="text-zinc-500">[ banner ]</span>
              {banner.link ? (
                <a href={banner.link} target="_blank" rel="noopener noreferrer" className="text-zinc-200 hover:text-white underline underline-offset-2 decoration-zinc-600 hover:decoration-zinc-300">
                  {banner.text || '(empty)'}
                </a>
              ) : (
                <span className="text-zinc-200">{banner.text || '(empty)'}</span>
              )}
              {banner.dismissible !== false && <span className="ml-auto text-zinc-600 border border-zinc-700 px-1.5 py-0.5 text-[10px]">[×]</span>}
            </div>
            {!banner.enabled && <p className="text-[11px] text-amber-400 mt-2 font-mono">Banner is disabled — it will not show on the site until enabled and saved.</p>}
            {banner.enabled && !banner.text.trim() && <p className="text-[11px] text-amber-400 mt-2 font-mono">Text is empty — banner will not render until text is set.</p>}
          </div>

          <button onClick={() => save('banner', banner)} disabled={saving} className="px-4 py-2 bg-zinc-100 text-zinc-900 text-sm hover:bg-white disabled:opacity-50">
            {saving ? 'Saving…' : 'Save banner'}
          </button>
          <p className="text-[11px] text-zinc-600 font-mono">Saved to site_settings jsonb key=banner — no migration needed.</p>
        </div>
      )}
    </div>
  )
}

export default function AdminSiteContentPage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-4 sm:px-6 py-8"><p className="text-zinc-600 text-sm text-center py-8 animate-pulse font-mono">$ loading site content…</p></div>}>
      <SiteContentInner />
    </Suspense>
  )
}

// Helpers
function fmtDur(s: number) {
  if (!isFinite(s) || s <= 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}
function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const a = document.createElement('audio')
    a.preload = 'metadata'
    const done = (v: number) => { URL.revokeObjectURL(url); resolve(v) }
    a.onloadedmetadata = () => done(a.duration || 0)
    a.onerror = () => done(0)
    a.src = url
    // fallback — if metadata never fires
    setTimeout(() => done(0), 4000)
  })
}
function uploadAudioWithProgress(file: File, onProgress: (pct: number) => void): Promise<{ url: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/admin/upload-audio')
    try {
      const secret = typeof window !== 'undefined' ? localStorage.getItem('ixi_admin_secret') : null
      if (secret) xhr.setRequestHeader('x-admin-secret', secret)
      else xhr.setRequestHeader('x-admin-email', 'amirabbas.rouintan2007@gmail.com')
    } catch {}
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)) }
    xhr.onload = () => {
      try {
        const j = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300) resolve({ url: j.url as string })
        else reject(new Error(j.error || 'Upload failed'))
      } catch { reject(new Error('Upload failed')) }
    }
    xhr.onerror = () => reject(new Error('Network error'))
    const fd = new FormData()
    fd.append('file', file)
    xhr.send(fd)
  })
}

function AddTrackModal({ onClose, onAdd }: { onClose: () => void; onAdd: (t: PlaylistTrack) => void }) {
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [pct, setPct] = useState(0)
  const [upErr, setUpErr] = useState('')

  async function handleFile(file: File) {
    if (!file) return
    // quick client-side duration (before upload — fills dur immediately, corrected after)
    const durPromise = getAudioDuration(file)
    setFileName(file.name)
    setUploading(true); setPct(0); setUpErr('')
    try {
      const guessedDur = fmtDur(await durPromise)
      const { url } = await uploadAudioWithProgress(file, setPct)
      // finalize duration — trust audio metadata first, fallback to guessed
      const title = file.name.replace(/\.[^.]+$/, '')
      onAdd({ title, artist: 'Bahram', dur: guessedDur || '0:00', url })
    } catch (e) {
      setUpErr(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-label="Close" />
      <div className="relative w-full max-w-md border border-zinc-800 bg-zinc-900 p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2"><Music2 className="h-4 w-4 text-zinc-500" /> Add track</h3>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"><XIcon className="h-3.5 w-3.5" /></button>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed flex flex-col items-center justify-center gap-2 py-8 px-4 text-center transition-colors ${dragOver ? 'border-zinc-400 bg-zinc-800/60' : 'border-zinc-700 bg-zinc-950/50 hover:border-zinc-600 hover:bg-zinc-900'}`}
        >
          <Upload className={`h-6 w-6 ${dragOver ? 'text-zinc-200' : 'text-zinc-500'}`} />
          <p className="text-xs text-zinc-400">Drag & drop audio here</p>
          <p className="text-[11px] text-zinc-600 font-mono">mp3 · wav · flac · ogg · m4a · aac — ≤ 60 MB</p>
          <span className="text-[11px] text-zinc-600">or</span>
          <label className="px-3 py-1.5 text-xs border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer">
            Browse files
            <input type="file" accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac" className="hidden" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
          </label>
          {fileName && !uploading && !upErr && <p className="text-[11px] text-zinc-500 font-mono truncate max-w-full">{fileName}</p>}
        </div>

        {uploading && (
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-400 truncate">{fileName || 'Uploading…'}</span>
              <span className="text-zinc-300 tabular-nums">{pct}%</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-800 border border-zinc-800">
              <div className="h-full bg-zinc-100 transition-[width] duration-150" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
        {upErr && <p className="text-[11px] text-red-400 font-mono mt-2">{upErr}</p>}
        {!uploading && upErr && (
          <button onClick={() => { setUpErr(''); setFileName('') }} className="mt-2 text-[11px] text-zinc-500 hover:text-zinc-300 underline">Try again</button>
        )}
      </div>
    </div>
  )
}

function PlaylistRow({ track, idx, total, onChange, onMoveUp, onMoveDown, onRemove }: { track: PlaylistTrack; idx: number; total: number; onChange: (p: Partial<PlaylistTrack>) => void; onMoveUp: () => void; onMoveDown: () => void; onRemove: () => void }) {
  const [uploading, setUploading] = useState(false)
  const [pct, setPct] = useState(0)
  const [upErr, setUpErr] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setUploading(true); setUpErr(''); setPct(0)
    // auto title + duration from file before upload finishes
    const durPromise = getAudioDuration(f)
    try {
      const j = await uploadAudioWithProgress(f, setPct)
      const dur = fmtDur(await durPromise)
      const patch: Partial<PlaylistTrack> = { url: j.url as string }
      if (!track.title) patch.title = f.name.replace(/\.[^.]+$/, '')
      if (dur !== '0:00') patch.dur = dur
      // if already have title, still auto-fill duration if empty / default
      if (!patch.title && dur !== '0:00' && (!track.dur || track.dur === '3:00')) patch.dur = dur
      onChange(patch)
    } catch (err) {
      setUpErr(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="p-2 border border-zinc-800 bg-zinc-900 space-y-2">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[11px] text-zinc-600 w-6 text-center shrink-0">#{idx + 1}</span>
        <input value={track.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="Title" className="flex-1 min-w-[120px] bg-zinc-950 border border-zinc-800 px-2 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
        <input value={track.artist} onChange={(e) => onChange({ artist: e.target.value })} placeholder="Artist" className="w-28 bg-zinc-950 border border-zinc-800 px-2 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
        <input value={track.dur} onChange={(e) => onChange({ dur: e.target.value })} placeholder="3:16" className="w-16 bg-zinc-950 border border-zinc-800 px-2 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono" />
        <div className="flex gap-1 shrink-0">
          <button onClick={onMoveUp} disabled={idx === 0} className="h-7 w-7 flex items-center justify-center border border-zinc-800 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"><ChevronUp className="h-3 w-3" /></button>
          <button onClick={onMoveDown} disabled={idx === total - 1} className="h-7 w-7 flex items-center justify-center border border-zinc-800 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"><ChevronDown className="h-3 w-3" /></button>
          <button onClick={onRemove} className="h-7 w-7 flex items-center justify-center border border-red-900/50 text-red-400 hover:bg-red-950/30"><Trash2 className="h-3 w-3" /></button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <input value={track.url || ''} onChange={(e) => onChange({ url: e.target.value })} placeholder="https://res.cloudinary.com/.../track.mp3  (or upload →)" className="flex-1 min-w-[200px] bg-zinc-950 border border-zinc-800 px-2 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono" />
        <label className={`px-3 py-1.5 text-xs border cursor-pointer ${uploading ? 'bg-zinc-800 border-zinc-700 text-zinc-500' : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'}`}>
          {uploading ? `Uploading ${pct}%` : 'Upload audio'}
          <input type="file" accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac" onChange={handleFile} disabled={uploading} className="hidden" />
        </label>
        {track.url && <span className="text-[11px] text-emerald-400 font-mono truncate max-w-[160px]">✓ {track.url.slice(0, 40)}…</span>}
      </div>
      {uploading && (
        <div className="h-1.5 w-full bg-zinc-800 border border-zinc-800">
          <div className="h-full bg-zinc-100 transition-[width] duration-150" style={{ width: `${pct}%` }} />
        </div>
      )}
      {upErr && <p className="text-[11px] text-red-400 font-mono">{upErr}</p>}
      {track.url && <InlineAudioPlayer url={track.url} title={track.title || 'track'} onDuration={(d) => { if (d && d !== '0:00' && (!track.dur || track.dur === '3:00')) onChange({ dur: d }) }} />}
    </div>
  )
}

function InlineAudioPlayer({ url, title, onDuration }: { url: string; title: string; onDuration?: (dur: string) => void }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [cur, setCur] = useState(0)
  const [dur, setDur] = useState(0)
  const rafRef = useRef<number | null>(null)

  function fmt(s: number) {
    if (!isFinite(s) || s <= 0) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  function toggle() {
    const a = audioRef.current
    if (!a) return
    if (playing) a.pause()
    else a.play().catch(() => {})
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const a = audioRef.current
    if (!a || !dur) return
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    a.currentTime = pct * dur
    setCur(pct * dur)
  }

  // keep cur in sync while playing (rAF for smooth bar)
  useEffect(() => {
    if (!playing) { if (rafRef.current) cancelAnimationFrame(rafRef.current); return }
    const tick = () => {
      const a = audioRef.current
      if (a) setCur(a.currentTime)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [playing])

  const pct = dur ? Math.min(100, (cur / dur) * 100) : 0

  return (
    <div className="flex items-center gap-2 border border-zinc-800 bg-zinc-950 px-2 py-1.5 mt-1">
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const d = (e.target as HTMLAudioElement).duration || 0
          setDur(d)
          if (d) onDuration?.(fmt(d))
        }}
        onTimeUpdate={(e) => setCur((e.target as HTMLAudioElement).currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCur(0) }}
        className="hidden"
      />
      <button
        type="button"
        onClick={toggle}
        className="h-7 w-7 shrink-0 flex items-center justify-center border border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 hover:border-zinc-600 transition-colors"
        aria-label={playing ? 'Pause' : 'Play'}
        title={`${playing ? 'Pause' : 'Play'} ${title}`}
      >
        {playing ? <Pause className="h-3 w-3 fill-zinc-300" /> : <Play className="h-3 w-3 fill-zinc-300 ml-px" />}
      </button>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-zinc-500 truncate flex-1">{title}</span>
          <span className="text-[10px] font-mono text-zinc-500 tabular-nums shrink-0">{fmt(cur)} / {fmt(dur)}</span>
        </div>
        <div onClick={seek} className="h-1.5 w-full bg-zinc-800 border border-zinc-800 cursor-pointer group">
          <div className="h-full bg-zinc-200 group-hover:bg-white transition-colors" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}

