'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, LogOut, X } from 'lucide-react'

type Social = { label: string; href: string; icon: 'github' | 'twitter' | 'linkedin' | 'mail' | 'youtube'; command: string }
type Profile = { handle: string; title: string; name: string; bio: string; avatar?: string; avatarPublicId?: string; socials: Social[] }

const EMPTY_PROFILE: Profile = {
  handle: 'ixi_flower_',
  title: 'Full-Stack Developer',
  name: 'Amirabbas Rouintan',
  bio: 'Self-taught software engineer from Iran. Specializing in Next.js, TypeScript, Python & Go — I build fast web apps, Telegram bots, trading systems and self-hosted infra. Obsessed with clean UIs, automation, and shipping real products.',
  avatar: '/avatar.jpg',
  avatarPublicId: '',
  socials: [
    { label: 'GitHub', href: 'https://github.com/ixiflower', icon: 'github', command: 'open github' },
    { label: 'Twitter', href: 'https://x.com/ixi_flower0', icon: 'twitter', command: 'open twitter' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/amirabbas-rouintan', icon: 'linkedin', command: 'open linkedin' },
    { label: 'YouTube', href: 'https://www.youtube.com/@ixi_flower0', icon: 'youtube', command: 'open youtube' },
    { label: 'Email', href: 'mailto:amirabbas.rouintan2007@gmail.com', icon: 'mail', command: 'send email' },
  ],
}

export default function AdminIndex() {
  const router = useRouter()
  const [tab, setTab] = useState<'profile' | 'security'>('profile')

  // auth
  const [email, setEmail] = useState('')
  useEffect(() => {
    fetch('/api/admin/auth/me', { cache: 'no-store' })
      .then(r => r.json())
      .then(j => { if (j.email) setEmail(j.email) })
      .catch(() => {})
  }, [])

  // profile state
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoadingProfile(true)
      try {
        // try ?key=profile first
        let data: Record<string, unknown> | null = null
        try {
          const r = await fetch('/api/site-content?key=profile', { cache: 'no-store' })
          if (r.ok) {
            const j = await r.json()
            // API returns { profile: value } when key param, or {key,value} for admin route — handle both shapes
            if (j.profile !== undefined) data = { profile: j.profile }
            else if (j.value !== undefined && j.key === 'profile') data = { profile: j.value }
            else if (j.profile) data = j
            else data = j
          }
        } catch {}
        // fallback to all
        if (!data || data.profile == null) {
          const r2 = await fetch('/api/site-content', { cache: 'no-store' })
          if (r2.ok) {
            const j2 = await r2.json()
            if (j2.profile) data = j2
          }
        }
        if (!cancelled && data && (data as { profile?: unknown }).profile && typeof (data as { profile: unknown }).profile === 'object') {
          const p = (data as { profile: Profile }).profile
          // merge with empty to ensure all keys
          const loadedSocials: Social[] = Array.isArray(p.socials) ? (p.socials as Social[]) : EMPTY_PROFILE.socials
          const hasYoutube = loadedSocials.some((s) => s.icon === 'youtube')
          const mergedSocials = hasYoutube ? loadedSocials : [...loadedSocials, { label: 'YouTube', href: 'https://www.youtube.com/@ixi_flower0', icon: 'youtube' as const, command: 'open youtube' }]
          setProfile({
            handle: p.handle ?? EMPTY_PROFILE.handle,
            title: p.title ?? EMPTY_PROFILE.title,
            name: p.name ?? EMPTY_PROFILE.name,
            bio: p.bio ?? EMPTY_PROFILE.bio,
            avatar: p.avatar ?? EMPTY_PROFILE.avatar,
            avatarPublicId: p.avatarPublicId ?? '',
            socials: mergedSocials,
          })
        }
      } catch {}
      if (!cancelled) setLoadingProfile(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  async function handleAvatarUpload(file: File) {
    setUploading(true)
    setProfileMsg(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      // try upload-avatar first, fallback to upload
      let r = await fetch('/api/admin/upload-avatar', { method: 'POST', body: fd })
      if (r.status === 404) {
        const fd2 = new FormData()
        fd2.append('file', file)
        r = await fetch('/api/admin/upload', { method: 'POST', body: fd2 })
      }
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        setProfileMsg({ t: 'err', m: j.error || 'Upload failed' })
        return
      }
      setProfile(prev => ({ ...prev, avatar: j.url as string, avatarPublicId: (j.publicId as string) || prev.avatarPublicId }))
      setProfileMsg({ t: 'ok', m: 'Avatar uploaded ✓ — save profile to persist' })
    } catch {
      setProfileMsg({ t: 'err', m: 'Upload network error' })
    } finally {
      setUploading(false)
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileMsg(null)
    if (!profile.handle.trim()) { setProfileMsg({ t: 'err', m: 'Handle is required' }); return }
    setSavingProfile(true)
    try {
      const r = await fetch('/api/admin/site-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'profile', value: profile }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setProfileMsg({ t: 'err', m: j.error || 'Save failed' }); return }
      setProfileMsg({ t: 'ok', m: 'Profile saved ✓' })
    } catch {
      setProfileMsg({ t: 'err', m: 'Network error' })
    } finally { setSavingProfile(false) }
  }

  function updateSocial(idx: number, patch: Partial<Social>) {
    setProfile(prev => {
      const next = [...prev.socials]
      next[idx] = { ...next[idx], ...patch }
      return { ...prev, socials: next }
    })
  }
  function addSocial() {
    if (profile.socials.length >= 8) return
    setProfile(prev => ({ ...prev, socials: [...prev.socials, { label: '', href: '', icon: 'github' as const, command: '' }] }))
  }
  function removeSocial(idx: number) {
    setProfile(prev => ({ ...prev, socials: prev.socials.filter((_, i) => i !== idx) }))
  }

  // change-password (security tab)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null)
  const [saving, setSaving] = useState(false)

  // change-email (security tab) — Neon admin_users email + re-issue JWT
  const [emailCurrent, setEmailCurrent] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [emailMsg, setEmailMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null)
  const [emailSaving, setEmailSaving] = useState(false)
  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault()
    setEmailMsg(null)
    if (!emailCurrent || !newEmail.trim()) { setEmailMsg({ t: 'err', m: 'Password and new email required' }); return }
    setEmailSaving(true)
    try {
      const r = await fetch('/api/admin/auth/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current: emailCurrent, newEmail: newEmail.trim().toLowerCase() }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setEmailMsg({ t: 'err', m: j.error || 'Failed' }); return }
      setEmailMsg({ t: 'ok', m: `Email updated ✓ → ${j.email ?? newEmail}` })
      if (j.email) setEmail(j.email as string)
      setEmailCurrent(''); setNewEmail('')
    } catch {
      setEmailMsg({ t: 'err', m: 'Network error' })
    } finally { setEmailSaving(false) }
  }

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
    <div className="max-w-3xl mx-auto px-4 py-10 admin-fade">
      <div className="flex items-start justify-between gap-4 admin-fade">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Admin</h1>
          <p className="text-sm text-zinc-500 mt-1">ixi_flower — owner only{email ? ` · ${email}` : ''}</p>
        </div>
        <button onClick={logout} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-500/40 hover:bg-red-950/20 hover:shadow-[0_0_12px_rgba(239,68,68,0.25)] transition-all md:hidden"><LogOut className="h-3.5 w-3.5" /> Logout</button>
      </div>

      {/* sidebar already has Blog / Site content / Back to site — hide these on desktop */}
      <div className="mt-6 flex flex-wrap gap-3 md:hidden admin-fade admin-fade-d1">
        <Link href="/admin/blog" className="px-4 py-2 bg-zinc-100 text-zinc-900 text-sm hover:bg-white">Manage blog →</Link>
        <Link href="/admin/site-content" className="px-4 py-2 border border-zinc-800 text-sm text-zinc-100 hover:bg-zinc-800 hover:border-zinc-700">Site content →</Link>
        <Link href="/" className="px-4 py-2 border border-zinc-800 text-sm text-zinc-400 hover:text-zinc-100 hover:border-zinc-700">Back to site</Link>
      </div>

      <div className="mt-8 flex gap-2 border-b border-zinc-800">
        <button onClick={() => setTab('profile')} className={`px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${tab === 'profile' ? 'border-zinc-100 text-zinc-100' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>Profile</button>
        <button onClick={() => setTab('security')} className={`px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${tab === 'security' ? 'border-zinc-100 text-zinc-100' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>Security</button>
      </div>

      {tab === 'profile' ? (
        <div className="mt-6 border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
          <h2 className="text-sm font-bold text-zinc-100">Profile</h2>
          <p className="text-xs text-zinc-500 mt-1">Edit your public profile — avatar, name, bio and social links.</p>
          {loadingProfile ? (
            <p className="text-xs text-zinc-500 mt-4 font-mono">Loading profile…</p>
          ) : (
            <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
              {/* avatar */}
              <div className="flex gap-4 items-start">
                <button type="button" onClick={() => setAvatarOpen(true)} className="w-20 h-20 overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0 flex items-center justify-center hover:border-zinc-600 transition-colors" title="Click to enlarge">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={profile.avatar || '/avatar.jpg'} alt="avatar preview" className="object-cover w-full h-full" onError={(e) => { (e.target as HTMLImageElement).src = '/avatar.jpg' }} />
                </button>
                <div className="flex-1 min-w-0 space-y-2">
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/avif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); e.target.value = '' }} />
                  <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className="px-3 py-1.5 text-xs border border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 disabled:opacity-50">{uploading ? 'Uploading…' : 'Upload avatar'}</button>
                  <p className="text-[10px] text-zinc-500">Cloudinary folder ixi-wave/avatars · png/jpg/gif/webp/avif · ≤50 MB</p>
                  <label className="block">
                    <span className="text-[11px] text-zinc-500 font-mono">Avatar URL (or paste Cloudinary URL)</span>
                    <input value={profile.avatar || ''} onChange={e => setProfile(p => ({ ...p, avatar: e.target.value }))} placeholder="https://... or /avatar.jpg" className="mt-1 w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono" />
                  </label>
                  {profile.avatarPublicId ? <p className="text-[10px] text-zinc-600 font-mono truncate">publicId: {profile.avatarPublicId}</p> : null}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[11px] text-zinc-500 font-mono">Name</span>
                  <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} maxLength={80} placeholder="Amirabbas Rouintan" className="mt-1 w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
                </label>
                <label className="block">
                  <span className="text-[11px] text-zinc-500 font-mono">Handle</span>
                  <input value={profile.handle} onChange={e => setProfile(p => ({ ...p, handle: e.target.value }))} maxLength={40} placeholder="ixi_flower_" className="mt-1 w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono" />
                </label>
              </div>
              <label className="block">
                <span className="text-[11px] text-zinc-500 font-mono">Title</span>
                <input value={profile.title} onChange={e => setProfile(p => ({ ...p, title: e.target.value }))} maxLength={80} placeholder="Full-Stack Developer" className="mt-1 w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
              </label>
              <label className="block">
                <span className="text-[11px] text-zinc-500 font-mono">Bio (max 500)</span>
                <textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} maxLength={500} rows={4} placeholder="Short bio…" className="mt-1 w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-y" />
                <span className="text-[10px] text-zinc-600">{profile.bio.length}/500</span>
              </label>

              <div className="border-t border-zinc-800 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-100">Socials ({profile.socials.length}/8)</h3>
                  <button type="button" onClick={addSocial} disabled={profile.socials.length >= 8} className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"><Plus className="h-3 w-3" /> Add</button>
                </div>
                <div className="mt-3 space-y-3">
                  {profile.socials.length === 0 && <p className="text-xs text-zinc-500">No socials — add one.</p>}
                  {profile.socials.map((s, idx) => (
                    <div key={idx} className="border border-zinc-800 bg-zinc-950 p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-zinc-500 font-mono">#{idx + 1}</span>
                        <button type="button" onClick={() => removeSocial(idx)} className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 hover:bg-red-950/20 px-1.5 py-0.5 border border-transparent hover:border-red-900/30 transition-colors"><Trash2 className="h-3 w-3" /></button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label className="block">
                          <span className="text-[11px] text-zinc-500 font-mono">Label</span>
                          <input value={s.label} onChange={e => updateSocial(idx, { label: e.target.value })} maxLength={40} placeholder="GitHub" className="mt-1 w-full bg-zinc-900 border border-zinc-800 px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
                        </label>
                        <label className="block">
                          <span className="text-[11px] text-zinc-500 font-mono">Icon</span>
                          <select value={s.icon} onChange={e => updateSocial(idx, { icon: e.target.value as Social['icon'] })} className="mt-1 w-full bg-zinc-900 border border-zinc-800 px-2 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600">
                            <option value="github">github</option>
                            <option value="twitter">twitter</option>
                            <option value="linkedin">linkedin</option>
                            <option value="mail">mail</option>
                            <option value="youtube">youtube</option>
                          </select>
                        </label>
                      </div>
                      <label className="block">
                        <span className="text-[11px] text-zinc-500 font-mono">href (URL)</span>
                        <input value={s.href} onChange={e => updateSocial(idx, { href: e.target.value })} placeholder="https://..." className="mt-1 w-full bg-zinc-900 border border-zinc-800 px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono" />
                      </label>
                      <label className="block">
                        <span className="text-[11px] text-zinc-500 font-mono">command</span>
                        <input value={s.command} onChange={e => updateSocial(idx, { command: e.target.value })} maxLength={40} placeholder="open github" className="mt-1 w-full bg-zinc-900 border border-zinc-800 px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {profileMsg && (
                <div className={`text-xs px-3 py-2 border font-mono ${profileMsg.t === 'ok' ? 'border-emerald-900/50 bg-emerald-950/30 text-emerald-300' : 'border-red-900/50 bg-red-950/30 text-red-300'}`}>{profileMsg.m}</div>
              )}
              <button type="submit" disabled={savingProfile} className="px-4 py-2 bg-zinc-100 text-zinc-900 text-sm hover:bg-white disabled:opacity-50">{savingProfile ? 'Saving…' : 'Save profile'}</button>
            </form>
          )}
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
            <h2 className="text-sm font-bold text-zinc-100">Change email</h2>
            <p className="text-xs text-zinc-500 mt-1 font-mono">Current: <span className="text-zinc-300">{email || '—'}</span> — updates Neon admin_users + re-issues JWT cookie.</p>
            <form onSubmit={handleEmailChange} className="mt-4 space-y-3 max-w-sm">
              <label className="block">
                <span className="text-[11px] text-zinc-500 font-mono">Current password (confirm)</span>
                <input type="password" value={emailCurrent} onChange={e => setEmailCurrent(e.target.value)} placeholder="••••••••" className="mt-1 w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono" />
              </label>
              <label className="block">
                <span className="text-[11px] text-zinc-500 font-mono">New email</span>
                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className="mt-1 w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono" />
              </label>
              {emailMsg && (
                <div className={`text-xs px-3 py-2 border font-mono ${emailMsg.t === 'ok' ? 'border-emerald-900/50 bg-emerald-950/30 text-emerald-300' : 'border-red-900/50 bg-red-950/30 text-red-300'}`}>{emailMsg.m}</div>
              )}
              <button type="submit" disabled={emailSaving} className="px-4 py-2 bg-zinc-100 text-zinc-900 text-sm hover:bg-white disabled:opacity-50">{emailSaving ? 'Saving…' : 'Update email'}</button>
            </form>
          </div>
          <div className="border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
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
      )}
      {avatarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setAvatarOpen(false)}>
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setAvatarOpen(false)} className="absolute -top-2 -right-2 h-7 w-7 bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-zinc-100 flex items-center justify-center">
              <X className="h-4 w-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={profile.avatar || '/avatar.jpg'} alt="avatar large" className="max-w-[90vw] max-h-[90vh] object-contain border border-zinc-700 bg-zinc-950" onError={(e) => { (e.target as HTMLImageElement).src = '/avatar.jpg' }} />
          </div>
        </div>
      )}
    </div>
  )
}
