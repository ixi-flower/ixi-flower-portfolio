"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type ApiPost = {
  id: string; slug: string; slugFa: string | null; title: string; titleFa: string | null;
  excerpt: string | null; excerptFa: string | null; content: string; contentFa: string | null;
  coverUrl: string | null; status: string; publishedAt: string | null; createdAt: string;
  tags?: { id: number; slug: string; name: string }[];
};

function fmtDate(p: ApiPost) {
  const s = p.publishedAt || p.createdAt;
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function readTime(p: ApiPost) {
  return `${Math.max(1, Math.ceil((p.content || "").length / 900))} min read`;
}

export default function BlogsPage() {
  const [posts, setPosts] = useState<ApiPost[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/blog?perPage=100", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setPosts(j.posts ?? []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = (posts ?? []).filter((p) => {
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    return p.title.toLowerCase().includes(needle) || (p.excerpt ?? "").toLowerCase().includes(needle) || (p.tags ?? []).some((t) => t.name.toLowerCase().includes(needle));
  });

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-200 p-3 font-mono">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4">
          <Link href="/">
            <span className="inline-flex items-center gap-1 h-10 px-4 text-xs border border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 rounded-none">
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>{" "}
              cd ..
            </span>
          </Link>
          <h1 className="text-xl font-bold mt-3 text-zinc-100">
            ~/blogs<span className="animate-pulse">_</span>
          </h1>
          <div className="flex items-center text-xs mt-2">
            <span className="text-zinc-500 mr-1">$</span>
            <span className="text-zinc-300 font-medium">ls -la ~/blogs --all | cat</span>
            <span className="animate-pulse ml-1 text-zinc-300">_</span>
          </div>
        </div>

        <div className="text-center mb-4 text-zinc-600 hidden md:block">
          <pre className="text-xs leading-tight">
{`
+----------------------------------------------------------------------+
|                                                                      |
|                         BLOG ARCHIVE                                 |
|                                                                      |
+----------------------------------------------------------------------+
`}
          </pre>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <span className="text-xs text-zinc-500 font-mono">
            {loading ? "loading…" : `${filtered.length} posts`}
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="grep -i 'keyword' …"
            className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 w-56 font-mono"
          />
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500 font-mono py-12 text-center animate-pulse">$ loading posts…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-zinc-600 font-mono py-12 text-center">no posts found{posts?.length ? " for that query" : ""}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((p) => (
              <Link
                key={p.id}
                href={`/blogs/${encodeURIComponent(p.slug)}`}
                className="text-left border border-zinc-800 bg-zinc-900/50 p-3 hover:border-zinc-600 hover:bg-zinc-800/50 transition-colors relative group block"
              >
                <span className="absolute top-0 left-0 text-zinc-700 text-[8px] leading-none pointer-events-none"><pre>+--</pre></span>
                <span className="absolute bottom-0 right-0 text-zinc-700 text-[8px] leading-none pointer-events-none"><pre>--+</pre></span>
                {p.coverUrl && (
                  <div className="aspect-video w-full bg-zinc-950 border border-zinc-800 overflow-hidden mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.coverUrl} alt={p.title} className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
                <h3 className="text-sm font-medium text-zinc-200 group-hover:text-white pr-4 line-clamp-2">
                  {p.title}
                  <span className="ml-2 text-[10px] text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">$ cat →</span>
                </h3>
                <div className="flex items-center gap-1 mt-1.5 text-[10px] text-zinc-500">
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect width={18} height={18} x={3} y={4} rx={2} />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>{" "}
                  {fmtDate(p)} · {readTime(p)}
                </div>
                {p.excerpt && <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2">{p.excerpt}</p>}
                {(p.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.tags!.slice(0, 3).map((t) => (
                      <span key={t.id} className="text-[10px] px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-none">
                        {t.name}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        <div className="text-center text-[10px] text-zinc-600 mt-8 font-mono">© 2026 ixiflower — crafted with Next.js · terminal soul · code & coffee</div>
      </div>
    </main>
  );
}
