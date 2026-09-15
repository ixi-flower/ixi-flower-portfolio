'use client'
import { useEffect, useState, useCallback } from 'react'
import { Key, Copy, Trash2, Plus, Shield, ExternalLink, Clock, Check } from 'lucide-react'
import ConfirmDialog from '@/components/admin/ConfirmDialog'

type TokenRow = { id: string; name: string; prefix: string; scopes: string[]; lastUsedAt: string | null; expiresAt: string | null; createdAt: string }
const ALL_SCOPES = ["*", "blog:read","blog:write","notes:read","notes:write","bookmarks:read","bookmarks:write","vault:read","vault:reveal","vault:write","site-content:read","site-content:write","upload:write"] as const

export default function AdminApiPage() {
  const [tokens, setTokens] = useState<TokenRow[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [toast, setToast] = useState<{t:'ok'|'err', m:string}|null>(null)
  const push = useCallback((m: typeof toast) => { setToast(m); setTimeout(()=>setToast(null), 2200)}, [])
  const [newName, setNewName] = useState('')
  const [newScopes, setNewScopes] = useState<string[]>(["*"])
  const [newExpires, setNewExpires] = useState('') // YYYY-MM-DD or empty
  const [creating, setCreating] = useState(false)
  const [createdToken, setCreatedToken] = useState<string | null>(null)
  const [createdPrefix, setCreatedPrefix] = useState('')
  const [copied, setCopied] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<TokenRow | null>(null)

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ixiflower.vercel.app'

  const load = useCallback(async () => {
    setLoading(true); setErr('')
    try {
      const r = await fetch('/api/admin/api-tokens', { cache: 'no-store' })
      const j = await r.json().catch(()=>({}))
      if (!r.ok) throw new Error(j.error || 'Failed to load tokens')
      setTokens(j.tokens || [])
    } catch (e) { setErr(e instanceof Error ? e.message : 'Load failed') }
    finally { setLoading(false) }
  }, [])
  useEffect(()=>{ load() }, [load])

  function toggleScope(s: string) {
    if (s === '*') { setNewScopes(prev => prev.includes('*') ? [] : ['*']); return }
    setNewScopes(prev => {
      const withoutStar = prev.filter(x=>x!=='*')
      if (withoutStar.includes(s)) return withoutStar.filter(x=>x!==s)
      return [...withoutStar, s]
    })
  }

  async function create() {
    if (!newName.trim()) { push({t:'err', m:'Name required'}); return }
    if (newScopes.length===0) { push({t:'err', m:'Pick at least one scope or *'}); return }
    setCreating(true); setCreatedToken(null)
    try {
      const body: Record<string, unknown> = { name: newName.trim(), scopes: newScopes.includes('*') ? ['*'] : newScopes }
      if (newExpires) {
        const d = new Date(newExpires + 'T23:59:59')
        if (!isNaN(d.getTime())) body.expiresAt = d.toISOString()
      }
      const r = await fetch('/api/admin/api-tokens', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
      const j = await r.json().catch(()=>({}))
      if (!r.ok) { push({t:'err', m:j.error || 'Create failed'}); return }
      setCreatedToken(j.token as string)
      setCreatedPrefix(j.prefix as string)
      setCopied(false)
      setNewName(''); setNewExpires('')
      push({t:'ok', m:'Token created ✓ — copy it now!'})
      await load()
    } catch { push({t:'err', m:'Network error'}) }
    finally { setCreating(false) }
  }

  async function copy(t: string) {
    try { await navigator.clipboard.writeText(t); setCopied(true); push({t:'ok', m:'Copied ✓'}); setTimeout(()=>setCopied(false), 1800) } catch { push({t:'err', m:'Copy failed'})}
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    const id = pendingDelete.id; setPendingDelete(null)
    const r = await fetch(`/api/admin/api-tokens/${id}`, { method:'DELETE' })
    const j = await r.json().catch(()=>({}))
    if (!r.ok) { push({t:'err', m:j.error || 'Delete failed'}); return }
    push({t:'ok', m:'Revoked ✓'})
    setTokens(prev=>prev.filter(x=>x.id!==id))
  }

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8"><p className="text-zinc-600 text-sm font-mono animate-pulse">$ api-tokens --list …</p></div>

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 admin-fade space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2"><Key className="h-5 w-5 text-sky-400" /> API <span className="text-xs font-mono text-zinc-600">token bridge — 100% of site data</span></h1>
        <p className="text-xs text-zinc-500 mt-1 font-mono flex items-center gap-2"><Shield className="h-3 w-3 text-emerald-500" /> Bearer ixi_pat_… · SHA-256 at rest · prefix shown · plaintext once · <a href="/api/v1/docs" target="_blank" className="underline hover:text-zinc-300 inline-flex items-center gap-1">Docs <ExternalLink className="h-3 w-3"/></a> · <a href="/api/v1/health" target="_blank" className="underline hover:text-zinc-300 inline-flex items-center gap-1">Health</a></p>
      </div>

      {err && <div className="border border-red-900/50 bg-red-950/30 text-red-300 text-sm px-4 py-3 font-mono">{err}</div>}
      {toast && <div className={`text-xs px-3 py-2 border font-mono ${toast.t==='ok' ? 'border-emerald-900/50 bg-emerald-950/30 text-emerald-300' : 'border-red-900/50 bg-red-950/30 text-red-300'}`}>{toast.m}</div>}

      {/* Create */}
      <div className="border border-zinc-800 bg-zinc-900 p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-100 font-mono"><Plus className="h-3.5 w-3.5" /> New token</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[11px] text-zinc-500 font-mono">Name *</span>
            <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="My CI / iPhone / Bot" maxLength={120} className="mt-1 w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
          </label>
          <label className="block">
            <span className="text-[11px] text-zinc-500 font-mono">Expires (optional)</span>
            <input type="date" value={newExpires} onChange={e=>setNewExpires(e.target.value)} className="mt-1 w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600" />
          </label>
        </div>
        <div>
          <span className="text-[11px] text-zinc-500 font-mono">Scopes {newScopes.includes('*') ? '— wildcard * = all' : `— ${newScopes.length} selected`}</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ALL_SCOPES.map(s => {
              const on = newScopes.includes(s)
              return (
                <button key={s} onClick={()=>toggleScope(s)} className={`px-2.5 py-1 text-xs font-mono border ${on ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'}`}>{s} {on ? '✓' : ''}</button>
              )
            })}
          </div>
          <p className="text-[11px] text-zinc-600 font-mono mt-1">* grants everything. vault:reveal is needed to decrypt vault; vault:read alone never returns passwords.</p>
        </div>
        <button onClick={create} disabled={creating} className="px-4 py-2 bg-zinc-100 text-zinc-900 text-sm hover:bg-white disabled:opacity-50 font-mono inline-flex items-center gap-1.5"><Key className="h-4 w-4" /> {creating ? 'Creating…' : 'Create token'}</button>
        {createdToken && (
          <div className="border border-emerald-900/50 bg-emerald-950/20 p-3 space-y-2">
            <div className="text-xs font-mono text-emerald-300 font-bold">Copy now — never shown again · prefix {createdPrefix}</div>
            <div className="flex gap-2">
              <code className="flex-1 bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs font-mono text-amber-200 break-all select-all">{createdToken}</code>
              <button onClick={()=>copy(createdToken)} className={`px-3 py-2 text-xs font-mono border shrink-0 inline-flex items-center gap-1.5 ${copied ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'}`}><Copy className="h-3.5 w-3.5" />{copied ? 'Copied ✓' : 'Copy'}</button>
            </div>
            <div className="text-[11px] font-mono text-zinc-500">Use: <code className="text-zinc-300">curl {appUrl}/api/v1/blog -H &quot;Authorization: Bearer {createdPrefix}…&quot;</code></div>
          </div>
        )}
      </div>

      {/* List */}
      <div className="border border-zinc-800 bg-zinc-900">
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-100 font-mono">Tokens · {tokens.length}</span>
          <span className="text-[11px] font-mono text-zinc-600">hash at rest · touch on use</span>
        </div>
        {tokens.length===0 ? (
          <p className="text-xs text-zinc-600 font-mono px-4 py-6 text-center">No tokens yet — create one above.</p>
        ) : (
          <div className="divide-y divide-zinc-800">
            {tokens.map(t => (
              <div key={t.id} className="px-4 py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-100 truncate">{t.name} <span className="text-xs font-mono text-zinc-500">· {t.prefix}… · {t.scopes.join(', ')}</span></div>
                  <div className="text-[11px] font-mono text-zinc-500 mt-0.5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> created {new Date(t.createdAt).toLocaleDateString()}</span>
                    {t.expiresAt && <span className={new Date(t.expiresAt).getTime() < Date.now() ? 'text-red-400' : 'text-amber-400'}>expires {new Date(t.expiresAt).toLocaleDateString()}</span>}
                    {t.lastUsedAt && <span className="text-emerald-500 inline-flex items-center gap-1"><Check className="h-3 w-3" /> last used {new Date(t.lastUsedAt).toLocaleString()}</span>}
                    {!t.lastUsedAt && <span className="text-zinc-600">never used</span>}
                  </div>
                </div>
                <button onClick={()=>setPendingDelete(t)} className="h-7 w-7 flex items-center justify-center border border-red-900/50 text-red-400 hover:bg-red-950/30 shrink-0" title="Revoke"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border border-zinc-800 bg-zinc-950 px-3 py-2 text-[11px] font-mono text-zinc-600 space-y-1">
        <div className="font-bold text-zinc-400">Bridge covers 100%:</div>
        <div>Blog (list/get/create/patch/delete/reorder) · Notes · Bookmarks · Vault (read/reveal/write/export/import/reorder) · Site-content (playlist/waka/tech/courses/profile/banner) · Health/Docs</div>
        <div>Auth: <code className="text-zinc-300">Authorization: Bearer ixi_pat_...</code> or <code className="text-zinc-300">x-api-token</code> or <code className="text-zinc-300">?token=</code> · also owner JWT cookie still works on /api/v1/*</div>
        <div>Example: <code className="text-zinc-300">curl {appUrl}/api/v1/blog -H &quot;Authorization: Bearer ixi_pat_...&quot;</code> · full docs at <code className="text-zinc-300">/api/v1/docs</code></div>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Revoke token?"
        message={pendingDelete ? `Revoke "${pendingDelete.name}" (${pendingDelete.prefix}…) — requests with it will get 401. This cannot be undone.` : ''}
        confirmLabel="Revoke"
        onConfirm={confirmDelete}
        onCancel={()=>setPendingDelete(null)}
      />
    </div>
  )
}
