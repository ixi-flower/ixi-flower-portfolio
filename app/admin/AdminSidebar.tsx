'use client'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  LayoutDashboard,
  FileText,
  SlidersHorizontal,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Music,
  Clock,
  Layers,
  GraduationCap,
  ChevronDown,
  StickyNote,
  Bookmark,
  FolderTree,
  File,
  Copy,
  Trash2,
  Pencil,
  FilePlus,
  FolderPlus,
  GripVertical,
  KeyRound,
} from 'lucide-react'
import ConfirmDialog from '@/components/admin/ConfirmDialog'

const CHILDREN = [
  { label: 'Playlist', href: '/admin/site-content?tab=playlist', tab: 'playlist', icon: Music },
  { label: 'WakaTime', href: '/admin/site-content?tab=waka', tab: 'waka', icon: Clock },
  { label: 'Tech Stack', href: '/admin/site-content?tab=tech', tab: 'tech', icon: Layers },
  { label: 'Courses', href: '/admin/site-content?tab=courses', tab: 'courses', icon: GraduationCap },
] as const

const linkBase = 'flex items-center gap-2.5 px-3 py-2 text-xs font-mono border transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]'

type NoteListItem = { id: string; title: string; icon: string | null; parentId: string | null; sortOrder: number }

function notifyNotesChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('notes:changed'))
}

function useNotesList() {
  const [items, setItems] = useState<NoteListItem[]>([])
  const fetchNotes = useCallback(() => {
    fetch('/api/admin/notes', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { notes: [] }))
      .then((j) => {
        const list: NoteListItem[] = (j.notes || []).map((n: { id: string; title: string; icon: string | null; parentId: string | null; sortOrder: number }) => ({
          id: n.id, title: n.title, icon: n.icon, parentId: n.parentId, sortOrder: n.sortOrder ?? 0,
        }))
        setItems(list)
      })
      .catch(() => {})
  }, [])
  useEffect(() => {
    fetchNotes()
    const h = () => fetchNotes()
    window.addEventListener('notes:changed', h)
    window.addEventListener('focus', h)
    const onVis = () => { if (document.visibilityState === 'visible') h() }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('notes:changed', h)
      window.removeEventListener('focus', h)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [fetchNotes])
  return { items, setItems, refresh: fetchNotes }
}

function buildChildrenMap(items: NoteListItem[]) {
  const m = new Map<string | null, NoteListItem[]>()
  for (const n of items) {
    const k = n.parentId ?? null
    const arr = m.get(k) ?? []
    arr.push(n)
    m.set(k, arr)
  }
  for (const arr of m.values()) arr.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  return m
}

function isFolderNote(n: NoteListItem, byParent: Map<string | null, NoteListItem[]>) {
  return (byParent.get(n.id)?.length ?? 0) > 0 || n.icon === '📁' || n.icon === '🗂️'
}

type FlatRow = { note: NoteListItem; depth: number; isFolder: boolean; childCount: number }

function buildFlatVisible(
  items: NoteListItem[],
  byParent: Map<string | null, NoteListItem[]>,
  expanded: Set<string>,
): FlatRow[] {
  const out: FlatRow[] = []
  function walk(parentId: string | null, depth: number) {
    const children = byParent.get(parentId) ?? []
    for (const n of children) {
      const isFolder = isFolderNote(n, byParent)
      const childCount = byParent.get(n.id)?.length ?? 0
      out.push({ note: n, depth, isFolder, childCount })
      if (isFolder && expanded.has(n.id)) walk(n.id, depth + 1)
    }
  }
  walk(null, 0)
  return out
}

let dragGhostEl: HTMLElement | null = null
function createDragGhost(note: NoteListItem, isFolder: boolean, childCount: number): HTMLElement {
  if (dragGhostEl?.parentNode) dragGhostEl.parentNode.removeChild(dragGhostEl)
  const el = document.createElement('div')
  el.style.position = 'fixed'
  el.style.top = '-1000px'
  el.style.left = '-1000px'
  el.style.display = 'flex'
  el.style.alignItems = 'center'
  el.style.gap = '6px'
  el.style.padding = '6px 10px'
  el.style.background = '#27272a'
  el.style.border = '1px solid #3f3f46'
  el.style.borderRadius = '6px'
  el.style.fontSize = '11px'
  el.style.fontFamily = 'monospace'
  el.style.color = '#e4e4e7'
  el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.5)'
  el.style.pointerEvents = 'none'
  el.style.zIndex = '99999'
  el.style.whiteSpace = 'nowrap'
  el.innerHTML = `<span>${note.icon || (isFolder ? '📁' : '📄')}</span><span>${(note.title || (isFolder ? 'New Folder' : 'New Note')).slice(0, 28)}</span>${isFolder && childCount > 0 ? `<span style="margin-left:4px;padding:1px 5px;background:#3f3f46;border-radius:9999px;font-size:10px;color:#a1a1aa">+${childCount}</span>` : ''}`
  document.body.appendChild(el)
  dragGhostEl = el
  return el
}
function cleanupDragGhost() {
  if (dragGhostEl?.parentNode) dragGhostEl.parentNode.removeChild(dragGhostEl)
  dragGhostEl = null
}

type OpenSection = 'notes' | 'site' | null

function useAccordion(initial: OpenSection) {
  const [open, setOpen] = useState<OpenSection>(initial)
  const toggle = useCallback((s: 'notes' | 'site') => {
    setOpen((prev) => (prev === s ? null : s))
  }, [])
  return { open, setOpen, toggle }
}

type Ctx = { x: number; y: number; note: NoteListItem } | null

function ContextMenu({ ctx, onClose, onAction }: { ctx: Ctx; onClose: () => void; onAction: (a: string, note: NoteListItem) => void }) {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  useEffect(() => {
    if (!ctx) return
    const pad = 8
    const w = 200, h = 220
    let x = ctx.x, y = ctx.y
    if (x + w + pad > window.innerWidth) x = window.innerWidth - w - pad
    if (y + h + pad > window.innerHeight) y = window.innerHeight - h - pad
    setPos({ x, y })
  }, [ctx])
  useEffect(() => {
    if (!ctx) return
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [ctx, onClose])
  if (!ctx || !mounted) return null
  const n = ctx.note
  const Item = ({ label, icon: Icon, danger, act }: { label: string; icon: React.ElementType; danger?: boolean; act: string }) => (
    <button
      onClick={(e) => { e.stopPropagation(); onAction(act, n); onClose() }}
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-left transition-colors ${danger ? 'text-red-400 hover:bg-red-950/40 hover:text-red-300' : 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" /> {label}
    </button>
  )
  const node = (
    <>
      <button className="fixed inset-0 z-[9998] cursor-default" aria-label="close" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose() }} />
      <div style={{ left: pos.x, top: pos.y }} className="fixed z-[9999] w-[200px] bg-zinc-900 border border-zinc-700 shadow-2xl py-1">
        <div className="px-3 py-1.5 border-b border-zinc-800 mb-1">
          <div className="text-[11px] font-mono text-zinc-400 truncate flex items-center gap-1.5"><span className="text-xs">{n.icon || '📄'}</span> {n.title || (n.icon === '📁' || n.icon === '🗂️' ? 'New Folder' : 'New Note')}</div>
          <div className="text-[10px] font-mono text-zinc-600 truncate">{n.id.slice(0, 8)}</div>
        </div>
        <Item label="Open" icon={ExternalLink} act="open" />
        <Item label="Rename" icon={Pencil} act="rename" />
        <div className="h-px bg-zinc-800 my-1" />
        <Item label="New note inside" icon={FilePlus} act="newNote" />
        <Item label="New folder inside" icon={FolderPlus} act="newFolder" />
        <div className="h-px bg-zinc-800 my-1" />
        <Item label="Copy ID" icon={Copy} act="copyId" />
        <Item label="Copy link" icon={Copy} act="copyLink" />
        <div className="h-px bg-zinc-800 my-1" />
        <Item label="Delete" icon={Trash2} danger act="delete" />
      </div>
    </>
  )
  return createPortal(node, document.body)
}

