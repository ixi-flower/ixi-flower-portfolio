'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Plus, Search, FolderTree, FilePlus, FolderPlus } from 'lucide-react'
import ConfirmDialog from '@/components/admin/ConfirmDialog'

const BlogEditor = dynamic(() => import('@/components/admin/BlogEditor'), { ssr: false })

type Note = { id: string; parentId: string | null; title: string; content: string; icon: string | null; sortOrder: number; createdAt: string; updatedAt: string }

const DEFAULT_ICONS = ['📄','📁','📝','📌','💡','📚','🔥','⭐','🎯','💻','🛠️','📦','🌿','🧪','💬','📋','🗂️','🗒️','🔖','🚀','⚡','🧠','🎨','📌']

function IconPicker({ value, onPick }: { value: string; onPick: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-14 h-[38px] bg-zinc-950 border border-zinc-800 flex items-center justify-center text-lg hover:border-zinc-600 shrink-0"
        title="Pick icon"
      >
        {value || '📄'}
      </button>
      {open && (
        <>
          <button className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-label="close" />
          <div className="absolute left-0 top-full mt-1 z-20 bg-zinc-900 border border-zinc-700 p-2 grid grid-cols-6 gap-1 shadow-xl w-[192px]">
            {DEFAULT_ICONS.map(ic => (
              <button
                key={ic}
                type="button"
                onClick={() => { onPick(ic); setOpen(false) }}
                className={`h-8 w-8 flex items-center justify-center text-base border hover:bg-zinc-800 ${value === ic ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'bg-zinc-950 border-zinc-800 text-zinc-300'}`}
              >
                {ic}
              </button>
            ))}
            <button type="button" onClick={() => { onPick(''); setOpen(false) }} className="col-span-6 mt-1 text-[11px] text-zinc-500 hover:text-zinc-300 font-mono text-center py-1 border border-zinc-800">clear</button>
          </div>
        </>
      )}
    </div>
  )
}

