'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AdminIndex() {
  const router = useRouter()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const [email, setEmail] = useState('')
  useEffect(() => {
    fetch('/api/admin/auth/me', { cache: 'no-store' })
      .then(r => r.json())
      .then(j => { if (j.email) setEmail(j.email) })
      .catch(() => {})
  }, [])

  async function handleChange(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    if (!current || !next) { setMsg({ t: 'err', m: 'Both fields required' }); return }
    if (next.length < 6) { setMsg({ t: 'err', m: 'New password too short (min 6)' }); return }
    setSaving(true)
    try {
      const r = await fetch('/api/admin/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current, next }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setMsg({ t: 'err', m: j.error || 'Failed' }); return }
      setMsg({ t: 'ok', m: 'Password updated ✓' })
      setCurrent(''); setNext('')
    } catch {
      setMsg({ t: 'err', m: 'Network error' })
    } finally { setSaving(false) }
  }

  async function logout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.replace('/admin/login')
    router.refresh()
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Admin</h1>
          <p className="text-sm text-zinc-500 mt-1">ixi_flower — owner only{email ? ` · ${email}` : ''}</p>
        </div>
        <button onClick={logout} className="px-3 py-1.5 text-xs border border-zinc-800 text-zinc-500 hover:text-zinc-100 hover:border-zinc-700">Logout</button>
      </div>

      <div className="mt-6 flex gap-3">
        <Link href="/admin/blog" className="px-4 py-2 bg-zinc-100 text-zinc-900 text-sm hover:bg-white">Manage blog →</Link>
        <Link href="/" className="px-4 py-2 border border-zinc-800 text-sm text-zinc-400 hover:text-zinc-100 hover:border-zinc-700">Back to site</Link>
      </div>

      <div className="mt-10 border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
        <h2 className="text-sm font-bold text-zinc-100">Change password</h2>
        <p className="text-xs text-zinc-500 mt-1">Update your login password (stored in Neon, bcrypt).</p>
        <form onSubmit={handleChange} className="mt-4 space-y-3 max-w-sm">
          <label className="block">
            <span className="text-[11px] text-zinc-500 font-mono">Current password</span>
            <input type="password" value={current} onChange={e => setCurrent(e.target.value)} placeholder="••••••••" className="mt-1 w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono" />
          </label>
          <label className="block">
            <span className="text-[11px] text-zinc-500 font-mono">New password</span>
            <input type="password" value={next} onChange={e => setNext(e.target.value)} placeholder="min 6 chars" className="mt-1 w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono" />
          </label>
          {msg && (
            <div className={`text-xs px-3 py-2 border font-mono ${msg.t === 'ok' ? 'border-emerald-900/50 bg-emerald-950/30 text-emerald-300' : 'border-red-900/50 bg-red-950/30 text-red-300'}`}>{msg.m}</div>
          )}
          <button type="submit" disabled={saving} className="px-4 py-2 bg-zinc-100 text-zinc-900 text-sm hover:bg-white disabled:opacity-50">{saving ? 'Saving…' : 'Update password'}</button>
        </form>
      </div>
    </div>
  )
}
