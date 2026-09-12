'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import type { PostRow } from '@/lib/db/schema'
import { slugify } from '@/lib/utils'
import { uploadFile } from '@/lib/upload'

const BlogEditor = dynamic(() => import('@/components/admin/BlogEditor'), { ssr: false })

type PostWithTags = PostRow & { tags?: { id: number; slug: string; name: string }[] }

function getSecret(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('ixi_admin_secret') || ''
}

const inputCls = 'w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600'

export default function BlogForm({ post }: { post?: PostWithTags }) {
  const router = useRouter()
  const [title, setTitle] = useState(post?.title || '')
  const [titleFa, setTitleFa] = useState(post?.titleFa || '')
  const [slug, setSlug] = useState(post?.slug || '')
  const [slugFa, setSlugFa] = useState(post?.slugFa || '')
  const [excerpt, setExcerpt] = useState(post?.excerpt || '')
  const [excerptFa, setExcerptFa] = useState(post?.excerptFa || '')
  const [content, setContent] = useState(post?.content || '')
  const [contentFa, setContentFa] = useState(post?.contentFa || '')
  const [coverUrl, setCoverUrl] = useState(post?.coverUrl || '')
  const [coverPublicId, setCoverPublicId] = useState(post?.coverPublicId || '')
  const [metaTitle, setMetaTitle] = useState(post?.metaTitle || '')
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription || '')
  const [tagsInput, setTagsInput] = useState((post?.tags || []).map(t => t.name).join(', '))
  const [status, setStatus] = useState<'draft' | 'published'>((post?.status as any) || 'draft')
  const [lang, setLang] = useState<'en' | 'fa'>('en')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; slug?: string }>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const save = async () => {
    setError(''); setSaved(false)
    const fe: { title?: string; slug?: string } = {}
    if (!title.trim()) fe.title = 'Title is required'
    if (!slug.trim()) fe.slug = 'Slug is required'
    setFieldErrors(fe)
    if (fe.title || fe.slug) return

    const tags = tagsInput.split(/[,،]/).map(t => t.trim()).filter(Boolean)
    const secret = getSecret()
    setSaving(true)
    try {
      const url = post ? `/api/admin/blog/${post.id}` : '/api/admin/blog'
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (secret) headers['x-admin-secret'] = secret
      else headers['x-admin-email'] = 'amirabbas.rouintan2007@gmail.com'
      const r = await fetch(url, {
        method: post ? 'PATCH' : 'POST',
        headers,
        body: JSON.stringify({
          title, titleFa: titleFa || undefined,
          slug, slugFa: slugFa || undefined,
          excerpt: excerpt || undefined, excerptFa: excerptFa || undefined,
          content, contentFa: contentFa || undefined,
          coverUrl: coverUrl || undefined, coverPublicId: coverPublicId || undefined,
          metaTitle: metaTitle || undefined, metaDescription: metaDescription || undefined,
          status, tags,
        }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data.error || 'Save failed')
      setSaved(true)
      if (!post) router.push('/admin/blog')
      else router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally { setSaving(false) }
  }

  const uploadCover = async (file: File) => {
    setUploading(true); setUploadProgress(0); setError('')
    try {
      const url = await uploadFile(file, setUploadProgress)
      setCoverUrl(url)
      // coverPublicId is set server-side on upload; for manual URL keep existing
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally { setUploading(false) }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      {error && <div role="alert" className="border border-red-900/50 bg-red-950/30 text-red-300 text-sm px-4 py-3">{error}</div>}
      {saved && <div role="status" className="border border-emerald-900/50 bg-emerald-950/30 text-emerald-300 text-sm px-4 py-3">Saved ✓</div>}

      {/* lang toggle for editor */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500">Editing language:</span>
        <div className="inline-flex border border-zinc-800">
          <button type="button" onClick={() => setLang('en')} className={`px-3 py-1 text-xs ${lang === 'en' ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-100'}`}>EN</button>
          <button type="button" onClick={() => setLang('fa')} className={`px-3 py-1 text-xs ${lang === 'fa' ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-100'}`}>FA — فارسی</button>
        </div>
      </div>

      {lang === 'en' ? (
        <>
          <label className="block">
            <span className="text-xs text-zinc-500 mb-1 block">Title (EN) *</span>
            <input value={title} onChange={e => setTitle(e.target.value)} className={`${inputCls} ${fieldErrors.title ? '!border-red-800' : ''}`} placeholder="Post title" />
            {fieldErrors.title && <p className="text-xs text-red-400 mt-1">{fieldErrors.title}</p>}
          </label>
          <label className="block">
            <span className="text-xs text-zinc-500 mb-1 block">Slug (EN) *</span>
            <div className="flex gap-2">
              <input value={slug} onChange={e => setSlug(e.target.value)} className={`${inputCls} ${fieldErrors.slug ? '!border-red-800' : ''}`} dir="ltr" placeholder="my-post-slug" />
              <button type="button" onClick={() => setSlug(slugify(title))} className="px-3 py-2 text-xs border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 shrink-0">from title</button>
            </div>
            {fieldErrors.slug && <p className="text-xs text-red-400 mt-1">{fieldErrors.slug}</p>}
          </label>
          <label className="block">
            <span className="text-xs text-zinc-500 mb-1 block">Excerpt (EN)</span>
            <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} className={`${inputCls} min-h-[70px]`} placeholder="Short excerpt for list & SEO" />
          </label>
          <div className="block">
            <span className="text-xs text-zinc-500 mb-1 block">Content (EN)</span>
            <BlogEditor value={content} onChange={setContent} placeholder="Write content (EN)…" />
          </div>
        </>
      ) : (
        <>
          <label className="block">
            <span className="text-xs text-zinc-500 mb-1 block">عنوان (FA)</span>
            <input value={titleFa} onChange={e => setTitleFa(e.target.value)} className={inputCls} dir="rtl" placeholder="عنوان فارسی" style={{ fontFamily: 'var(--font-vazirmatn)' }} />
          </label>
          <label className="block">
            <span className="text-xs text-zinc-500 mb-1 block">نامک (FA slug)</span>
            <div className="flex gap-2">
              <input value={slugFa} onChange={e => setSlugFa(e.target.value)} className={inputCls} dir="ltr" placeholder="fa-slug (optional)" />
              <button type="button" onClick={() => setSlugFa(slugify(titleFa))} className="px-3 py-2 text-xs border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 shrink-0">از عنوان</button>
            </div>
          </label>
          <label className="block">
            <span className="text-xs text-zinc-500 mb-1 block">خلاصه (FA)</span>
            <textarea value={excerptFa} onChange={e => setExcerptFa(e.target.value)} className={inputCls + ' min-h-[70px]'} dir="rtl" placeholder="خلاصه فارسی" style={{ fontFamily: 'var(--font-vazirmatn)' }} />
          </label>
          <div className="block">
            <span className="text-xs text-zinc-500 mb-1 block">محتوا (FA)</span>
            <BlogEditor value={contentFa} onChange={setContentFa} placeholder="متن فارسی را بنویسید…" />
          </div>
        </>
      )}

      <label className="block">
        <span className="text-xs text-zinc-500 mb-1 block">Tags (comma separated)</span>
        <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} className={inputCls} placeholder="DevOps, Jitsi, Frontend" />
      </label>

      <label className="block">
        <span className="text-xs text-zinc-500 mb-1 block">Cover image</span>
        <div className="flex gap-2 items-start">
          <input value={coverUrl} onChange={e => setCoverUrl(e.target.value)} className={inputCls} dir="ltr" placeholder="https://… or upload" />
          <label className="px-3 py-2 text-xs border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer shrink-0">
            {uploading ? `${uploadProgress}%` : 'Upload'}
            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadCover(f); e.target.value = '' }} />
          </label>
        </div>
        {uploading && <div className="mt-2 h-1 bg-zinc-800 overflow-hidden"><div className="h-full bg-zinc-100 transition-[width] duration-200" style={{ width: `${uploadProgress}%` }} /></div>}
        {coverUrl && <img src={coverUrl} alt="cover preview" className="mt-2 h-28 object-cover border border-zinc-800" />}
        {coverPublicId && <div className="text-[10px] text-zinc-600 mt-1 font-mono">{coverPublicId}</div>}
      </label>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs text-zinc-500 mb-1 block">SEO title</span>
          <input value={metaTitle} onChange={e => setMetaTitle(e.target.value)} className={inputCls} placeholder="Fallback to title" />
        </label>
        <label className="block">
          <span className="text-xs text-zinc-500 mb-1 block">SEO description</span>
          <input value={metaDescription} onChange={e => setMetaDescription(e.target.value)} className={inputCls} placeholder="Fallback to excerpt" />
        </label>
      </div>

      <label className="block">
        <span className="text-xs text-zinc-500 mb-1 block">Status</span>
        <select value={status} onChange={e => setStatus(e.target.value as any)} className={inputCls}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </label>

      <div className="flex items-center gap-3 pt-2">
        <button onClick={save} disabled={saving} className="px-6 py-2.5 text-sm bg-zinc-100 text-zinc-900 hover:bg-white disabled:opacity-50">
          {saving ? 'Saving…' : post ? 'Save changes' : 'Create post'}
        </button>
        {post && <span className={`text-xs ${post.status === 'published' ? 'text-emerald-400' : 'text-zinc-500'}`}>{post.status === 'published' ? 'Published' : 'Draft'}</span>}
      </div>
    </div>
  )
}
