"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Tag = { id: number; slug: string; name: string };
type Post = {
  id: string;
  slug: string;
  slugFa: string | null;
  title: string;
  titleFa: string | null;
  excerpt: string | null;
  excerptFa: string | null;
  content: string | null;
  contentFa: string | null;
  coverUrl: string | null;
  publishedAt: Date | string | null;
  createdAt: Date | string;
};

function getFp(): string {
  let v = localStorage.getItem("ixi_fp");
  if (!v) {
    v = `fp-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
    localStorage.setItem("ixi_fp", v);
  }
  return v;
}

export default function BlogDetailClient({ post, tags, hasFa }: { post: Post; tags: Tag[]; hasFa: boolean }) {
  const [lang, setLang] = useState<"en" | "fa">("en");
  const api = post;
  const postId = api.id;
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [mine, setMine] = useState<"like" | "dislike" | null>(null);
  const [reacting, setReacting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const slug = lang === "fa" && api.slugFa ? api.slugFa : api.slug;
  const title = lang === "fa" && api.titleFa ? api.titleFa : api.title;
  const excerpt = lang === "fa" && api.excerptFa ? api.excerptFa : api.excerpt;
  const html = lang === "fa" && api.contentFa ? api.contentFa : api.content;
  const faActive = lang === "fa";
  const displayDate = new Date(api.publishedAt || api.createdAt).toLocaleDateString(lang === "fa" ? "fa-IR" : "en-US", { year: "numeric", month: "short", day: "numeric" });
  const readTime = `${Math.max(1, Math.ceil((html?.length || 600) / 900))} min read`;

  useEffect(() => {
    fetch(`/api/blog/reactions?postId=${postId}`, { headers: { "x-fingerprint": getFp() } })
      .then((r) => r.json())
      .then((j) => {
        if (typeof j.likes === "number") setLikes(j.likes);
        if (typeof j.dislikes === "number") setDislikes(j.dislikes);
        if (j.mine) setMine(j.mine);
      })
      .catch(() => {});
  }, [postId]);

  async function react(kind: "like" | "dislike") {
    if (reacting) return;
    setReacting(true);
    try {
      const r = await fetch("/api/blog/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-fingerprint": getFp() },
        body: JSON.stringify({ postId, kind, fingerprint: getFp() }),
      });
      const j = await r.json();
      if (r.ok) {
        setLikes(j.likes ?? 0);
        setDislikes(j.dislikes ?? 0);
        setMine(j.mine ?? null);
      }
    } catch {}
    setReacting(false);
  }

  // Copy button injection: mirror the BlogModal logic (globals.css targets .blog-content pre)
  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;
    const pres = root.querySelectorAll("pre");
    pres.forEach((pre) => {
      if (pre.querySelector(".code-copy-btn")) return;
      const btn = document.createElement("button");
      btn.textContent = "Copy";
      btn.className = "code-copy-btn";
      btn.type = "button";
      btn.addEventListener("click", async () => {
        const code = pre.querySelector("code")?.textContent ?? pre.textContent ?? "";
        await navigator.clipboard.writeText(code).catch(() => {});
        btn.textContent = "✓ Copied";
        btn.classList.add("copied");
        setTimeout(() => {
          btn.textContent = "Copy";
          btn.classList.remove("copied");
        }, 1400);
      });
      pre.appendChild(btn);
    });
  }, [html]);

  return (
    <>
      {/* EN / FA + terminal line */}
      <div className="px-3 sm:px-4 py-2 border-b border-zinc-800 bg-zinc-950 font-mono text-[10px] sm:text-[11px] leading-5 flex flex-col gap-1.5">
        <div className="text-zinc-500">$ cat ~/blogs/{slug}.md | cat — {readTime}</div>
        <div className="flex items-center justify-between gap-2">
          <div role="tablist" aria-label="Language" className="inline-flex border border-zinc-700 overflow-hidden">
            <button role="tab" aria-selected={lang === "en"} onClick={() => setLang("en")} className={`px-3 py-1 text-xs font-mono transition-colors ${lang === "en" ? "bg-zinc-100 text-zinc-900" : "bg-zinc-900 text-zinc-500 hover:text-zinc-300"}`}>
              EN
            </button>
            <button role="tab" aria-selected={lang === "fa"} onClick={() => setLang("fa")} className={`px-3 py-1 text-xs transition-colors ${lang === "fa" ? "bg-zinc-100 text-zinc-900 font-[var(--font-vazirmatn)]" : "bg-zinc-900 text-zinc-500 hover:text-zinc-300 font-[var(--font-vazirmatn)]"}`}>
              FA
            </button>
          </div>
          <span className="text-zinc-600 font-mono text-[11px] hidden sm:inline">{displayDate}</span>
        </div>
      </div>

      {/* title */}
      <div className="px-4 sm:px-6 pt-5 pb-3">
        <h1 className={`text-lg sm:text-xl font-bold text-zinc-100 leading-tight ${faActive ? "font-[var(--font-vazirmatn)] text-right" : ""}`} dir={faActive ? "rtl" : "ltr"}>{title}</h1>
        {excerpt && (
          <p className={`mt-2 text-sm text-zinc-400 border-l-2 border-zinc-700 pl-3 ${faActive ? "font-[var(--font-vazirmatn)] text-right border-r-2 border-l-0 pr-3" : ""}`} dir={faActive ? "rtl" : "ltr"}>{excerpt}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
          <span>{displayDate} · {readTime}</span>
          {tags.map((t) => (
            <span key={t.id} className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300">#{t.name}</span>
          ))}
        </div>
      </div>

      {/* content via blog-content (matches globals.css + modal) */}
      <div className="px-4 sm:px-6 pb-4">
        <div
          ref={contentRef}
          dir={faActive ? "rtl" : "ltr"}
          className={`blog-content ${faActive ? "font-[var(--font-vazirmatn)] text-right leading-[1.95] text-[13px] sm:text-[15px]" : "text-[13px] sm:text-sm"}`}
          dangerouslySetInnerHTML={{ __html: html || `<p class="text-zinc-500">No content.</p>` }}
        />
      </div>

      {/* actions */}
      <div className="px-4 sm:px-6 py-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2 bg-zinc-900">
        <Link href="/blogs" className="text-xs px-3 py-1.5 border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700">← All posts</Link>
        <span className="flex items-center gap-1.5">
          <button disabled={reacting} onClick={() => react("like")} className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border transition-colors ${mine === "like" ? "bg-emerald-500 text-zinc-950 border-emerald-500" : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"}`}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill={mine === "like" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={mine === "like" ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-2l-1.33-6.66A2 2 0 0 0 16.96 11H14z" /><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" /></svg> {likes}
          </button>
          <button disabled={reacting} onClick={() => react("dislike")} className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border transition-colors ${mine === "dislike" ? "bg-red-500 text-white border-red-500" : "border-zinc-700 text-zinc-400 hover:bg-zinc-800"}`}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill={mine === "dislike" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={mine === "dislike" ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 2l1.33 6.66A2 2 0 0 0 7.04 13H10z" /><path d="M17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" /></svg> {dislikes}
          </button>
        </span>
      </div>
    </>
  );
}