function RenameDialog({ open, initial, onConfirm, onCancel }: { open: boolean; initial: string; onConfirm: (v: string) => void; onCancel: () => void }) {
  const [val, setVal] = useState(initial)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  useEffect(() => { if (open) setVal(initial) }, [open, initial])
  if (!open || !mounted) return null
  const node = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <button aria-label="close" onClick={onCancel} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 shadow-2xl p-5">
        <div className="text-sm font-bold text-zinc-100 mb-3 font-mono">Rename note</div>
        <input autoFocus value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') onConfirm(val); if (e.key === 'Escape') onCancel() }} placeholder="Title" className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500" />
        <div className="flex gap-2 mt-4">
          <button onClick={() => onConfirm(val)} className="flex-1 py-2 bg-zinc-100 text-zinc-900 text-sm font-mono border border-zinc-100 hover:bg-white">Rename</button>
          <button onClick={onCancel} className="px-5 py-2 border border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 text-sm font-mono">Cancel</button>
        </div>
      </div>
    </div>
  )
  return createPortal(node, document.body)
}

function isDescendant(ancestorId: string, targetId: string, items: NoteListItem[]): boolean {
  let cur: NoteListItem | undefined = items.find((n) => n.id === targetId)
  while (cur && cur.parentId) {
    if (cur.parentId === ancestorId) return true
    cur = items.find((n) => n.id === cur!.parentId!)
  }
  return false
}

