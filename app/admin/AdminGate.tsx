'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [ok, setOk] = useState(false)
  const [checking, setChecking] = useState(true)

  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (isLoginPage) { setChecking(false); setOk(true); return }
    fetch('/api/admin/auth/me', { cache: 'no-store' })
      .then(r => {
        if (r.ok) setOk(true)
        else router.replace('/admin/login')
      })
      .catch(() => router.replace('/admin/login'))
      .finally(() => setChecking(false))
  }, [pathname, isLoginPage, router])

  if (isLoginPage) return <>{children}</>
  if (checking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-xs text-zinc-600 font-mono animate-pulse">$ auth check…</p>
      </div>
    )
  }
  if (!ok) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-xs text-zinc-600 font-mono">Redirecting to login…</p>
      </div>
    )
  }
  return <>{children}</>
}
