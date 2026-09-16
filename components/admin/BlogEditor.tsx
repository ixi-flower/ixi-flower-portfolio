'use client'
import { memo, useMemo, useRef, useState } from 'react'
import { useEditor, EditorContent, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import MarkdownIt from 'markdown-it'
import { Extension, elementFromString } from '@tiptap/core'
import { DOMParser } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { uploadFile } from '@/lib/upload'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code,
  Link2, ImagePlus, Table as TableIcon, Undo2, Redo2, Minus,
  AlignRight, AlignCenter, AlignLeft, RemoveFormatting,
  ArrowUpToLine, ArrowDownToLine, ArrowRightToLine, ArrowLeftToLine,
  Trash2, Plus, Upload, ListChecks,
} from 'lucide-react'

interface Props { value: string; onChange: (html: string) => void; placeholder?: string }

const md = new MarkdownIt()
const mdLike = /(^|\n)(#{1,6}[ \t]|[>*+-][ \t]|\d+[.)][ \t]|```|~~~|[-*_]{3,}[ \t]*$|\[[^\]]*\]\([^)]*\)|\*\*|~~)/m

const MarkdownPaste = Extension.create({
  name: 'markdownPaste',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('markdownPaste'),
        props: {
          handlePaste(view, event) {
            const text = event.clipboardData?.getData('text/plain')
            if (!text || !mdLike.test(text)) return false
            const html = md.render(text)
            const slice = DOMParser.fromSchema(view.state.schema).parseSlice(elementFromString(html), { preserveWhitespace: true })
            view.dispatch(view.state.tr.replaceSelection(slice))
            return true
          },
        },
      }),
    ]
  },
})

const TextDirection = Extension.create({
  name: 'textDirection',
  addGlobalAttributes() {
    return [
      {
        types: ['heading', 'paragraph', 'blockquote', 'codeBlock', 'listItem', 'taskItem'],
        attributes: {
          dir: {
            default: null,
            parseHTML: (el: HTMLElement) => el.getAttribute('dir'),
            renderHTML: (attrs: Record<string, unknown>) => {
              const d = attrs.dir as string | null
              if (!d) return {}
              return { dir: d }
            },
          },
        },
      },
    ]
  },
})

const toolBtn = (active: boolean) =>
  `inline-flex items-center justify-center h-8 min-w-8 px-1.5 border text-zinc-400 transition-colors active:scale-[0.97] ${
    active ? '!text-zinc-100 !border-zinc-500 bg-zinc-800' : 'border-zinc-800 hover:text-zinc-100 hover:bg-zinc-800 hover:border-zinc-700'
  }`

function Btn({ onClick, active = false, disabled = false, title, children }: { onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title} aria-label={title}
      className={`${toolBtn(active)} disabled:opacity-30 disabled:pointer-events-none`}>
      {children}
    </button>
  )
}

