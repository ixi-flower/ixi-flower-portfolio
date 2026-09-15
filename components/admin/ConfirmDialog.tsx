'use client'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, X } from 'lucide-react'

type Props = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'danger', onConfirm, onCancel }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])
  if (!open || !mounted) return null
  const node = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <button aria-label="close" onClick={onCancel} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 shadow-2xl p-5 admin-fade">
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className="flex items-center gap-2 text-sm font-bold text-zinc-100">
            <span className={`h-7 w-7 flex items-center justify-center border shrink-0 ${variant === 'danger' ? 'bg-red-950/40 border-red-900/50 text-red-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
              <AlertTriangle className="h-3.5 w-3.5" />
            </span>
            {title}
          </span>
          <button onClick={onCancel} className="h-7 w-7 flex items-center justify-center border border-transparent text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 hover:border-zinc-800"><X className="h-3.5 w-3.5" /></button>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed font-mono border border-zinc-900 bg-zinc-900/40 px-3 py-2.5 break-words">{message}</p>
        <div className="flex gap-2 mt-4">
          <button onClick={onConfirm} className={`flex-1 py-2.5 text-sm font-mono border transition-colors ${variant === 'danger' ? 'bg-red-500 text-white border-red-500 hover:bg-red-400' : 'bg-zinc-100 text-zinc-900 border-zinc-100 hover:bg-white'}`}>{confirmLabel}</button>
          <button onClick={onCancel} className="px-5 py-2.5 border border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 text-sm font-mono">{cancelLabel}</button>
        </div>
      </div>
    </div>
  )
  return createPortal(node, document.body)
}