export default function AdminNotesPage() {
  const searchParams = useSearchParams()
  const noteParam = searchParams.get('note') || searchParams.get('id') || searchParams.get('selected')

  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const [editTitle, setEditTitle] = useState('')
  const [editIcon, setEditIcon] = useState('')
  const [editContent, setEditContent] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [autoStatus, setAutoStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const lastSavedRef = useRef({ title: '', icon: '', content: '' })
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipAutoRef = useRef(false)
  const savingRef = useRef(false)

  const load = useCallback(async () => {
    setLoading(true); setErr('')
    try {
      const r = await fetch('/api/admin/notes', { cache: 'no-store' })
      if (!r.ok) throw new Error('Failed to load')
      const j = await r.json()
      const list: Note[] = j.notes || []
      setNotes(list)
      if (noteParam && list.some(n => n.id === noteParam)) setSelectedId(noteParam)
      else if (!selectedId && list.length) setSelectedId(list[0].id)
    } catch (e) { setErr(e instanceof Error ? e.message : 'Load failed') }
    finally { setLoading(false) }
  }, [selectedId, noteParam])

  useEffect(() => { load() }, [load])
  // live-time: sidebar mutations (rename/delete/reorder/create via context menu / drag) → reload without hard refresh
  useEffect(() => {
    const h = () => { load() }
    window.addEventListener('notes:changed', h)
    window.addEventListener('focus', h)
    const onVis = () => { if (document.visibilityState === 'visible') h() }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('notes:changed', h)
      window.removeEventListener('focus', h)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [load])

  // sync sidebar ?note= navigation without reload
  useEffect(() => {
    if (noteParam && notes.some(n => n.id === noteParam)) setSelectedId(noteParam)
  }, [noteParam, notes])

  const filtered = q.trim()
    ? notes.filter(n => n.title.toLowerCase().includes(q.toLowerCase()) || n.content.toLowerCase().includes(q.toLowerCase()))
    : null

  const selected = notes.find(n => n.id === selectedId) ?? null
  useEffect(() => {
    if (selected) {
      skipAutoRef.current = true
      lastSavedRef.current = { title: selected.title, icon: selected.icon || '', content: selected.content || '' }
      setAutoStatus('idle')
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current)
      setEditTitle(selected.title)
      setEditIcon(selected.icon || '')
      setEditContent(selected.content || '')
    }
  }, [selected?.id])

  async function createNote(parentId: string | null, asFolder = false) {
    const r = await fetch('/api/admin/notes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: asFolder ? 'New Folder' : 'New Note', content: '', parentId, icon: asFolder ? '📁' : '📄' }),
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) { setMsg({ t: 'err', m: j.error || 'Create failed' }); return }
    const n: Note = j.note
    setNotes(prev => [...prev, n])
    setSelectedId(n.id)
    if (parentId) setExpanded(prev => new Set([...prev, parentId]))
    if (asFolder) setExpanded(prev => new Set([...prev, n.id]))
    window.history.replaceState(null, '', `/admin/notes?note=${n.id}`)
    window.dispatchEvent(new Event('notes:changed'))
    setMsg({ t: 'ok', m: asFolder ? 'Folder created ✓' : 'Note created ✓' })
  }

  async function saveSelected() {
    if (!selected) return
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current)
    setSaving(true); setMsg(null)
    try {
      const r = await fetch(`/api/admin/notes/${selected.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, content: editContent, icon: editIcon || null }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setMsg({ t: 'err', m: j.error || 'Save failed' }); return }
      lastSavedRef.current = { title: editTitle, icon: editIcon || '', content: editContent }
      setNotes(prev => prev.map(n => n.id === selected.id ? { ...n, title: editTitle, content: editContent, icon: editIcon || null } : n))
      window.dispatchEvent(new Event('notes:changed'))
      setAutoStatus('saved')
      setTimeout(() => setAutoStatus('idle'), 2000)
      setMsg({ t: 'ok', m: 'Saved ✓' })
      setTimeout(() => setMsg(null), 2000)
    } catch { setMsg({ t: 'err', m: 'Network error' }) }
    finally { setSaving(false) }
  }

  // autosave — debounced 800ms on title/icon/content edits (covers checklist toggles)
  useEffect(() => {
    if (!selected) return
    if (skipAutoRef.current) { skipAutoRef.current = false; return }
    const cur = { title: editTitle, icon: editIcon || '', content: editContent }
    const last = lastSavedRef.current
    if (cur.title === last.title && cur.icon === last.icon && cur.content === last.content) return
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current)
    autoTimerRef.current = setTimeout(async () => {
      if (savingRef.current) return
      if (!selected) return
      const latest = lastSavedRef.current
      if (cur.title === latest.title && cur.icon === latest.icon && cur.content === latest.content) return
      savingRef.current = true
      setAutoStatus('saving')
      try {
        const r = await fetch(`/api/admin/notes/${selected.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: cur.title, content: cur.content, icon: cur.icon || null }),
        })
        if (!r.ok) { setAutoStatus('error'); setMsg({ t: 'err', m: 'Autosave failed' }); return }
        lastSavedRef.current = cur
        setNotes(prev => prev.map(n => n.id === selected.id ? { ...n, title: cur.title, content: cur.content, icon: cur.icon || null } : n))
        window.dispatchEvent(new Event('notes:changed'))
        setAutoStatus('saved')
        setTimeout(() => setAutoStatus('idle'), 1800)
      } catch { setAutoStatus('error') }
      finally { savingRef.current = false }
    }, 800)
    return () => { if (autoTimerRef.current) clearTimeout(autoTimerRef.current) }
  }, [editTitle, editIcon, editContent, selected?.id])

  // autosave on unmount / note switch — flush pending
  useEffect(() => {
    return () => { if (autoTimerRef.current) clearTimeout(autoTimerRef.current) }
  }, [])

  const pendingDeleteNote = pendingDeleteId ? notes.find(x => x.id === pendingDeleteId) ?? null : null

  async function confirmDeleteNote() {
    if (!pendingDeleteId) return
    const id = pendingDeleteId
    setPendingDeleteId(null)
    const toDelete = new Set<string>([id])
    let changed = true
    while (changed) {
      changed = false
      for (const x of notes) if (x.parentId && toDelete.has(x.parentId) && !toDelete.has(x.id)) { toDelete.add(x.id); changed = true }
    }
    const r = await fetch(`/api/admin/notes/${id}`, { method: 'DELETE' })
    if (!r.ok) { setMsg({ t: 'err', m: 'Delete failed' }); return }
    setNotes(prev => prev.filter(x => !toDelete.has(x.id)))
    window.dispatchEvent(new Event('notes:changed'))
    if (selectedId && toDelete.has(selectedId)) {
      const next = notes.find(x => !toDelete.has(x.id))?.id ?? null
      setSelectedId(next)
      if (next) window.history.replaceState(null, '', `/admin/notes?note=${next}`)
      else window.history.replaceState(null, '', '/admin/notes')
    }
  }

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-8"><p className="text-zinc-600 text-sm font-mono animate-pulse">$ loading notes…</p></div>

  return (
    <>
    <div className="flex flex-col min-h-[calc(100vh-24px)] max-w-none mx-0 px-4 sm:px-6 py-4 admin-fade">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0 admin-fade">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2"><FolderTree className="h-5 w-5 text-zinc-500" /> Notes</h1>
          <p className="text-xs text-zinc-500 mt-1 font-mono">$ notes --tree — {notes.length} notes · folders in sidebar →</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => createNote(null, false)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"><FilePlus className="h-3.5 w-3.5" /> New note</button>
          <button onClick={() => createNote(null, true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800"><FolderPlus className="h-3.5 w-3.5" /> New folder</button>
        </div>
      </div>

      {err && <div className="border border-red-900/50 bg-red-950/30 text-red-300 text-sm px-4 py-3 mb-4 font-mono shrink-0">{err}</div>}
      {msg && <div className={`text-xs px-3 py-2 border font-mono mb-4 shrink-0 ${msg.t === 'ok' ? 'border-emerald-900/50 bg-emerald-950/30 text-emerald-300' : 'border-red-900/50 bg-red-950/30 text-red-300'}`}>{msg.m}</div>}

      {/* filtered quick-jump when searching — compact, not the old big tree */}
      {filtered !== null && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Filter notes…" className="w-full bg-zinc-950 border border-zinc-800 pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" autoFocus />
          </div>
          <span className="text-[11px] text-zinc-600 font-mono">{filtered.length} match{filtered.length !== 1 ? 'es' : ''}</span>
          <button onClick={() => setQ('')} className="text-[11px] text-zinc-500 hover:text-zinc-300 border border-zinc-800 px-2 py-1">Clear</button>
        </div>
      )}
      {!filtered && notes.length > 3 && (
        <div className="mb-3 flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Quick search…" className="w-full bg-zinc-950 border border-zinc-800 pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
          </div>
        </div>
      )}
      {filtered !== null && filtered.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {filtered.slice(0, 12).map(n => (
            <button key={n.id} onClick={() => { setSelectedId(n.id); window.history.replaceState(null, '', `/admin/notes?note=${n.id}`); setQ('') }} className={`px-2.5 py-1 text-xs border font-mono ${selectedId === n.id ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-200'}`}>
              <span className="mr-1">{n.icon || '📄'}</span>{n.title || (n.icon === '📁' || n.icon === '🗂️' ? 'New Folder' : 'New Note')}
            </button>
          ))}
        </div>
      )}

      {/* editor — full screen (tree now lives in sidebar) */}
      <div className="border border-zinc-800 bg-zinc-900/50 p-4 admin-fade admin-fade-d1 flex flex-col flex-1 min-h-[520px] lg:min-h-[calc(100vh-120px)] lg:h-[calc(100vh-120px)]">
        {!selected ? (
          <p className="text-zinc-600 text-sm text-center py-12">Select a note from the sidebar → or create one ↑</p>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 gap-3">
            <div className="flex gap-2 shrink-0">
              <IconPicker value={editIcon} onPick={setEditIcon} />
              <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title" className="flex-1 bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm font-medium text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
            </div>
            <div className="border border-zinc-800 bg-zinc-950 flex-1 min-h-[360px] flex flex-col overflow-hidden">
              <div className="flex-1 min-h-0 flex flex-col [&>div]:flex-1 [&>div]:flex [&>div]:flex-col [&>div]:min-h-0">
                <BlogEditor value={editContent} onChange={setEditContent} placeholder="Write anything… (headings, tables, code, images, links — all supported)" />
              </div>
            </div>
            <div className="flex gap-2 shrink-0 items-center">
              <button onClick={saveSelected} disabled={saving} className="px-4 py-2 bg-zinc-100 text-zinc-900 text-sm hover:bg-white disabled:opacity-50">{saving ? 'Saving…' : 'Save note'}</button>
              <button onClick={() => createNote(selected.id)} className="px-3 py-2 border border-zinc-700 bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 inline-flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> Add child</button>
              <span className="text-[11px] font-mono ml-1">
                {autoStatus === 'saving' && <span className="text-zinc-500 animate-pulse">Autosaving…</span>}
                {autoStatus === 'saved' && <span className="text-emerald-400">Autosaved ✓</span>}
                {autoStatus === 'error' && <span className="text-red-400">Autosave failed — Save note</span>}
                {autoStatus === 'idle' && <span className="text-zinc-600">Autosave on</span>}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>

      <ConfirmDialog
        open={!!pendingDeleteId}
        title="Delete note?"
        message={pendingDeleteNote ? `Delete "${pendingDeleteNote.title || (pendingDeleteNote.icon === '📁' || pendingDeleteNote.icon === '🗂️' ? 'New Folder' : 'New Note')}" and all its children? This cannot be undone.` : 'Delete this note?'}
        confirmLabel="Delete"
        onConfirm={confirmDeleteNote}
        onCancel={() => setPendingDeleteId(null)}
      />
    </>
  )
}
