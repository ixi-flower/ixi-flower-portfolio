'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { KeyRound, Shield, Search, Plus, Trash2, SquarePen, Eye, EyeOff, Copy, ExternalLink, GripVertical, X, RefreshCw, Lock, Settings2, SlidersHorizontal } from 'lucide-react'
import ConfirmDialog from '@/components/admin/ConfirmDialog'

type Entry = {
  id: string; title: string; site: string | null; username: string | null
  notes: string | null; sortOrder: number; createdAt: string; updatedAt: string
  hasPassword?: boolean; password?: string
}

type GenCfg = {
  length: number
  upper: boolean
  lower: boolean
  digits: boolean
  symbols: boolean
  symbolSet: string
  excludeAmbiguous: boolean
  requireEach: boolean
}

const DEFAULT_GEN_CFG: GenCfg = {
  length: 20,
  upper: true,
  lower: true,
  digits: true,
  symbols: true,
  symbolSet: '!@#$%_+-=',
  excludeAmbiguous: false,
  requireEach: true,
}

const GEN_CFG_KEY = 'ixi_vault_gen_cfg'

function genPasswordWithCfg(cfg: GenCfg): string {
  const AMBIGUOUS = new Set('Il1O0o'.split(''))
  let upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let lower = 'abcdefghijklmnopqrstuvwxyz'
  let digits = '0123456789'
  let symbols = cfg.symbolSet || '!@#$%_+-='
  if (cfg.excludeAmbiguous) {
    const strip = (s: string) => [...s].filter(c => !AMBIGUOUS.has(c)).join('')
    upper = strip(upper); lower = strip(lower); digits = strip(digits); symbols = strip(symbols)
  }
  const pools: string[] = []
  if (cfg.upper) pools.push(upper)
  if (cfg.lower) pools.push(lower)
  if (cfg.digits) pools.push(digits)
  if (cfg.symbols) pools.push(symbols)
  if (pools.length === 0) pools.push(upper + lower + digits)
  const charset = pools.join('')
  const len = Math.max(4, Math.min(128, cfg.length | 0))
  const a = new Uint8Array(len)
  crypto.getRandomValues(a)
  const out = Array.from(a, b => charset[b % charset.length])
  if (cfg.requireEach && pools.length > 1 && len >= pools.length) {
    // guarantee at least one of each selected pool
    for (let i = 0; i < pools.length; i++) {
      const pool = pools[i]
      const pos = a[i] % len
      const pick = pool[crypto.getRandomValues(new Uint8Array(1))[0] % pool.length]
      out[pos] = pick
    }
  }
  return out.join('')
}

// compat wrapper for old call sites
function genPassword(len = 20) {
  return genPasswordWithCfg({ ...DEFAULT_GEN_CFG, length: len })
}

function strength(pw: string): { label: string; pct: number; color: string } {
  if (!pw) return { label: '—', pct: 0, color: 'bg-zinc-800' }
  let s = 0
  if (pw.length >= 12) s += 2
  else if (pw.length >= 8) s += 1
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s += 1
  if (/\d/.test(pw)) s += 1
  if (/[^a-zA-Z0-9]/.test(pw)) s += 1
  if (pw.length >= 16 && s >= 4) s += 1
  if (s <= 1) return { label: 'weak', pct: 25, color: 'bg-red-500' }
  if (s === 2) return { label: 'fair', pct: 45, color: 'bg-amber-500' }
  if (s === 3) return { label: 'good', pct: 70, color: 'bg-sky-500' }
  return { label: 'strong', pct: 100, color: 'bg-emerald-500' }
}