// ── Desktop ──────────────────────────────────────────────────────────────
function SidebarInner({ onLogout }: { onLogout: () => void }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isSiteContent = pathname.startsWith('/admin/site-content')
  const activeTab = searchParams.get('tab') || 'playlist'
  const initial: OpenSection = pathname.startsWith('/admin/notes') ? 'notes' : isSiteContent ? 'site' : null
  const { open, setOpen, toggle } = useAccordion(initial)
  const { items: noteItems, setItems: setNoteItems, refresh } = useNotesList()
  const [ctx, setCtx] = useState<Ctx>(null)
  const [notesRootCtx, setNotesRootCtx] = useState<{ x: number; y: number } | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const dragIdRef = useRef<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [dropPos, setDropPos] = useState<'before' | 'after' | 'inside' | null>(null)
  const [renameTarget, setRenameTarget] = useState<NoteListItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<NoteListItem | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [toastLeaving, setToastLeaving] = useState(false)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toastLeaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showToast = useCallback((m: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    if (toastLeaveRef.current) clearTimeout(toastLeaveRef.current)
    setToastLeaving(false)
    setToast(m)
    toastTimerRef.current = setTimeout(() => {
      setToastLeaving(true)
      toastLeaveRef.current = setTimeout(() => { setToast(null); setToastLeaving(false) }, 280)
    }, 1600)
  }, [])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (isSiteContent) setOpen('site')
  }, [isSiteContent, setOpen])
  useEffect(() => {
    if (pathname.startsWith('/admin/notes')) setOpen('notes')
  }, [pathname, setOpen])

  const siteActive = pathname.startsWith('/admin/site-content')
  const notesActive = pathname.startsWith('/admin/notes')
  const activeNoteId = searchParams.get('note') || searchParams.get('id') || searchParams.get('selected')
  const byParent = buildChildrenMap(noteItems)
  const notesExpanded = open === 'notes'
  const siteExpanded = open === 'site'

  // auto-expand ancestors of active note + keep folders with children visible by default
  useEffect(() => {
    if (!activeNoteId) return
    const chain: string[] = []
    let cur = noteItems.find(n => n.id === activeNoteId)
    while (cur?.parentId) { chain.push(cur.parentId); cur = noteItems.find(n => n.id === cur!.parentId!) }
    if (chain.length) setExpandedIds(prev => { const next = new Set(prev); chain.forEach(id => next.add(id)); return next })
  }, [activeNoteId, noteItems])
  // expand all on first load so user sees full tree (collapsed only after manual toggle)
  const didInitExpand = useRef(false)
  useEffect(() => {
    if (didInitExpand.current || noteItems.length === 0) return
    didInitExpand.current = true
    const folders = noteItems.filter(n => isFolderNote(n, byParent)).map(n => n.id)
    setExpandedIds(new Set(folders))
  }, [noteItems, byParent])

  const onCtx = (e: React.MouseEvent, note: NoteListItem) => {
    e.preventDefault()
    e.stopPropagation()
    setCtx({ x: e.clientX, y: e.clientY, note })
  }
  const onNotesRootCtx = (e: React.MouseEvent) => {
    e.preventDefault()
    setNotesRootCtx({ x: e.clientX, y: e.clientY })
  }
  const handleNotesRootAction = async (act: 'note' | 'folder') => {
    const isFolder = act === 'folder'
    const r = await fetch('/api/admin/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: isFolder ? 'New Folder' : 'New Note', content: '', parentId: null, icon: isFolder ? '📁' : '📄' }) })
    setNotesRootCtx(null)
    if (r.ok) {
      const j = await r.json().catch(() => ({}))
      refresh(); notifyNotesChanged()
      showToast(isFolder ? 'Folder created ✓' : 'Note created ✓')
      if (j.note?.id) window.location.href = `/admin/notes?note=${j.note.id}`
    } else showToast('Create failed')
  }

  function handleDragStart(e: React.DragEvent, note: NoteListItem) {
    dragIdRef.current = note.id
    setDragId(note.id)
    setDragOverId(null)
    setDropPos(null)
    e.dataTransfer.effectAllowed = 'move'
    try { e.dataTransfer.setData('text/plain', note.id) } catch {}
    if (e.dataTransfer.setDragImage) {
      const isFolder = isFolderNote(note, byParent)
      const childCount = byParent.get(note.id)?.length ?? 0
      const ghost = createDragGhost(note, isFolder, childCount)
      try { e.dataTransfer.setDragImage(ghost, 16, 16) } catch {}
    }
  }
  function handleDragEnd() {
    cleanupDragGhost()
    dragIdRef.current = null
    setDragId(null)
    setDragOverId(null)
    setDropPos(null)
  }
  function getDropPosition(e: React.DragEvent, target: NoteListItem): 'before' | 'after' | 'inside' {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const y = e.clientY - rect.top
    const h = rect.height || 28
    const isFolder = isFolderNote(target, byParent)
    if (isFolder) {
      if (y > h * 0.28 && y < h * 0.72) return 'inside'
    }
    return y < h / 2 ? 'before' : 'after'
  }
  function toggleExpand(id: string) {
    setExpandedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }
  function handleDragOver(e: React.DragEvent, target: NoteListItem) {
    const curId = dragIdRef.current ?? dragId
    if (!curId || curId === target.id) return
    const dragged = noteItems.find((n) => n.id === curId)
    if (!dragged) return
    if (isDescendant(dragged.id, target.id, noteItems)) return
    const pos = getDropPosition(e, target)
    e.preventDefault()
    setDragOverId(target.id)
    setDropPos(pos)
  }
  function handleDrop(e: React.DragEvent, target: NoteListItem) {
    e.preventDefault()
    e.stopPropagation()
    const curId = dragIdRef.current ?? dragId
    if (!curId || curId === target.id) { handleDragEnd(); return }
    const dragged = noteItems.find((n) => n.id === curId)
    if (!dragged) { handleDragEnd(); return }
    if (isDescendant(dragged.id, target.id, noteItems)) { handleDragEnd(); return }
    const pos = dropPos ?? getDropPosition(e, target)

    if (pos === 'inside') {
      const newItems = noteItems.map((n) => (n.id === dragged.id ? { ...n, parentId: target.id, sortOrder: (byParent.get(target.id)?.length ?? 0) } : n))
      setNoteItems(newItems)
      setExpandedIds(prev => { const n = new Set(prev); n.add(target.id); return n })
      fetch(`/api/admin/notes/${dragged.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parentId: target.id }) }).then((r) => { refresh(); notifyNotesChanged(); if (!r.ok) return }).catch(() => { refresh(); notifyNotesChanged() })
      handleDragEnd()
      return
    }

    const newParent = target.parentId ?? null
    const siblings = [...noteItems.filter((n) => (n.parentId ?? null) === newParent)].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    const without = siblings.filter((n) => n.id !== dragged.id)
    let idx = without.findIndex((n) => n.id === target.id)
    if (idx === -1) { handleDragEnd(); return }
    if (pos === 'after') idx += 1
    const moved = { ...dragged, parentId: newParent } as NoteListItem
    without.splice(idx, 0, moved)
    const orderedIds = without.map((n) => n.id)
    const rebuilt = new Map<string, number>()
    orderedIds.forEach((id, i) => rebuilt.set(id, i))
    const final = noteItems.map((n) => {
      if (n.id === dragged.id) return { ...n, parentId: newParent, sortOrder: rebuilt.get(n.id) ?? n.sortOrder }
      if ((n.parentId ?? null) === newParent && rebuilt.has(n.id)) return { ...n, sortOrder: rebuilt.get(n.id)! }
      return n
    })
    // if dragged came from different parent, it wasn't in siblings — insert it
    const already = final.some(n => n.id === dragged.id)
    const withMoved = already ? final : [...final.filter(n => n.id !== dragged.id), { ...dragged, parentId: newParent, sortOrder: rebuilt.get(dragged.id) ?? 0 }]
    setNoteItems(withMoved)
    const needPatch = (dragged.parentId ?? null) !== newParent
    ;(async () => {
      if (needPatch) {
        const r1 = await fetch(`/api/admin/notes/${dragged.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parentId: newParent }) })
        if (!r1.ok) { refresh(); notifyNotesChanged(); return }
      }
      if (orderedIds.length > 0) {
        const r2 = await fetch('/api/admin/notes/reorder', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderedIds }) })
        refresh(); notifyNotesChanged()
        if (!r2.ok) return
      } else { refresh(); notifyNotesChanged() }
    })().catch(() => { refresh(); notifyNotesChanged() })
    handleDragEnd()
  }
  function handleRootDrop(e: React.DragEvent) {
    e.preventDefault()
    const curId = dragIdRef.current ?? dragId
    if (!curId) return
    const dragged = noteItems.find((n) => n.id === curId)
    if (!dragged || dragged.parentId == null) return
    if (dragOverId) return
    const newItems = noteItems.map((n) => (n.id === dragged.id ? { ...n, parentId: null, sortOrder: (byParent.get(null)?.length ?? 0) } : n))
    setNoteItems(newItems)
    fetch(`/api/admin/notes/${dragged.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parentId: null }) }).then((r) => { refresh(); notifyNotesChanged() }).catch(() => { refresh(); notifyNotesChanged() })
    handleDragEnd()
  }

  const onCtxAction = useCallback(async (action: string, note: NoteListItem) => {
    if (action === 'open') { window.location.href = `/admin/notes?note=${note.id}`; return }
    if (action === 'copyId') { await navigator.clipboard.writeText(note.id).catch(() => {}); showToast('ID copied ✓'); return }
    if (action === 'copyLink') { await navigator.clipboard.writeText(`${window.location.origin}/admin/notes?note=${note.id}`).catch(() => {}); showToast('Link copied ✓'); return }
    if (action === 'rename') { setRenameTarget(note); return }
    if (action === 'delete') { setDeleteTarget(note); return }
    if (action === 'newNote' || action === 'newFolder') {
      const isFolder = action === 'newFolder'
      const r = await fetch('/api/admin/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: isFolder ? 'New Folder' : 'New Note', content: '', parentId: note.id, icon: isFolder ? '📁' : '📄' }) })
      if (r.ok) { const j = await r.json().catch(() => ({})); refresh(); notifyNotesChanged(); showToast(isFolder ? 'Folder created ✓' : 'Note created ✓'); if (j.note?.id) window.location.href = `/admin/notes?note=${j.note.id}` }
      else showToast('Create failed'); return
    }
  }, [refresh, showToast])

  async function confirmRename(val: string) {
    if (!renameTarget) return
    const t = val.trim()
    if (!t || t === renameTarget.title) { setRenameTarget(null); return }
    const r = await fetch(`/api/admin/notes/${renameTarget.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: t }) })
    if (r.ok) { showToast('Renamed ✓'); refresh(); notifyNotesChanged() } else showToast('Rename failed')
    setRenameTarget(null)
  }
  async function confirmDelete() {
    if (!deleteTarget) return
    const id = deleteTarget.id
    setDeleteTarget(null)
    const r = await fetch(`/api/admin/notes/${id}`, { method: 'DELETE' })
    if (!r.ok) { showToast('Delete failed'); return }
    showToast('Deleted ✓'); refresh(); notifyNotesChanged()
    if (new URLSearchParams(window.location.search).get('note') === id) window.location.href = '/admin/notes'
  }

  return (
    <>
      <ContextMenu ctx={ctx} onClose={() => setCtx(null)} onAction={onCtxAction} />
      {notesRootCtx && (
        <>
          <button className="fixed inset-0 z-[9998] cursor-default" aria-label="close" onClick={() => setNotesRootCtx(null)} onContextMenu={e => { e.preventDefault(); setNotesRootCtx(null) }} />
          {typeof document !== 'undefined' ? createPortal(
            <div style={{ left: Math.min(notesRootCtx.x, window.innerWidth - 208), top: Math.min(notesRootCtx.y, window.innerHeight - 100) }} className="fixed z-[9999] w-[200px] bg-zinc-900 border border-zinc-700 shadow-2xl py-1">
              <div className="px-3 py-1.5 border-b border-zinc-800 mb-1"><div className="text-[11px] font-mono text-zinc-400">Notes</div><div className="text-[10px] font-mono text-zinc-600">root — add new</div></div>
              <button onClick={() => handleNotesRootAction('note')} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-left text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"><FilePlus className="h-3.5 w-3.5 shrink-0" /> Add note</button>
              <button onClick={() => handleNotesRootAction('folder')} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-left text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"><FolderPlus className="h-3.5 w-3.5 shrink-0" /> Add folder</button>
            </div>, document.body) : null}
        </>
      )}
      <RenameDialog open={!!renameTarget} initial={renameTarget?.title || ''} onConfirm={confirmRename} onCancel={() => setRenameTarget(null)} />
      <ConfirmDialog open={!!deleteTarget} title="Delete note?" message={deleteTarget ? `Delete "${deleteTarget.title || (deleteTarget.icon === '📁' || deleteTarget.icon === '🗂️' ? 'New Folder' : 'New Note')}" and all its children? This cannot be undone.` : ''} confirmLabel="Delete" onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
      {toast && typeof document !== 'undefined' ? createPortal(<div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] bg-zinc-900 border border-zinc-700 text-zinc-100 text-xs font-mono px-3 py-2 shadow-xl ${toastLeaving ? 'toast-exit' : 'toast-enter'}`}>{toast}</div>, document.body) : null}
      <Link href="/admin" className={`${linkBase} ${pathname === '/admin' ? 'bg-zinc-100 text-zinc-900 border-zinc-100 shadow-sm' : 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-100 hover:bg-zinc-900 hover:border-zinc-800'}`}>
        <LayoutDashboard className="h-3.5 w-3.5 shrink-0" /> Profile
      </Link>

      <div>
        <button onClick={() => toggle('site')} className={`${linkBase} w-full ${siteExpanded ? 'bg-zinc-100 text-zinc-900 border-zinc-100 shadow-sm' : siteActive ? 'bg-transparent text-zinc-400 border-zinc-800 hover:bg-zinc-900 hover:text-zinc-100' : 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-100 hover:bg-zinc-900 hover:border-zinc-800'}`}>
          <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left">Site content</span>
          <span className={`shrink-0 transition-transform duration-300 ${siteExpanded ? 'rotate-0' : '-rotate-90'}`}><ChevronDown className="h-3 w-3" /></span>
        </button>
        <div className={`grid transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${siteExpanded ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div onDragOver={(e) => { if (dragId) e.preventDefault() }} onDrop={(e) => handleRootDrop(e)} className="ml-3 border-l border-zinc-800 pl-2 space-y-0.5 py-1 min-h-[24px]">
              {CHILDREN.map((c) => {
                const isActive = siteActive && activeTab === c.tab
                const Icon = c.icon
                return (
                  <Link key={c.tab} href={c.href} className={`flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-mono border transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isActive ? 'bg-zinc-800 text-zinc-100 border-zinc-700 translate-x-0.5' : 'bg-transparent text-zinc-500 border-transparent hover:text-zinc-200 hover:bg-zinc-900 translate-x-0'}`}>
                    <Icon className="h-3 w-3 shrink-0" /> {c.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <Link href="/admin/blog" className={`${linkBase} ${pathname.startsWith('/admin/blog') ? 'bg-zinc-100 text-zinc-900 border-zinc-100 shadow-sm' : 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-100 hover:bg-zinc-900 hover:border-zinc-800'}`}>
        <FileText className="h-3.5 w-3.5 shrink-0" /> Blog
      </Link>

      <div>
        <div className="flex gap-1" onContextMenu={onNotesRootCtx}>
          <Link href="/admin/notes" className={`flex-1 ${linkBase} ${notesActive && !activeNoteId ? 'bg-zinc-100 text-zinc-900 border-zinc-100 shadow-sm' : notesActive ? 'bg-zinc-900 text-zinc-100 border-zinc-800' : 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-100 hover:bg-zinc-900 hover:border-zinc-800'}`}>
            <StickyNote className="h-3.5 w-3.5 shrink-0" /> Notes
          </Link>
          <button onClick={() => toggle('notes')} aria-label={notesExpanded ? 'Collapse notes' : 'Expand notes'} className={`h-auto w-8 flex items-center justify-center border shrink-0 transition-all duration-300 ${notesExpanded ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : notesActive ? 'bg-transparent text-zinc-500 border-zinc-800 hover:bg-zinc-900 hover:text-zinc-200' : 'bg-transparent text-zinc-500 border-transparent hover:text-zinc-200 hover:bg-zinc-900 hover:border-zinc-800'}`}>
            <span className={`transition-transform duration-300 ${notesExpanded ? 'rotate-0' : '-rotate-90'}`}><ChevronDown className="h-3 w-3" /></span>
          </button>
        </div>
        <div className={`grid transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${notesExpanded ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div onDragOver={(e) => { if (dragId) e.preventDefault() }} onDrop={(e) => handleRootDrop(e)} onContextMenu={onNotesRootCtx} className="ml-3 border-l border-zinc-800 pl-2 space-y-0.5 py-1 min-h-[24px]">
              {(() => {
                const flat = buildFlatVisible(noteItems, byParent, expandedIds)
                if (flat.length === 0) return <span onContextMenu={onNotesRootCtx} className="block px-2.5 py-1.5 text-[11px] font-mono text-zinc-600 cursor-context-menu">no notes yet — right-click to add</span>
                return flat.map(({ note: n, depth, isFolder, childCount }) => {
                  const isActive = activeNoteId === n.id
                  const isDragged = dragId === n.id
                  const isDragOver = dragOverId === n.id
                  const pos = isDragOver ? dropPos : null
                  const showInside = pos === 'inside'
                  const isExpanded = expandedIds.has(n.id)
                  return (
                    <div
                      key={n.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, n)}
                      onDragOver={(e) => handleDragOver(e, n)}
                      onDragLeave={() => { if (dragOverId === n.id) { setDragOverId(null); setDropPos(null) } }}
                      onDrop={(e) => handleDrop(e, n)}
                      onDragEnd={handleDragEnd}
                      className={`relative transition-opacity duration-150 ${isDragged ? 'opacity-30' : 'opacity-100'}`}
                      style={{ marginLeft: depth * 12 }}
                    >
                      {isDragOver && pos === 'before' && (
                        <div className="absolute -top-[2px] left-0 right-0 h-[2px] bg-sky-500 rounded-full pointer-events-none z-10 shadow-[0_0_6px_rgba(14,165,233,0.6)]" />
                      )}
                      <div className={`flex items-center gap-0.5 px-1 py-0.5 rounded transition-colors duration-150 ${isActive ? 'bg-zinc-800 border border-zinc-700' : showInside ? 'bg-sky-950/40 border border-sky-800/50' : 'border border-transparent'}`}>
                        {isFolder ? (
                          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleExpand(n.id) }} className="shrink-0 h-5 w-5 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded" title={isExpanded ? 'Collapse' : 'Expand'}>
                            <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
                          </button>
                        ) : <span className="shrink-0 w-5" />}
                        <span className="shrink-0 h-6 w-4 flex items-center justify-center text-zinc-600 cursor-grab active:cursor-grabbing hover:text-zinc-400" title="Drag to reorder"><GripVertical className="h-3 w-3" /></span>
                        <Link
                          href={`/admin/notes?note=${n.id}`}
                          onContextMenu={(e) => onCtx(e, n)}
                          className={`flex-1 flex items-center gap-1.5 px-2 py-1 text-[11px] font-mono border transition-colors duration-150 min-w-0 ${isActive ? 'bg-zinc-800 text-zinc-100 border-zinc-700' : showInside ? 'bg-zinc-800 text-zinc-100 border-zinc-700' : 'bg-transparent text-zinc-500 border-transparent hover:text-zinc-200 hover:bg-zinc-900'}`}
                        >
                          {isFolder ? <FolderTree className={`h-3 w-3 shrink-0 ${showInside ? 'text-amber-400' : 'text-amber-500/70'}`} /> : <File className="h-3 w-3 shrink-0" />}
                          <span className="shrink-0 leading-none text-[11px]">{n.icon || (isFolder ? '📁' : '📄')}</span>
                          <span className={`truncate flex-1 ${isFolder ? 'font-semibold' : ''}`}>{n.title || (isFolder ? 'New Folder' : 'New Note')}</span>
                          {isFolder && childCount > 0 && <span className="shrink-0 text-[10px] px-1 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-500 font-mono rounded">{childCount}</span>}
                        </Link>
                      </div>
                      {isDragOver && pos === 'after' && (
                        <div className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-sky-500 rounded-full pointer-events-none z-10 shadow-[0_0_6px_rgba(14,165,233,0.6)]" />
                      )}
                      {isDragOver && showInside && (
                        <div className="absolute inset-0 rounded border border-sky-500/30 pointer-events-none" />
                      )}
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        </div>
      </div>

      <Link href="/admin/bookmarks" className={`${linkBase} ${pathname.startsWith('/admin/bookmarks') ? 'bg-zinc-100 text-zinc-900 border-zinc-100 shadow-sm' : 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-100 hover:bg-zinc-900 hover:border-zinc-800'}`}>
        <Bookmark className="h-3.5 w-3.5 shrink-0" /> Bookmarks
      </Link>

      <Link href="/admin/vault" className={`${linkBase} ${pathname.startsWith('/admin/vault') ? 'bg-zinc-100 text-zinc-900 border-zinc-100 shadow-sm' : 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-100 hover:bg-zinc-900 hover:border-zinc-800'}`}>
        <KeyRound className="h-3.5 w-3.5 shrink-0" /> Vault
      </Link>
    </>
  )
}

// ── Mobile ───────────────────────────────────────────────────────────────
function MobileSidebarInner({ onNavigate, onLogout }: { onNavigate: () => void; onLogout: () => void }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isSiteContent = pathname.startsWith('/admin/site-content')
  const activeTab = searchParams.get('tab') || 'playlist'
  const initial: OpenSection = pathname.startsWith('/admin/notes') ? 'notes' : isSiteContent ? 'site' : null
  const { open, toggle, setOpen } = useAccordion(initial)
  const { items: noteItems, setItems: setNoteItems, refresh } = useNotesList()
  const [ctx, setCtx] = useState<Ctx>(null)
  const [notesRootCtxM, setNotesRootCtxM] = useState<{ x: number; y: number } | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const dragIdRefM = useRef<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [renameTargetM, setRenameTargetM] = useState<NoteListItem | null>(null)
  const [deleteTargetM, setDeleteTargetM] = useState<NoteListItem | null>(null)
  const [toastM, setToastM] = useState<string | null>(null)
  const [toastLeavingM, setToastLeavingM] = useState(false)
  const toastTimerRefM = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toastLeaveRefM = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showToastM = useCallback((m: string) => {
    if (toastTimerRefM.current) clearTimeout(toastTimerRefM.current)
    if (toastLeaveRefM.current) clearTimeout(toastLeaveRefM.current)
    setToastLeavingM(false); setToastM(m)
    toastTimerRefM.current = setTimeout(() => { setToastLeavingM(true); toastLeaveRefM.current = setTimeout(() => { setToastM(null); setToastLeavingM(false) }, 280) }, 1600)
  }, [])
  const [expandedIdsM, setExpandedIdsM] = useState<Set<string>>(new Set())

  useEffect(() => { if (isSiteContent) setOpen('site') }, [isSiteContent, setOpen])
  useEffect(() => { if (pathname.startsWith('/admin/notes')) setOpen('notes') }, [pathname, setOpen])

  const siteActive = pathname.startsWith('/admin/site-content')
  const notesActive = pathname.startsWith('/admin/notes')
  const activeNoteId = searchParams.get('note') || searchParams.get('id') || searchParams.get('selected')
  const byParent = buildChildrenMap(noteItems)
  const notesExpanded = open === 'notes'
  const siteExpanded = open === 'site'

  useEffect(() => {
    if (!activeNoteId) return
    const chain: string[] = []
    let cur = noteItems.find(n => n.id === activeNoteId)
    while (cur?.parentId) { chain.push(cur.parentId); cur = noteItems.find(n => n.id === cur!.parentId!) }
    if (chain.length) setExpandedIdsM(prev => { const next = new Set(prev); chain.forEach(id => next.add(id)); return next })
  }, [activeNoteId, noteItems])
  const didInitExpandM = useRef(false)
  useEffect(() => {
    if (didInitExpandM.current || noteItems.length === 0) return
    didInitExpandM.current = true
    const folders = noteItems.filter(n => isFolderNote(n, byParent)).map(n => n.id)
    setExpandedIdsM(new Set(folders))
  }, [noteItems, byParent])
  function toggleExpandM(id: string) {
    setExpandedIdsM(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }

  const onCtx = (e: React.MouseEvent, note: NoteListItem) => {
    e.preventDefault()
    e.stopPropagation()
    setCtx({ x: e.clientX, y: e.clientY, note })
  }
  const onNotesRootCtxM = (e: React.MouseEvent) => {
    e.preventDefault()
    setNotesRootCtxM({ x: e.clientX, y: e.clientY })
  }
  const handleNotesRootActionM = async (act: 'note' | 'folder') => {
    const isFolder = act === 'folder'
    const r = await fetch('/api/admin/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: isFolder ? 'New Folder' : 'New Note', content: '', parentId: null, icon: isFolder ? '📁' : '📄' }) })
    setNotesRootCtxM(null)
    if (r.ok) {
      const j = await r.json().catch(() => ({}))
      refresh(); notifyNotesChanged()
      showToastM(isFolder ? 'Folder created ✓' : 'Note created ✓')
      if (j.note?.id) window.location.href = `/admin/notes?note=${j.note.id}`
    } else showToastM('Create failed')
  }

  const onCtxActionM = useCallback(async (action: string, note: NoteListItem) => {
    if (action === 'open') { window.location.href = `/admin/notes?note=${note.id}`; return }
    if (action === 'copyId') { await navigator.clipboard.writeText(note.id).catch(() => {}); showToastM('ID copied ✓'); return }
    if (action === 'copyLink') { await navigator.clipboard.writeText(`${window.location.origin}/admin/notes?note=${note.id}`).catch(() => {}); showToastM('Link copied ✓'); return }
    if (action === 'rename') { setRenameTargetM(note); return }
    if (action === 'delete') { setDeleteTargetM(note); return }
    if (action === 'newNote' || action === 'newFolder') {
      const isFolder = action === 'newFolder'
      const r = await fetch('/api/admin/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: isFolder ? 'New Folder' : 'New Note', content: '', parentId: note.id, icon: isFolder ? '📁' : '📄' }) })
      if (r.ok) { const j = await r.json().catch(() => ({})); refresh(); notifyNotesChanged(); showToastM(isFolder ? 'Folder created ✓' : 'Note created ✓'); if (j.note?.id) window.location.href = `/admin/notes?note=${j.note.id}` }
      else showToastM('Create failed'); return
    }
  }, [refresh, showToastM])
  async function confirmRenameM(val: string) {
    if (!renameTargetM) return
    const t = val.trim()
    if (!t || t === renameTargetM.title) { setRenameTargetM(null); return }
    const r = await fetch(`/api/admin/notes/${renameTargetM.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: t }) })
    if (r.ok) { showToastM('Renamed ✓'); refresh(); notifyNotesChanged() } else showToastM('Rename failed')
    setRenameTargetM(null)
  }
  async function confirmDeleteM() {
    if (!deleteTargetM) return
    const id = deleteTargetM.id
    setDeleteTargetM(null)
    const r = await fetch(`/api/admin/notes/${id}`, { method: 'DELETE' })
    if (!r.ok) { showToastM('Delete failed'); return }
    showToastM('Deleted ✓'); refresh(); notifyNotesChanged()
    if (new URLSearchParams(window.location.search).get('note') === id) window.location.href = '/admin/notes'
  }

  const [dropPosM, setDropPosM] = useState<'before' | 'after' | 'inside' | null>(null)
  function getDropPositionM(e: React.DragEvent, target: NoteListItem): 'before' | 'after' | 'inside' {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const y = e.clientY - rect.top
    const h = rect.height || 28
    const isFolder = isFolderNote(target, byParent)
    if (isFolder && y > h * 0.28 && y < h * 0.72) return 'inside'
    return y < h / 2 ? 'before' : 'after'
  }
  function handleDragStartM(e: React.DragEvent, note: NoteListItem) {
    dragIdRefM.current = note.id
    setDragId(note.id)
    setDragOverId(null)
    setDropPosM(null)
    e.dataTransfer.effectAllowed = 'move'
    try { e.dataTransfer.setData('text/plain', note.id) } catch {}
    if (e.dataTransfer.setDragImage) {
      const isFolder = isFolderNote(note, byParent)
      const childCount = byParent.get(note.id)?.length ?? 0
      const ghost = createDragGhost(note, isFolder, childCount)
      try { e.dataTransfer.setDragImage(ghost, 16, 16) } catch {}
    }
  }
  function handleDragEndM() { cleanupDragGhost(); dragIdRefM.current = null; setDragId(null); setDragOverId(null); setDropPosM(null) }
  function handleDragOverM(e: React.DragEvent, target: NoteListItem) {
    const curId = dragIdRefM.current ?? dragId
    if (!curId || curId === target.id) return
    const dragged = noteItems.find((n) => n.id === curId)
    if (!dragged) return
    if (isDescendant(dragged.id, target.id, noteItems)) return
    const pos = getDropPositionM(e, target)
    e.preventDefault()
    setDragOverId(target.id)
    setDropPosM(pos)
  }
  function handleDropM(e: React.DragEvent, target: NoteListItem) {
    e.preventDefault()
    e.stopPropagation()
    const curId = dragIdRefM.current ?? dragId
    if (!curId || curId === target.id) { handleDragEndM(); return }
    const dragged = noteItems.find((n) => n.id === curId)
    if (!dragged) { handleDragEndM(); return }
    if (isDescendant(dragged.id, target.id, noteItems)) { handleDragEndM(); return }
    const pos = dropPosM ?? getDropPositionM(e, target)
    if (pos === 'inside') {
      const newItems = noteItems.map((n) => (n.id === dragged.id ? { ...n, parentId: target.id, sortOrder: (byParent.get(target.id)?.length ?? 0) } : n))
      setNoteItems(newItems)
      setExpandedIdsM(prev => { const nn = new Set(prev); nn.add(target.id); return nn })
      fetch(`/api/admin/notes/${dragged.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parentId: target.id }) }).then(() => { refresh(); notifyNotesChanged() }).catch(() => { refresh(); notifyNotesChanged() })
      handleDragEndM(); return
    }
    const newParent = target.parentId ?? null
    const siblings = [...noteItems.filter((n) => (n.parentId ?? null) === newParent)].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    const without = siblings.filter((n) => n.id !== dragged.id)
    let idx = without.findIndex((n) => n.id === target.id)
    if (idx === -1) { handleDragEndM(); return }
    if (pos === 'after') idx += 1
    const moved = { ...dragged, parentId: newParent } as NoteListItem
    without.splice(idx, 0, moved)
    const orderedIds = without.map((n) => n.id)
    const rebuilt = new Map<string, number>()
    orderedIds.forEach((id, i) => rebuilt.set(id, i))
    const final = noteItems.map((n) => {
      if (n.id === dragged.id) return { ...n, parentId: newParent, sortOrder: rebuilt.get(n.id) ?? n.sortOrder }
      if ((n.parentId ?? null) === newParent && rebuilt.has(n.id)) return { ...n, sortOrder: rebuilt.get(n.id)! }
      return n
    })
    const already = final.some(n => n.id === dragged.id)
    const withMoved = already ? final : [...final.filter(n => n.id !== dragged.id), { ...dragged, parentId: newParent, sortOrder: rebuilt.get(dragged.id) ?? 0 }]
    setNoteItems(withMoved)
    const needPatch = (dragged.parentId ?? null) !== newParent
    ;(async () => {
      if (needPatch) {
        const r1 = await fetch(`/api/admin/notes/${dragged.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parentId: newParent }) })
        if (!r1.ok) { refresh(); notifyNotesChanged(); return }
      }
      if (orderedIds.length > 0) {
        const r2 = await fetch('/api/admin/notes/reorder', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderedIds }) })
        refresh(); notifyNotesChanged()
        if (!r2.ok) return
      } else { refresh(); notifyNotesChanged() }
    })().catch(() => { refresh(); notifyNotesChanged() })
    handleDragEndM()
  }
  function handleRootDropM(e: React.DragEvent) {
    e.preventDefault()
    const curId = dragIdRefM.current ?? dragId
    if (!curId) return
    const dragged = noteItems.find((n) => n.id === curId)
    if (!dragged || dragged.parentId == null) return
    if (dragOverId) return
    const newItems = noteItems.map((n) => (n.id === dragged.id ? { ...n, parentId: null, sortOrder: (byParent.get(null)?.length ?? 0) } : n))
    setNoteItems(newItems)
    fetch(`/api/admin/notes/${dragged.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parentId: null }) }).then(() => { refresh(); notifyNotesChanged() }).catch(() => { refresh(); notifyNotesChanged() })
    handleDragEndM()
  }

  return (
    <div className="space-y-1">
      <ContextMenu ctx={ctx} onClose={() => setCtx(null)} onAction={onCtxActionM} />
      {notesRootCtxM && (
        <>
          <button className="fixed inset-0 z-[9998] cursor-default" aria-label="close" onClick={() => setNotesRootCtxM(null)} onContextMenu={e => { e.preventDefault(); setNotesRootCtxM(null) }} />
          {typeof document !== 'undefined' ? createPortal(
            <div style={{ left: Math.min(notesRootCtxM.x, window.innerWidth - 208), top: Math.min(notesRootCtxM.y, window.innerHeight - 100) }} className="fixed z-[9999] w-[200px] bg-zinc-900 border border-zinc-700 shadow-2xl py-1">
              <div className="px-3 py-1.5 border-b border-zinc-800 mb-1"><div className="text-[11px] font-mono text-zinc-400">Notes</div><div className="text-[10px] font-mono text-zinc-600">root — add new</div></div>
              <button onClick={() => handleNotesRootActionM('note')} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-left text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"><FilePlus className="h-3.5 w-3.5 shrink-0" /> Add note</button>
              <button onClick={() => handleNotesRootActionM('folder')} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-left text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"><FolderPlus className="h-3.5 w-3.5 shrink-0" /> Add folder</button>
            </div>, document.body) : null}
        </>
      )}
      <RenameDialog open={!!renameTargetM} initial={renameTargetM?.title || ''} onConfirm={confirmRenameM} onCancel={() => setRenameTargetM(null)} />
      <ConfirmDialog open={!!deleteTargetM} title="Delete note?" message={deleteTargetM ? `Delete "${deleteTargetM.title || (deleteTargetM.icon === '📁' || deleteTargetM.icon === '🗂️' ? 'New Folder' : 'New Note')}" and all its children? This cannot be undone.` : ''} confirmLabel="Delete" onConfirm={confirmDeleteM} onCancel={() => setDeleteTargetM(null)} />
      {toastM && typeof document !== 'undefined' ? createPortal(<div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] bg-zinc-900 border border-zinc-700 text-zinc-100 text-xs font-mono px-3 py-2 shadow-xl ${toastLeavingM ? 'toast-exit' : 'toast-enter'}`}>{toastM}</div>, document.body) : null}
      <Link href="/admin" onClick={onNavigate} className={`${linkBase} ${pathname === '/admin' ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-100 hover:bg-zinc-900 hover:border-zinc-800'}`}>
        <LayoutDashboard className="h-3.5 w-3.5 shrink-0" /> Profile
      </Link>
      <div>
        <button onClick={() => toggle('site')} className={`${linkBase} w-full ${siteExpanded ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : siteActive ? 'bg-transparent text-zinc-400 border-zinc-800 hover:bg-zinc-900' : 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-100 hover:bg-zinc-900 hover:border-zinc-800'}`}>
          <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left">Site content</span>
          <span className={`shrink-0 transition-transform duration-300 ${siteExpanded ? 'rotate-0' : '-rotate-90'}`}><ChevronDown className="h-3 w-3" /></span>
        </button>
        <div className={`grid transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${siteExpanded ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div onDragOver={(e) => { if (dragId) e.preventDefault() }} onDrop={(e) => handleRootDropM(e)} className="ml-3 border-l border-zinc-800 pl-2 space-y-0.5 py-1 min-h-[24px]">
              {CHILDREN.map((c) => {
                const isActive = siteActive && activeTab === c.tab
                const Icon = c.icon
                return (
                  <Link key={c.tab} href={c.href} onClick={onNavigate} className={`flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-mono border transition-all duration-300 ${isActive ? 'bg-zinc-800 text-zinc-100 border-zinc-700' : 'bg-transparent text-zinc-500 border-transparent hover:text-zinc-200 hover:bg-zinc-900'}`}>
                    <Icon className="h-3 w-3 shrink-0" /> {c.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      <Link href="/admin/blog" onClick={onNavigate} className={`${linkBase} ${pathname.startsWith('/admin/blog') ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-100 hover:bg-zinc-900 hover:border-zinc-800'}`}>
        <FileText className="h-3.5 w-3.5 shrink-0" /> Blog
      </Link>

      <div>
        <div className="flex gap-1" onContextMenu={onNotesRootCtxM}>
          <Link href="/admin/notes" onClick={onNavigate} className={`flex-1 ${linkBase} ${notesActive && !activeNoteId ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : notesActive ? 'bg-zinc-900 text-zinc-100 border-zinc-800' : 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-100 hover:bg-zinc-900 hover:border-zinc-800'}`}>
            <StickyNote className="h-3.5 w-3.5 shrink-0" /> Notes
          </Link>
          <button onClick={() => toggle('notes')} className={`w-8 flex items-center justify-center border shrink-0 ${notesExpanded ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : notesActive ? 'bg-transparent text-zinc-500 border-zinc-800 hover:bg-zinc-900' : 'bg-transparent text-zinc-500 border-transparent hover:bg-zinc-900 hover:border-zinc-800'}`}>
            <span className={`transition-transform duration-300 ${notesExpanded ? 'rotate-0' : '-rotate-90'}`}><ChevronDown className="h-3 w-3" /></span>
          </button>
        </div>
        <div className={`grid transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${notesExpanded ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div onDragOver={(e) => { if (dragId) e.preventDefault() }} onDrop={(e) => handleRootDropM(e)} onContextMenu={onNotesRootCtxM} className="ml-3 border-l border-zinc-800 pl-2 space-y-0.5 py-1 min-h-[24px]">
              {(() => {
                const flat = buildFlatVisible(noteItems, byParent, expandedIdsM)
                if (flat.length === 0) return <span onContextMenu={onNotesRootCtxM} className="block px-2.5 py-1.5 text-[11px] font-mono text-zinc-600 cursor-context-menu">no notes yet — right-click to add</span>
                return flat.map(({ note: n, depth, isFolder, childCount }) => {
                  const isActive = activeNoteId === n.id
                  const isDragged = dragId === n.id
                  const isDragOver = dragOverId === n.id
                  const pos = isDragOver ? dropPosM : null
                  const showInside = pos === 'inside'
                  const isExpanded = expandedIdsM.has(n.id)
                  return (
                    <div key={n.id} draggable onDragStart={(e) => handleDragStartM(e, n)} onDragOver={(e) => handleDragOverM(e, n)} onDragLeave={() => { if (dragOverId === n.id) { setDragOverId(null); setDropPosM(null) } }} onDrop={(e) => handleDropM(e, n)} onDragEnd={handleDragEndM} className={`relative transition-opacity duration-150 ${isDragged ? 'opacity-30' : 'opacity-100'}`} style={{ marginLeft: depth * 12 }}>
                      {isDragOver && pos === 'before' && <div className="absolute -top-[2px] left-0 right-0 h-[2px] bg-sky-500 rounded-full pointer-events-none z-10 shadow-[0_0_6px_rgba(14,165,233,0.6)]" />}
                      <div className={`flex items-center gap-0.5 px-1 py-0.5 rounded transition-colors duration-150 ${isActive ? 'bg-zinc-800 border border-zinc-700' : showInside ? 'bg-sky-950/40 border border-sky-800/50' : 'border border-transparent'}`}>
                        {isFolder ? (
                          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleExpandM(n.id) }} className="shrink-0 h-5 w-5 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded"><ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`} /></button>
                        ) : <span className="shrink-0 w-5" />}
                        <span className="shrink-0 h-6 w-4 flex items-center justify-center text-zinc-600 cursor-grab active:cursor-grabbing"><GripVertical className="h-3 w-3" /></span>
                        <Link href={`/admin/notes?note=${n.id}`} onClick={onNavigate} onContextMenu={(e) => onCtx(e, n)} className={`flex-1 flex items-center gap-1.5 px-2 py-1 text-[11px] font-mono border transition-colors duration-150 min-w-0 ${isActive ? 'bg-zinc-800 text-zinc-100 border-zinc-700' : showInside ? 'bg-zinc-800 text-zinc-100 border-zinc-700' : 'bg-transparent text-zinc-500 border-transparent hover:text-zinc-200 hover:bg-zinc-900'}`}>
                          {isFolder ? <FolderTree className={`h-3 w-3 shrink-0 ${showInside ? 'text-amber-400' : 'text-amber-500/70'}`} /> : <File className="h-3 w-3 shrink-0" />}
                          <span className="shrink-0 leading-none text-[11px]">{n.icon || (isFolder ? '📁' : '📄')}</span>
                          <span className="truncate flex-1">{n.title || (isFolder ? 'New Folder' : 'New Note')}</span>
                          {isFolder && childCount > 0 && <span className="shrink-0 text-[10px] px-1 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-500 font-mono rounded">{childCount}</span>}
                        </Link>
                      </div>
                      {isDragOver && pos === 'after' && <div className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-sky-500 rounded-full pointer-events-none z-10 shadow-[0_0_6px_rgba(14,165,233,0.6)]" />}
                      {showInside && <div className="absolute inset-0 rounded border border-sky-500/30 pointer-events-none" />}
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        </div>
      </div>

      <Link href="/admin/bookmarks" onClick={onNavigate} className={`${linkBase} ${pathname.startsWith('/admin/bookmarks') ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-100 hover:bg-zinc-900 hover:border-zinc-800'}`}>
        <Bookmark className="h-3.5 w-3.5 shrink-0" /> Bookmarks
      </Link>
      <Link href="/admin/vault" onClick={onNavigate} className={`${linkBase} ${pathname.startsWith('/admin/vault') ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-100 hover:bg-zinc-900 hover:border-zinc-800'}`}>
        <KeyRound className="h-3.5 w-3.5 shrink-0" /> Vault
      </Link>
      <Link href="/" onClick={onNavigate} className="flex items-center gap-2.5 px-3 py-2 text-xs font-mono text-zinc-500 hover:text-zinc-200 transition-colors duration-200">
        <ExternalLink className="h-3.5 w-3.5" /> Back to site
      </Link>
      <button onClick={onLogout} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-mono text-zinc-500 hover:text-red-400 hover:border-red-500/40 hover:bg-red-900/40 hover:shadow-[0_0_12px_rgba(239,68,68,0.25)] border border-transparent transition-all duration-300">
        <LogOut className="h-3.5 w-3.5" /> Logout
      </button>
    </div>
  )
}

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function logout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.replace('/admin/login')
    router.refresh()
  }

  const isLogin = pathname === '/admin/login'
  if (isLogin) return null

  return (
    <>
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between gap-2 px-3 py-2 bg-zinc-950 border-b border-zinc-800">
        <span className="text-xs font-bold text-zinc-100 font-mono">ixi-admin</span>
        <button onClick={() => setOpen((v) => !v)} className="h-8 w-8 flex items-center justify-center border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors duration-200">
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>
      <div className={`md:hidden grid transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="border-b border-zinc-800 bg-zinc-950 p-3 space-y-1">
            <Suspense fallback={<div className="text-[11px] text-zinc-600 font-mono">loading…</div>}>
              <MobileSidebarInner onNavigate={() => setOpen(false)} onLogout={logout} />
            </Suspense>
          </div>
        </div>
      </div>

      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-56 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 p-3">
        <div className="px-2 py-3 border-b border-zinc-800 mb-3">
          <div className="text-xs font-bold text-zinc-100 font-mono tracking-tight">ixi-admin</div>
          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">$ admin --owner-only</div>
        </div>
        <nav className="flex-1 space-y-1 overflow-auto custom-scrollbar">
          <Suspense fallback={<div className="text-[11px] text-zinc-600 font-mono px-3 py-2">loading…</div>}>
            <SidebarInner onLogout={logout} />
          </Suspense>
        </nav>
        <div className="space-y-1 pt-3 border-t border-zinc-800">
          <Link href="/" className="flex items-center gap-2.5 px-3 py-2 text-xs font-mono text-zinc-500 hover:text-zinc-200 border border-transparent hover:border-zinc-800 hover:bg-zinc-900 transition-all duration-300">
            <ExternalLink className="h-3.5 w-3.5" /> Back to site
          </Link>
          <button onClick={logout} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-mono text-zinc-500 hover:text-red-400 hover:border-red-500/40 hover:bg-red-900/40 hover:shadow-[0_0_12px_rgba(239,68,68,0.25)] border border-transparent transition-all duration-300">
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </div>
      </aside>
    </>
  )
}
