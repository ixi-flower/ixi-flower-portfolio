'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Trash2, Search, Bookmark, ExternalLink, GripVertical, Globe, Link2, X, SquarePen, ChevronDown, Download, Loader2, Tag } from 'lucide-react'
import ConfirmDialog from '@/components/admin/ConfirmDialog'

type BM = { id: string; title: string; url: string; description: string | null; favicon: string | null; folder: string | null; sortOrder: number; createdAt: string; updatedAt: string }

function faviconFor(url: string) {
  try { const u = new URL(url); return `${u.origin}/favicon.ico` } catch { return null }
}

function tagsOf(b: BM): string[] {
  if (!b.folder) return []
  return b.folder.split(',').map(s => s.trim()).filter(Boolean)
}

export default function AdminBookmarksPage() {
  const [items, setItems] = useState<BM[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')
  const [tagFilter, setTagFilter] = useState<string>('all')
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null)
  const [toastMsg, setToastMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null)
  const [toastLeaving, setToastLeaving] = useState(false)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toastLeaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  function pushToast(next: { t: 'ok' | 'err'; m: string } | null, ms = 2200) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    if (toastLeaveRef.current) clearTimeout(toastLeaveRef.current)
    if (!next) {
      if (!toastMsg) return
      setToastLeaving(true)
      toastLeaveRef.current = setTimeout(() => { setToastMsg(null); setToastLeaving(false) }, 280)
      return
    }
    setToastLeaving(false)
    setToastMsg(next)
    setMsg(next)
    toastTimerRef.current = setTimeout(() => {
      setToastLeaving(true)
      toastLeaveRef.current = setTimeout(() => { setToastMsg(null); setToastLeaving(false); setMsg(null) }, 280)
    }, ms)
  }
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [metaLoading, setMetaLoading] = useState(false)
  const [importing, setImporting] = useState(false)

  const [form, setForm] = useState<{ title: string; url: string; description: string; folder: string }>({ title: '', url: '', description: '', folder: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const metaFetchedFor = useRef<string>('')

  const load = useCallback(async () => {
    setLoading(true); setErr('')
    try {
      const r = await fetch('/api/admin/bookmarks', { cache: 'no-store' })
      if (!r.ok) throw new Error('Failed to load')
      const j = await r.json()
      setItems(j.bookmarks || [])
    } catch (e) { setErr(e instanceof Error ? e.message : 'Load failed') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const allTags = [...new Set(items.flatMap(b => tagsOf(b)))].sort((a,b)=>a.localeCompare(b))
  // keep old folders for backwards compat filter label: tags now
  const folders = allTags

  const filtered = items.filter(b => {
    if (tagFilter !== 'all') {
      if (tagFilter === '') { if (tagsOf(b).length !== 0) return false }
      else { if (!tagsOf(b).includes(tagFilter)) return false }
    }
    if (!q.trim()) return true
    const low = q.toLowerCase()
    return b.title.toLowerCase().includes(low) || b.url.toLowerCase().includes(low) || (b.description || '').toLowerCase().includes(low) || tagsOf(b).some(t=>t.toLowerCase().includes(low))
  })

  const pendingDelete = pendingDeleteId ? items.find(x => x.id === pendingDeleteId) ?? null : null

  function openAdd() {
    setEditingId(null)
    setForm({ title: '', url: '', description: '', folder: '' })
    metaFetchedFor.current = ''
    setModalOpen(true)
  }
  function openEdit(b: BM) {
    setEditingId(b.id)
    setForm({ title: b.title, url: b.url, description: b.description || '', folder: b.folder || '' })
    metaFetchedFor.current = b.url
    setModalOpen(true)
  }
  function closeModal() {
    setModalOpen(false)
    setEditingId(null)
    setForm({ title: '', url: '', description: '', folder: '' })
    metaFetchedFor.current = ''
  }

  async function fetchMeta(url: string) {
    const trimmed = url.trim()
    if (!trimmed) return
    try { new URL(trimmed) } catch { return }
    if (metaFetchedFor.current === trimmed) return
    metaFetchedFor.current = trimmed
    setMetaLoading(true)
    try {
      const r = await fetch(`/api/admin/bookmarks/meta?url=${encodeURIComponent(trimmed)}`)
      if (!r.ok) return
      const j = await r.json() as { title: string | null; description: string | null }
      setForm(f => {
        let next = { ...f }
        let changed = false
        if (j.title && !f.title.trim()) { next.title = j.title; changed = true }
        if (j.description && !f.description.trim()) { next.description = j.description; changed = true }
        // also auto-tag from title domain? no
        return changed ? next : f
      })
      if (j.title && !form.title.trim()) pushToast({ t:'ok', m:'Auto-filled from link ✓' }, 2000)
    } catch {}
    finally { setMetaLoading(false) }
  }

  async function handleImport() {
    setImporting(true); pushToast(null)
    try {
      const r = await fetch('/api/admin/bookmarks/import', { method:'POST', headers:{'Content-Type':'application/json'} })
      const j = await r.json().catch(()=>({}))
      if (!r.ok) { pushToast({ t:'err', m: j.error || 'Import failed' }); return }
      pushToast({ t:'ok', m: `Imported ${j.imported} · skipped ${j.skipped} · total ${j.total} on storipalorium ✓` }, 3000)
      await load()
    } catch { pushToast({ t:'err', m:'Import failed' })}
    finally { setImporting(false) }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.url.trim()) { pushToast({ t: 'err', m: 'Title and URL required' }); return }
    pushToast(null)
    if (editingId) {
      const r = await fetch(`/api/admin/bookmarks/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: form.title.trim(), url: form.url.trim(), description: form.description.trim() || null, folder: form.folder.trim() || null, favicon: faviconFor(form.url.trim()) }) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { pushToast({ t: 'err', m: j.error || 'Update failed' }); return }
      setItems(prev => prev.map(x => x.id === editingId ? { ...x, ...j.bookmark } : x))
      pushToast({ t: 'ok', m: 'Updated ✓' })
    } else {
      const r = await fetch('/api/admin/bookmarks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: form.title.trim(), url: form.url.trim(), description: form.description.trim() || null, folder: form.folder.trim() || null, favicon: faviconFor(form.url.trim()) }) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { pushToast({ t: 'err', m: j.error || 'Create failed' }); return }
      setItems(prev => [...prev, j.bookmark])
      pushToast({ t: 'ok', m: 'Bookmark added ✓' })
    }
    closeModal()
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return
    const id = pendingDeleteId
    setPendingDeleteId(null)
    const r = await fetch(`/api/admin/bookmarks/${id}`, { method: 'DELETE' })
    if (!r.ok) { pushToast({ t: 'err', m: 'Delete failed' }); return }
    setItems(prev => prev.filter(x => x.id !== id))
    if (editingId === id) closeModal()
    pushToast({ t: 'ok', m: 'Deleted ✓' })
  }

  function handleBodyClick(e: React.MouseEvent, b: BM) {
    const target = e.target as HTMLElement
    if (target.closest('a, button')) return
    navigator.clipboard.writeText(b.url).then(() => {
      pushToast({ t: 'ok', m: `Copied ✓ ${b.url.slice(0, 60)}` }, 2000)
    }).catch(() => {
      pushToast({ t: 'err', m: 'Copy failed' })
    })
  }

  function handleBodyAux(e: React.MouseEvent, b: BM) {
    if (e.button !== 1) return
    const target = e.target as HTMLElement
    if (target.closest('a, button')) return
    e.preventDefault()
    window.open(b.url, '_blank', 'noopener,noreferrer')
  }

  async function saveOrder() {
    setSaving(true); pushToast(null)
    try {
      const r = await fetch('/api/admin/bookmarks/reorder', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderedIds: filtered.map(b => b.id) }) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { pushToast({ t: 'err', m: j.error || 'Reorder failed' }); return }
      const orderMap = new Map(filtered.map((b, i) => [b.id, i]))
      setItems(prev => [...prev].sort((a, b) => {
        const ai = orderMap.has(a.id) ? orderMap.get(a.id)! : 9999
        const bi = orderMap.has(b.id) ? orderMap.get(b.id)! : 9999
        return ai - bi
      }))
      pushToast({ t: 'ok', m: 'Order saved ✓' })
    } catch { pushToast({ t: 'err', m: 'Network error' }) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-8"><p className="text-zinc-600 text-sm font-mono animate-pulse">$ loading bookmarks…</p></div>

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 admin-fade">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 admin-fade">
          <div>
            <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2"><Bookmark className="h-5 w-5 text-zinc-500" /> Bookmarks</h1>
            <p className="text-xs text-zinc-500 mt-1 font-mono">$ bookmarks --list — {items.length} saved · drag ⋮⋮ to reorder</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleImport} disabled={importing} className="inline-flex items-center gap-1.5 px-3 py-2 border border-zinc-800 bg-zinc-900 text-zinc-300 text-xs hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-40 font-mono">
              {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} {importing ? 'Importing…' : 'Import from Storipalorium'}
            </button>
            <button onClick={openAdd} className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-100 text-zinc-900 text-sm hover:bg-white font-mono"><Plus className="h-4 w-4" /> New bookmark</button>
          </div>
        </div>

        {err && <div className="border border-red-900/50 bg-red-950/30 text-red-300 text-sm px-4 py-3 mb-4 font-mono">{err}</div>}

        <div className="flex flex-wrap gap-2 mb-4 admin-fade admin-fade-d1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search bookmarks…" className="w-full bg-zinc-900 border border-zinc-800 pl-8 pr-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
          </div>
          <div className="relative">
            <select value={tagFilter} onChange={e => setTagFilter(e.target.value)} className="appearance-none bg-zinc-900 border border-zinc-800 pl-3 pr-8 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600 leading-none h-[34px] flex items-center">
              <option value="all">All tags</option>
              {folders.map(f => <option key={f} value={f}>{f}</option>)}
              <option value="">(no tag)</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          </div>
          {filtered.length > 1 && !q.trim() && tagFilter === 'all' && (
            <button onClick={saveOrder} disabled={saving} className="px-3 py-2 text-xs border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40">
              {saving ? 'Saving…' : 'Save order'}
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center py-8 border border-zinc-800 bg-zinc-900/30">{q || tagFilter !== 'all' ? 'No matches.' : 'No bookmarks yet — click New bookmark ↑ or Import from Storipalorium'}</p>
        ) : (
          <div className="space-y-2 admin-fade admin-fade-d2">
            {filtered.map((b, i) => (
              <div
                key={b.id}
                draggable={!q.trim() && tagFilter === 'all'}
                onDragStart={() => setDragIdx(i)}
                onDragOver={(e) => {
                  if (dragIdx === null || dragIdx === i || q.trim() || tagFilter !== 'all') return
                  e.preventDefault()
                  const a = [...filtered]; const [m] = a.splice(dragIdx, 1); a.splice(i, 0, m)
                  setItems(prev => {
                    const filteredIds = new Set(a.map(x => x.id))
                    const rest = prev.filter(x => !filteredIds.has(x.id))
                    return [...a, ...rest]
                  })
                  setDragIdx(i)
                }}
                onDragEnd={() => setDragIdx(null)}
                onDrop={() => setDragIdx(null)}
                onClick={(e) => handleBodyClick(e, b)}
                onAuxClick={(e) => handleBodyAux(e, b)}
                onMouseDown={(e) => { if (e.button === 1) e.preventDefault() }}
                title="Click to copy URL · middle-click to open"
                className={`flex items-center gap-3 p-3 border bg-zinc-900 transition-all duration-200 cursor-pointer select-none ${dragIdx === i ? 'opacity-40 border-zinc-600' : 'border-zinc-800 hover:border-zinc-700'}`}
              >
                {!q.trim() && tagFilter === 'all' && (
                  <span title="Drag to reorder" className="shrink-0 h-8 w-6 flex items-center justify-center text-zinc-600 cursor-grab active:cursor-grabbing hover:text-zinc-400"><GripVertical className="h-3.5 w-3.5" /></span>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {b.favicon ? <img src={b.favicon} alt="" width={20} height={20} className="h-5 w-5 object-contain shrink-0 bg-zinc-950 border border-zinc-800 p-0.5" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} /> : <Globe className="h-5 w-5 text-zinc-600 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-100 truncate flex items-center gap-2 flex-wrap">
                    <a href={b.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">{b.title}</a>
                    {tagsOf(b).map(t => (
                      <button key={t} onClick={()=>setTagFilter(t)} className="text-[10px] px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-400 font-mono shrink-0 inline-flex items-center gap-1 hover:bg-zinc-700 hover:text-zinc-200"><Tag className="h-2.5 w-2.5" />{t}</button>
                    ))}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5 truncate font-mono flex items-center gap-2">
                    <span className="truncate">{b.url}</span>
                    {b.description && <span className="text-zinc-600 truncate">· {b.description}</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <a href={b.url} target="_blank" rel="noopener noreferrer" title="Open" className="h-7 w-7 flex items-center justify-center border border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"><ExternalLink className="h-3.5 w-3.5" /></a>
                  <button onClick={() => openEdit(b)} title="Edit" className="h-7 w-7 flex items-center justify-center border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"><SquarePen className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setPendingDeleteId(b.id)} title="Delete" className="h-7 w-7 flex items-center justify-center border border-red-900/50 text-red-400 hover:bg-red-950/30"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toastMsg && typeof document !== 'undefined' ? createPortal(
        <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] border text-xs font-mono px-4 py-2.5 shadow-2xl max-w-[90vw] truncate ${toastLeaving ? 'toast-exit' : 'toast-enter'} ${toastMsg.t === 'ok' ? 'bg-zinc-900 border-emerald-700/60 text-emerald-300' : 'bg-zinc-900 border-red-700/60 text-red-300'}`}>
          {toastMsg.m}
        </div>,
        document.body,
      ) : null}

      {/* bookmark add/edit modal — outside admin-fade so fixed is relative to viewport */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} aria-label="close" />
          <form onSubmit={submit} className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 p-5 space-y-3 shadow-2xl max-h-[90vh] overflow-auto custom-scrollbar">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-bold text-zinc-100"><Link2 className="h-4 w-4 text-zinc-500" /> {editingId ? 'Edit bookmark' : 'Add bookmark'}</span>
              <button type="button" onClick={closeModal} className="h-8 w-8 flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent hover:border-zinc-800"><X className="h-4 w-4" /></button>
            </div>
            <label className="block">
              <span className="text-[11px] text-zinc-500 font-mono flex items-center gap-1">URL * {metaLoading && <span className="text-zinc-600 inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> fetching…</span>}</span>
              <input
                value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                onBlur={() => fetchMeta(form.url)}
                placeholder="https://example.com"
                className="mt-1 w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono"
              />
              <span className="text-[10px] text-zinc-600 font-mono mt-1 block">Paste a link and leave the field — title & description auto-fill from the page.</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[11px] text-zinc-500 font-mono">Title *</span>
                <input autoFocus value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="My cool site" className="mt-1 w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
              </label>
              <label className="block">
                <span className="text-[11px] text-zinc-500 font-mono flex items-center gap-1"><Tag className="h-3 w-3" /> Tags</span>
                <input value={form.folder} onChange={e => setForm(f => ({ ...f, folder: e.target.value }))} placeholder="ai, design, tools" list="bookmark-tags" className="mt-1 w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
                <datalist id="bookmark-tags">{folders.map(f => <option key={f} value={f} />)}</datalist>
                <span className="text-[10px] text-zinc-600 font-mono">Comma-separated. e.g. useful, ui</span>
              </label>
            </div>
            <label className="block">
              <span className="text-[11px] text-zinc-500 font-mono">Description</span>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short note…" className="mt-1 w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
            </label>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 py-2.5 bg-zinc-100 text-zinc-900 text-sm hover:bg-white inline-flex items-center justify-center gap-1.5 font-mono"><Plus className="h-3.5 w-3.5" /> {editingId ? 'Update' : 'Add bookmark'}</button>
              <button type="button" onClick={closeModal} className="px-4 py-2.5 border border-zinc-800 text-zinc-400 hover:bg-zinc-900 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* themed delete confirm — system design */}
      <ConfirmDialog
        open={!!pendingDeleteId}
        title="Delete bookmark?"
        message={pendingDelete ? `Delete "${pendingDelete.title}" — this cannot be undone.` : 'Delete this bookmark?'}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </>
  )
}