export default function AdminVaultPage() {
  const [items, setItems] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null)
  const [toast, setToast] = useState<{ t: 'ok' | 'err'; m: string } | null>(null)
  const [toastLeaving, setToastLeaving] = useState(false)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toastLeaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  function pushToast(next: { t: 'ok' | 'err'; m: string } | null, ms = 2200) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    if (toastLeaveRef.current) clearTimeout(toastLeaveRef.current)
    if (!next) { if (!toast) return; setToastLeaving(true); toastLeaveRef.current = setTimeout(() => { setToast(null); setToastLeaving(false) }, 280); return }
    setToastLeaving(false); setToast(next); setMsg(next)
    toastTimerRef.current = setTimeout(() => { setToastLeaving(true); toastLeaveRef.current = setTimeout(() => { setToast(null); setToastLeaving(false); setMsg(null) }, 280) }, ms)
  }

  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [revealed, setRevealed] = useState<Record<string, string>>({})
  const [revealingId, setRevealingId] = useState<string | null>(null)

  const [form, setForm] = useState({ title: '', site: '', username: '', password: '', notes: '' })
  const [showPw, setShowPw] = useState(false)
  const [genCfg, setGenCfg] = useState<GenCfg>(DEFAULT_GEN_CFG)
  const [genCfgOpen, setGenCfgOpen] = useState(false)
  const st = strength(form.password)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(GEN_CFG_KEY)
      if (raw) setGenCfg(prev => ({ ...prev, ...JSON.parse(raw) }))
    } catch {}
  }, [])
  useEffect(() => {
    try { localStorage.setItem(GEN_CFG_KEY, JSON.stringify(genCfg)) } catch {}
  }, [genCfg])

  const load = useCallback(async (query?: string) => {
    setLoading(true); setErr('')
    try {
      const url = query?.trim() ? `/api/admin/vault?q=${encodeURIComponent(query.trim())}` : '/api/admin/vault'
      const r = await fetch(url, { cache: 'no-store' })
      if (!r.ok) throw new Error('Failed to load vault')
      const j = await r.json()
      setItems(j.entries || [])
    } catch (e) { setErr(e instanceof Error ? e.message : 'Load failed') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const t = setTimeout(() => load(q), 300)
    return () => clearTimeout(t)
  }, [q, load])

  const pendingDelete = pendingDeleteId ? items.find(x => x.id === pendingDeleteId) ?? null : null

  function openAdd() {
    setEditingId(null)
    setForm({ title: '', site: '', username: '', password: '', notes: '' })
    setShowPw(false)
    setModalOpen(true)
  }
  async function openEdit(e: Entry) {
    setEditingId(e.id)
    // if already revealed use it, else fetch revealed
    let pw = revealed[e.id] || ''
    if (!pw) {
      try {
        const r = await fetch(`/api/admin/vault/${e.id}?reveal=1`, { cache: 'no-store' })
        const j = await r.json()
        if (r.ok && j.entry?.password) pw = j.entry.password
      } catch {}
    }
    setForm({ title: e.title, site: e.site || '', username: e.username || '', password: pw, notes: e.notes || '' })
    setShowPw(false)
    setModalOpen(true)
  }
  function closeModal() { setModalOpen(false); setEditingId(null); setForm({ title: '', site: '', username: '', password: '', notes: '' }); setShowPw(false) }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!form.title.trim()) { pushToast({ t: 'err', m: 'Title required' }); return }
    if (!editingId && !form.password) { pushToast({ t: 'err', m: 'Password required' }); return }
    // editing: password may be empty means "keep existing" — we only send if non-empty
    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      site: form.site.trim() || null,
      username: form.username.trim() || null,
      notes: form.notes.trim() || null,
    }
    if (form.password) payload.password = form.password
    else if (!editingId) { pushToast({ t: 'err', m: 'Password required' }); return }
    // if editing and password empty -> don't include password key (keep existing)

    if (editingId) {
      const body: Record<string, unknown> = { title: payload.title, site: payload.site, username: payload.username, notes: payload.notes }
      if (form.password) body.password = form.password
      const r = await fetch(`/api/admin/vault/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { pushToast({ t: 'err', m: j.error || 'Update failed' }); return }
      setItems(prev => prev.map(x => x.id === editingId ? { ...x, title: j.entry.title, site: j.entry.site, username: j.entry.username, notes: j.entry.notes } : x))
      if (form.password) setRevealed(prev => ({ ...prev, [editingId]: form.password }))
      pushToast({ t: 'ok', m: 'Updated ✓' })
    } else {
      const r = await fetch('/api/admin/vault', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { pushToast({ t: 'err', m: j.error || 'Create failed' }); return }
      // reload to reflect sortOrder 0 at top
      await load(q)
      pushToast({ t: 'ok', m: 'Saved to vault ✓ AES-256-GCM' })
    }
    closeModal()
  }

  async function toggleReveal(id: string) {
    if (revealed[id] !== undefined) {
      const next = { ...revealed }; delete next[id]; setRevealed(next)
      return
    }
    setRevealingId(id)
    try {
      const r = await fetch(`/api/admin/vault/${id}?reveal=1`, { cache: 'no-store' })
      const j = await r.json()
      if (!r.ok) { pushToast({ t: 'err', m: j.error || 'Reveal failed' }); return }
      const pw = j.entry?.password as string | undefined
      if (pw == null) { pushToast({ t: 'err', m: 'No password' }); return }
      setRevealed(prev => ({ ...prev, [id]: pw }))
      // auto-hide after 20s
      setTimeout(() => setRevealed(prev => { const n = { ...prev }; delete n[id]; return n }), 20000)
    } catch { pushToast({ t: 'err', m: 'Network error' }) }
    finally { setRevealingId(null) }
  }

  async function copyText(v: string, label: string) {
    try { await navigator.clipboard.writeText(v); pushToast({ t: 'ok', m: `${label} copied ✓` }, 1800) }
    catch { pushToast({ t: 'err', m: 'Copy failed' }) }
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return
    const id = pendingDeleteId; setPendingDeleteId(null)
    const r = await fetch(`/api/admin/vault/${id}`, { method: 'DELETE' })
    if (!r.ok) { pushToast({ t: 'err', m: 'Delete failed' }); return }
    setItems(prev => prev.filter(x => x.id !== id))
    setRevealed(prev => { const n = { ...prev }; delete n[id]; return n })
    pushToast({ t: 'ok', m: 'Deleted ✓' })
  }

  async function saveOrder() {
    setSaving(true)
    try {
      const r = await fetch('/api/admin/vault/reorder', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderedIds: items.map(x => x.id) }) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { pushToast({ t: 'err', m: j.error || 'Reorder failed' }); return }
      pushToast({ t: 'ok', m: 'Order saved ✓' })
    } catch { pushToast({ t: 'err', m: 'Network error' }) }
    finally { setSaving(false) }
  }

  if (loading && items.length === 0) {
    return <div className="max-w-5xl mx-auto px-4 py-8"><p className="text-zinc-600 text-sm font-mono animate-pulse">$ vault --list …</p></div>
  }

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 admin-fade">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 admin-fade">
          <div>
            <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2"><KeyRound className="h-5 w-5 text-amber-500" /> Vault <span className="text-xs font-mono text-zinc-600">pass manager</span></h1>
            <p className="text-xs text-zinc-500 mt-1 font-mono flex items-center gap-2">
              <Shield className="h-3 w-3 text-emerald-500" /> AES-256-GCM · key = ADMIN_JWT_SECRET · {items.length} credentials · drag ⋮⋮ to reorder
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setGenCfgOpen(v => !v)} className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-mono border ${genCfgOpen ? 'bg-zinc-800 text-zinc-100 border-zinc-600' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-100 hover:border-zinc-700'}`} title="Generator config">
              <SlidersHorizontal className="h-4 w-4" /> Generator
            </button>
            <button onClick={openAdd} className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-100 text-zinc-900 text-sm hover:bg-white font-mono">
              <Plus className="h-4 w-4" /> New entry
            </button>
          </div>
        </div>

        {genCfgOpen && (
          <div className="mb-4 border border-zinc-800 bg-zinc-900 p-4 space-y-3 admin-fade">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-100 font-mono flex items-center gap-2"><Settings2 className="h-3.5 w-3.5 text-amber-500" /> Generator config</span>
              <button onClick={() => setGenCfg(DEFAULT_GEN_CFG)} className="text-[11px] font-mono text-zinc-500 hover:text-zinc-300 border border-zinc-800 px-2 py-1 hover:bg-zinc-800">Reset defaults</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[11px] text-zinc-500 font-mono">Length: {genCfg.length}</span>
                <input type="range" min={4} max={64} value={genCfg.length} onChange={e => setGenCfg(c => ({ ...c, length: parseInt(e.target.value) || 20 }))} className="w-full mt-1 accent-zinc-100" />
                <div className="flex gap-2 mt-1">
                  <input type="number" min={4} max={128} value={genCfg.length} onChange={e => setGenCfg(c => ({ ...c, length: Math.max(4, Math.min(128, parseInt(e.target.value) || 0)) }))} className="w-20 bg-zinc-950 border border-zinc-800 px-2 py-1 text-xs text-zinc-100 font-mono focus:outline-none focus:border-zinc-600" />
                  <span className="text-[11px] text-zinc-600 font-mono self-center">4 – 128 chars · entropy ≈ {(Math.log2((() => { let n=0; if(genCfg.upper) n+=26; if(genCfg.lower) n+=26; if(genCfg.digits) n+=10; if(genCfg.symbols) n+= (genCfg.symbolSet||'!@#$%_+-=').length; if(genCfg.excludeAmbiguous) n=Math.max(1,n-6); return Math.max(1,n) })()) * genCfg.length).toFixed(1)} bits</span>
                </div>
              </label>
              <div className="space-y-2">
                <span className="text-[11px] text-zinc-500 font-mono block">Character sets</span>
                {([
                  ['upper','A–Z (uppercase)'],
                  ['lower','a–z (lowercase)'],
                  ['digits','0–9 (digits)'],
                  ['symbols','Symbols'],
                ] as const).map(([k,label]) => (
                  <label key={k} className="flex items-center gap-2 text-xs font-mono text-zinc-300 cursor-pointer">
                    <input type="checkbox" checked={(genCfg as any)[k]} onChange={e => setGenCfg(c => ({ ...c, [k]: e.target.checked }))} className="h-3.5 w-3.5 accent-zinc-100 bg-zinc-900 border-zinc-700" />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <label className="block">
              <span className="text-[11px] text-zinc-500 font-mono">Symbols set {genCfg.symbols ? '' : '(ignored — symbols off)'}</span>
              <input value={genCfg.symbolSet} onChange={e => setGenCfg(c => ({ ...c, symbolSet: e.target.value }))} placeholder="!@#$%_+-=" className="mt-1 w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono disabled:opacity-40" disabled={!genCfg.symbols} />
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-xs font-mono text-zinc-300 cursor-pointer">
                <input type="checkbox" checked={genCfg.excludeAmbiguous} onChange={e => setGenCfg(c => ({ ...c, excludeAmbiguous: e.target.checked }))} className="h-3.5 w-3.5 accent-zinc-100" />
                Exclude ambiguous <span className="text-zinc-600">Il1O0o</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-mono text-zinc-300 cursor-pointer">
                <input type="checkbox" checked={genCfg.requireEach} onChange={e => setGenCfg(c => ({ ...c, requireEach: e.target.checked }))} className="h-3.5 w-3.5 accent-zinc-100" />
                Require each selected set
              </label>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => { const pw = genPasswordWithCfg(genCfg); setForm(f => ({ ...f, password: pw })); if (!modalOpen) setModalOpen(true); pushToast({ t: 'ok', m: `Generated preview · ${pw.length} chars` }, 1800) }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 text-zinc-900 text-xs hover:bg-white font-mono">
                <RefreshCw className="h-3 w-3" /> Preview generate
              </button>
              <span className="text-[11px] text-zinc-600 font-mono self-center">Saved to localStorage · used for every Generate</span>
            </div>
          </div>
        )}

        {err && <div className="border border-red-900/50 bg-red-950/30 text-red-300 text-sm px-4 py-3 mb-4 font-mono">{err}</div>}
        {msg && <div className={`text-xs px-3 py-2 border font-mono mb-3 ${msg.t === 'ok' ? 'border-emerald-900/50 bg-emerald-950/30 text-emerald-300' : 'border-red-900/50 bg-red-950/30 text-red-300'}`}>{msg.m}</div>}

        <div className="flex flex-wrap gap-2 mb-4 admin-fade admin-fade-d1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search title / site / username…" className="w-full bg-zinc-900 border border-zinc-800 pl-8 pr-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
          </div>
          {items.length > 1 && !q.trim() && (
            <button onClick={saveOrder} disabled={saving} className="px-3 py-2 text-xs border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40">
              {saving ? 'Saving…' : 'Save order'}
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center py-8 border border-zinc-800 bg-zinc-900/30 font-mono">
            {q.trim() ? 'No matches.' : 'Vault empty — add your first credential ↑ · encrypted at rest with AES-256-GCM.'}
          </p>
        ) : (
          <div className="space-y-2 admin-fade admin-fade-d2">
            {items.map((e, i) => {
              const pw = revealed[e.id]
              const isRevealed = pw !== undefined
              return (
                <div
                  key={e.id}
                  draggable={!q.trim()}
                  onDragStart={() => setDragIdx(i)}
                  onDragOver={ev => {
                    if (dragIdx === null || dragIdx === i || q.trim()) return
                    ev.preventDefault()
                    const a = [...items]; const [m] = a.splice(dragIdx, 1); a.splice(i, 0, m)
                    setItems(a); setDragIdx(i)
                  }}
                  onDragEnd={() => setDragIdx(null)}
                  onDrop={() => setDragIdx(null)}
                  className={`flex items-center gap-3 p-3 border bg-zinc-900 transition-all ${dragIdx === i ? 'opacity-40 border-zinc-600' : 'border-zinc-800 hover:border-zinc-700'}`}
                >
                  {!q.trim() && <span title="Drag to reorder" className="shrink-0 h-8 w-6 hidden sm:flex items-center justify-center text-zinc-600 cursor-grab active:cursor-grabbing hover:text-zinc-400"><GripVertical className="h-3.5 w-3.5" /></span>}
                  <div className="h-9 w-9 shrink-0 bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                    <Lock className="h-4 w-4 text-zinc-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zinc-100 truncate flex items-center gap-2">
                      <span className="truncate">{e.title}</span>
                      {e.site && <a href={e.site.startsWith('http') ? e.site : `https://${e.site}`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-zinc-500 hover:text-zinc-300 font-mono truncate">↗ {e.site}</a>}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5 font-mono flex items-center gap-2 flex-wrap">
                      {e.username && <span className="inline-flex items-center gap-1">user: <span className="text-zinc-300">{e.username}</span> <button onClick={() => copyText(e.username!, 'Username')} className="h-5 w-5 flex items-center justify-center border border-zinc-800 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200"><Copy className="h-3 w-3" /></button></span>}
                      <span className={`inline-flex items-center gap-1 ${isRevealed ? 'text-emerald-300' : 'text-zinc-600'}`}>
                        pass: <span className={`font-mono ${isRevealed ? 'text-zinc-100 select-all' : 'tracking-widest'}`}>{isRevealed ? pw : '••••••••••••'}</span>
                        {isRevealed && <button onClick={() => copyText(pw, 'Password')} className="h-5 w-5 flex items-center justify-center border border-zinc-800 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200"><Copy className="h-3 w-3" /></button>}
                      </span>
                      {e.notes && <span className="text-zinc-600 truncate">· {e.notes}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => toggleReveal(e.id)} disabled={revealingId === e.id} title={isRevealed ? 'Hide' : 'Reveal (20s)'} className={`h-7 w-7 flex items-center justify-center border ${isRevealed ? 'border-amber-900/50 bg-amber-950/30 text-amber-300' : 'border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200'} disabled:opacity-40`}>
                      {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    {e.site && <a href={e.site.startsWith('http') ? e.site : `https://${e.site}`} target="_blank" rel="noopener noreferrer" className="h-7 w-7 flex items-center justify-center border border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"><ExternalLink className="h-3.5 w-3.5" /></a>}
                    <button onClick={() => openEdit(e)} title="Edit" className="h-7 w-7 flex items-center justify-center border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"><SquarePen className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setPendingDeleteId(e.id)} title="Delete" className="h-7 w-7 flex items-center justify-center border border-red-900/50 text-red-400 hover:bg-red-950/30"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-4 border border-zinc-800 bg-zinc-950 px-3 py-2 text-[11px] font-mono text-zinc-600 flex items-center gap-2">
          <Lock className="h-3 w-3 text-amber-500" /> At rest: AES-256-GCM (12-byte IV + 16-byte tag) · key derived SHA-256(ADMIN_JWT_SECRET) · bulk list never returns plaintext — reveal is per-entry + owner-only (JWT cookie).
        </div>
      </div>

      {toast && typeof document !== 'undefined' ? createPortal(
        <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] border text-xs font-mono px-4 py-2.5 shadow-2xl max-w-[90vw] truncate ${toastLeaving ? 'toast-exit' : 'toast-enter'} ${toast.t === 'ok' ? 'bg-zinc-900 border-emerald-700/60 text-emerald-300' : 'bg-zinc-900 border-red-700/60 text-red-300'}`}>{toast.m}</div>,
        document.body,
      ) : null}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} aria-label="close" />
          <form onSubmit={submit} className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 p-5 space-y-3 shadow-2xl max-h-[90vh] overflow-auto custom-scrollbar">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-bold text-zinc-100"><KeyRound className="h-4 w-4 text-amber-500" /> {editingId ? 'Edit entry' : 'New vault entry'}</span>
              <button type="button" onClick={closeModal} className="h-8 w-8 flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent hover:border-zinc-800"><X className="h-4 w-4" /></button>
            </div>
            <div className="border border-amber-900/30 bg-amber-950/20 text-amber-200 text-[11px] px-3 py-2 font-mono flex items-start gap-2">
              <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0" /> Encrypted with AES-256-GCM before DB insert. Only your admin session (JWT owner) can decrypt. Never logged, never in URLs.
            </div>
            <label className="block">
              <span className="text-[11px] text-zinc-500 font-mono">Title *</span>
              <input autoFocus value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. GitHub · VPS · Neon DB · Gmail" className="mt-1 w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[11px] text-zinc-500 font-mono">Site / URL</span>
                <input value={form.site} onChange={e => setForm(f => ({ ...f, site: e.target.value }))} placeholder="https://github.com" className="mt-1 w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono" />
              </label>
              <label className="block">
                <span className="text-[11px] text-zinc-500 font-mono">Username / email</span>
                <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="ixi_flower / you@mail.com" className="mt-1 w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono" />
              </label>
            </div>
            <label className="block">
              <span className="text-[11px] text-zinc-500 font-mono flex items-center justify-between">
                <span>Password {editingId ? '(leave empty to keep)' : '*'}</span>
                <button type="button" onClick={() => setForm(f => ({ ...f, password: genPasswordWithCfg(genCfg) }))} className="inline-flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200" title={`Generate ${genCfg.length} chars · ${[genCfg.upper&&'A-Z',genCfg.lower&&'a-z',genCfg.digits&&'0-9',genCfg.symbols&&genCfg.symbolSet].filter(Boolean).join(' ') || '—'}`}> <RefreshCw className="h-3 w-3" /> Generate</button>
              </span>
              <div className="mt-1 flex gap-2">
                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={editingId ? '•••••••• (keep)' : 'very-strong-password'} className="flex-1 bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono" />
                <button type="button" onClick={() => setShowPw(v => !v)} className="h-[38px] w-10 flex items-center justify-center border border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800">{showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
              {form.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-zinc-800 border border-zinc-800"><div className={`h-full ${st.color} transition-all`} style={{ width: `${st.pct}%` }} /></div>
                  <span className="text-[11px] font-mono text-zinc-500">{st.label} · {form.password.length} chars</span>
                </div>
              )}
            </label>
            <label className="block">
              <span className="text-[11px] text-zinc-500 font-mono">Notes</span>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="2FA, recovery, etc. (optional)" className="mt-1 w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
            </label>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 py-2.5 bg-zinc-100 text-zinc-900 text-sm hover:bg-white inline-flex items-center justify-center gap-1.5 font-mono"><Shield className="h-3.5 w-3.5" /> {editingId ? 'Update' : 'Encrypt & save'}</button>
              <button type="button" onClick={closeModal} className="px-4 py-2.5 border border-zinc-800 text-zinc-400 hover:bg-zinc-900 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDeleteId}
        title="Delete vault entry?"
        message={pendingDelete ? `Delete "${pendingDelete.title}" — this cannot be undone.` : 'Delete this entry?'}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </>
  )
}
