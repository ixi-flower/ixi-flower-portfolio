'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('amirabbas.rouintan2007@gmail.com')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    fetch('/api/admin/auth/me', { cache: 'no-store' })
      .then(r => {
        if (r.ok) router.replace('/admin/blog')
        else setChecking(false)
      })
      .catch(() => setChecking(false))
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const em = email.trim().toLowerCase()
    if (!em || !password) { setError('Email and password required'); return }
    setLoading(true); setError('')
    try {
      const r = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: em, password }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        setError(j.error || 'Invalid credentials')
        return
      }
      router.replace('/admin/blog')
      router.refresh()
    } catch {
      setError('Network error — is the dev server running?')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <p className="text-xs text-zinc-600 font-mono animate-pulse">$ checking session…</p>
      </div>
    )
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="border border-zinc-800 bg-zinc-900">
          <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border-b border-zinc-700">
            <span className="flex gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
            <span className="text-[11px] text-zinc-400 font-mono">ssh ixi_flower@ixi-wave — login</span>
          </div>

          <div className="px-4 sm:px-6 py-6 sm:py-8">
            <h1 className="text-sm font-bold text-zinc-100 tracking-tight">Admin login</h1>
            <p className="text-xs text-zinc-500 mt-1">Owner only — ixi_flower</p>
            <p className="text-[11px] text-zinc-600 font-mono mt-3 border-l-2 border-zinc-700 pl-2">
              $ auth login --owner<br />
              <span className="text-zinc-500">Neon Auth · JWT cookie</span>
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-3">
              <label className="block">
                <span className="text-[11px] text-zinc-500 font-mono">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="amirabbas.rouintan2007@gmail.com"
                  autoComplete="email"
                  className="mt-1 w-full bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono"
                />
              </label>
              <label className="block">
                <span className="text-[11px] text-zinc-500 font-mono">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoFocus
                  autoComplete="current-password"
                  className="mt-1 w-full bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono"
                />
              </label>

              {error && (
                <div className="border border-red-900/50 bg-red-950/30 text-red-300 text-xs px-3 py-2 font-mono">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-zinc-100 text-zinc-900 text-sm font-medium hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Verifying…' : 'Login →'}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-3 text-center">
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 font-mono">← back to site</Link>
        </div>
      </div>
    </div>
  )
}