export default memo(function BlogEditor({ value, onChange, placeholder }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  const extensions = useMemo(() => [
    StarterKit.configure({}),
    MarkdownPaste,
    TextDirection,
    Underline,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
    Image.configure({ allowBase64: false }),
    Table.configure({ resizable: true }),
    TableRow, TableCell, TableHeader,
    TaskList,
    TaskItem.configure({ nested: true }),
    Placeholder.configure({ placeholder: placeholder || 'Write content…' }),
  ], [placeholder])

  const editor = useEditor({
    immediatelyRender: false, autofocus: false, extensions, content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const is = (type: string, attrs?: Record<string, unknown>) => !!e?.isActive(type, attrs)
      const isAlign = (a: string) => !!e?.isActive({ textAlign: a })
      const getDir = (): string | null => {
        if (!e) return null
        const a = (t: string) => (e.getAttributes(t).dir as string | null) ?? null
        return a('paragraph') || a('heading') || a('blockquote') || a('codeBlock') || a('listItem') || a('taskItem') || null
      }
      return {
        isBold: is('bold'), isItalic: is('italic'), isUnderline: is('underline'), isStrike: is('strike'),
        isH1: is('heading', { level: 1 }), isH2: is('heading', { level: 2 }), isH3: is('heading', { level: 3 }),
        isBullet: is('bulletList'), isOrdered: is('orderedList'), isTaskList: is('taskList'), isQuote: is('blockquote'), isCode: is('codeBlock'),
        isLink: is('link'), isTable: is('table'),
        isAlignRight: isAlign('right'), isAlignCenter: isAlign('center'), isAlignLeft: isAlign('left'),
        canUndo: !!e?.can().undo(), canRedo: !!e?.can().redo(),
        curDir: getDir(),
      }
    },
  })

  if (!editor || !state) return null
  const cmd = editor.chain().focus()

  const toggleLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined
    const url = prompt('Link URL (https://…):', prev || '')?.trim()
    if (url === undefined) return
    if (!url) cmd.unsetLink().run()
    else cmd.setLink({ href: url }).run()
  }
  const insertImageUrl = () => {
    const url = prompt('Image URL:')?.trim()
    if (url) cmd.setImage({ src: url, alt: '' }).run()
  }
  const uploadImage = async (file: File) => {
    setUploading(true); setProgress(0); setError('')
    try {
      const url = await uploadFile(file, setProgress)
      cmd.setImage({ src: url, alt: '' }).run()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally { setUploading(false) }
  }

  function setDir(dir: 'rtl' | 'ltr' | null) {
    if (!editor) return
    const attrs = dir ? { dir } : { dir: null }
    const e: any = editor
    e.chain().focus().updateAttributes('paragraph', attrs).updateAttributes('heading', attrs).updateAttributes('blockquote', attrs).updateAttributes('codeBlock', attrs).updateAttributes('listItem', attrs).updateAttributes('taskItem', attrs).run()
  }

  return (
    <div className="tiptap-editor border border-zinc-800 bg-zinc-950 overflow-hidden">
      {error && <div className="border-b border-red-900/50 bg-red-950/30 text-red-300 text-xs px-3 py-2">{error}</div>}
      <div className="flex flex-wrap items-center gap-1 p-1.5 border-b border-zinc-800 bg-zinc-900">
        <Btn title="Undo" disabled={!state.canUndo} onClick={() => cmd.undo().run()}><Undo2 size={14} /></Btn>
        <Btn title="Redo" disabled={!state.canRedo} onClick={() => cmd.redo().run()}><Redo2 size={14} /></Btn>
        <span className="w-px h-5 bg-zinc-800 mx-1" />
        <Btn title="Bold" active={state.isBold} onClick={() => cmd.toggleBold().run()}><Bold size={14} /></Btn>
        <Btn title="Italic" active={state.isItalic} onClick={() => cmd.toggleItalic().run()}><Italic size={14} /></Btn>
        <Btn title="Underline" active={state.isUnderline} onClick={() => cmd.toggleUnderline().run()}><UnderlineIcon size={14} /></Btn>
        <Btn title="Strike" active={state.isStrike} onClick={() => cmd.toggleStrike().run()}><Strikethrough size={14} /></Btn>
        <span className="w-px h-5 bg-zinc-800 mx-1" />
        <Btn title="H1" active={state.isH1} onClick={() => cmd.toggleHeading({ level: 1 }).run()}><Heading1 size={14} /></Btn>
        <Btn title="H2" active={state.isH2} onClick={() => cmd.toggleHeading({ level: 2 }).run()}><Heading2 size={14} /></Btn>
        <Btn title="H3" active={state.isH3} onClick={() => cmd.toggleHeading({ level: 3 }).run()}><Heading3 size={14} /></Btn>
        <Btn title="Bullet list" active={state.isBullet} onClick={() => cmd.toggleBulletList().run()}><List size={14} /></Btn>
        <Btn title="Ordered list" active={state.isOrdered} onClick={() => cmd.toggleOrderedList().run()}><ListOrdered size={14} /></Btn>
        <Btn title="Checklist" active={state.isTaskList} onClick={() => cmd.toggleTaskList().run()}><ListChecks size={14} /></Btn>
        <Btn title="Quote" active={state.isQuote} onClick={() => cmd.toggleBlockquote().run()}><Quote size={14} /></Btn>
        <Btn title="Code block" active={state.isCode} onClick={() => cmd.toggleCodeBlock().run()}><Code size={14} /></Btn>
        <Btn title="Divider" onClick={() => cmd.setHorizontalRule().run()}><Minus size={14} /></Btn>
        <span className="w-px h-5 bg-zinc-800 mx-1" />
        <Btn title="Align right" active={state.isAlignRight} onClick={() => cmd.setTextAlign('right').run()}><AlignRight size={14} /></Btn>
        <Btn title="Align center" active={state.isAlignCenter} onClick={() => cmd.setTextAlign('center').run()}><AlignCenter size={14} /></Btn>
        <Btn title="Align left" active={state.isAlignLeft} onClick={() => cmd.setTextAlign('left').run()}><AlignLeft size={14} /></Btn>
        <Btn title="Direction: RTL (فارسی)" active={state.curDir === 'rtl'} onClick={() => setDir(state.curDir === 'rtl' ? null : 'rtl')}><span className="text-[11px] font-bold font-mono leading-none px-0.5">RTL</span></Btn>
        <Btn title="Direction: LTR" active={state.curDir === 'ltr'} onClick={() => setDir(state.curDir === 'ltr' ? null : 'ltr')}><span className="text-[11px] font-bold font-mono leading-none px-0.5">LTR</span></Btn>
        <span className="w-px h-5 bg-zinc-800 mx-1" />
        <Btn title="Link" active={state.isLink} onClick={toggleLink}><Link2 size={14} /></Btn>
        <Btn title="Image URL" onClick={insertImageUrl}><ImagePlus size={14} /></Btn>
        <Btn title="Upload image" onClick={() => fileRef.current?.click()}>{uploading ? `${progress}%` : <Upload size={14} />}</Btn>
        <span className="w-px h-5 bg-zinc-800 mx-1" />
        <Btn title="Insert table" active={state.isTable} onClick={() => cmd.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon size={14} /></Btn>
        {state.isTable && (
          <>
            <Btn title="Row above" onClick={() => cmd.addRowBefore().run()}><ArrowUpToLine size={14} /></Btn>
            <Btn title="Row below" onClick={() => cmd.addRowAfter().run()}><ArrowDownToLine size={14} /></Btn>
            <Btn title="Col right" onClick={() => cmd.addColumnAfter().run()}><ArrowRightToLine size={14} /></Btn>
            <Btn title="Col left" onClick={() => cmd.addColumnBefore().run()}><ArrowLeftToLine size={14} /></Btn>
            <Btn title="Delete row" onClick={() => cmd.deleteRow().run()}><Minus size={14} /></Btn>
            <Btn title="Delete col" onClick={() => cmd.deleteColumn().run()}><Plus size={14} className="rotate-45" /></Btn>
            <Btn title="Delete table" onClick={() => cmd.deleteTable().run()}><Trash2 size={14} /></Btn>
          </>
        )}
        <span className="w-px h-5 bg-zinc-800 mx-1" />
        <Btn title="Clear formatting" onClick={() => cmd.unsetAllMarks().clearNodes().run()}><RemoveFormatting size={14} /></Btn>
      </div>
      {uploading && (
        <div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} className="h-1 bg-zinc-900 overflow-hidden">
          <div className="h-full bg-zinc-100 transition-[width] duration-200" style={{ width: `${progress}%` }} />
        </div>
      )}
      <div className="blog-content">
        <EditorContent editor={editor} />
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = '' }} />
    </div>
  )
})
