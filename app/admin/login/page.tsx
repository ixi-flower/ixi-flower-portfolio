'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (opts: { client_id: string; callback: (res: { credential: string }) => void }) => void
          renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void
          prompt: () => void
        }
      }
    }
  }
}

const GOOGLE_CID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || ''

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState('')
  const [googleReady, setGoogleReady] = useState(false)
  const googleBtnRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/admin/auth/me', { cache: 'no-store' })
      .then(r => {
        if (r.ok) router.replace('/admin/blog')
        else setChecking(false)
      })
      .catch(() => setChecking(false))
  }, [router])

  const handleGoogleCredential = useCallback(async (credential: string) => {
    setGoogleError('')
    setGoogleLoading(true)
    try {
      const r = await fetch('/api/admin/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: credential }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        setGoogleError((j as { error?: string }).error || 'Google login failed')
        return
      }
      router.replace('/admin/blog')
      router.refresh()
    } catch {
      setGoogleError('Network error — is the dev server running?')
    } finally {
      setGoogleLoading(false)
    }
  }, [router])

  // load GIS + render button when GOOGLE_CID configured
  useEffect(() => {
    if (!GOOGLE_CID || checking) return
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CID,
          callback: (res) => handleGoogleCredential(res.credential),
        })
        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = ''
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'filled_black',
            size: 'large',
            width: 320,
            text: 'signin_with',
            shape: 'square',
          })
        }
        setGoogleReady(true)
      } catch {}
      return
    }
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.onload = () => {
      try {
        window.google?.accounts.id.initialize({
          client_id: GOOGLE_CID,
          callback: (res) => handleGoogleCredential(res.credential),
        })
        if (googleBtnRef.current && window.google?.accounts?.id) {
          googleBtnRef.current.innerHTML = ''
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'filled_black',
            size: 'large',
            width: 320,
            text: 'signin_with',
            shape: 'square',
          })
        }
        setGoogleReady(true)
      } catch {
        setGoogleError('Failed to init Google Sign-In')
      }
    }
    s.onerror = () => setGoogleError('Failed to load Google Sign-In')
    document.head.appendChild(s)
  }, [checking, handleGoogleCredential])

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
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-xs text-zinc-600 font-mono animate-pulse">$ checking session…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
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

            {/* Google Sign-In — button always visible (disabled placeholder when not configured) */}
            <div className="mt-5">
              <div
                ref={googleBtnRef}
                className={GOOGLE_CID ? 'flex justify-center min-h-[40px] [&>div]:!w-full [&>div]:flex [&>div]:justify-center [&_iframe]:!w-full' : 'hidden'}
              />
              {!GOOGLE_CID && (
                <button
                  type="button"
                  disabled
                  title="Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local to enable Google login"
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-zinc-700 bg-zinc-800 text-zinc-500 text-sm font-mono cursor-not-allowed opacity-70"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09A6.97 6.97 0 0 1 5.46 12c0-.72.13-1.42.38-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Sign in with Google
                </button>
              )}
              {GOOGLE_CID && !googleReady && !googleError && (
                <p className="text-[11px] text-zinc-600 font-mono text-center mt-2 animate-pulse">loading Google…</p>
              )}
              {GOOGLE_CID && googleLoading && <p className="text-[11px] text-zinc-400 font-mono text-center mt-2">Verifying Google…</p>}
              {googleError && (
                <div className="mt-2 border border-red-900/50 bg-red-950/30 text-red-300 text-xs px-3 py-2 font-mono">{googleError}</div>
              )}
              {!GOOGLE_CID && (
                <p className="text-[11px] text-zinc-500 font-mono text-center mt-2">
                  Set <span className="text-zinc-400">NEXT_PUBLIC_GOOGLE_CLIENT_ID</span> in .env.local to enable.
                </p>
              )}
              <div className="flex items-center gap-3 my-4">
                <span className="flex-1 h-px bg-zinc-800" />
                <span className="text-[10px] text-zinc-600 font-mono tracking-widest">OR</span>
                <span className="flex-1 h-px bg-zinc-800" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block">
                <span className="text-[11px] text-zinc-500 font-mono">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
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
                disabled={loading || googleLoading}
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
