"use client";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";

// --- DATA (yours, editable) ---
const PROFILE = {
  handle: "ixi_flower_",
  title: "Full-Stack Developer",
  name: "Amirabbas Rouintan",
  bio: "Self-taught software engineer from Iran. Specializing in Next.js, TypeScript, Python & Go — I build fast web apps, Telegram bots, trading systems and self-hosted infra. Obsessed with clean UIs, automation, and shipping real products.",
  avatar: "/avatar.jpg",
  socials: [
    { label: "GitHub", href: "https://github.com/ixiflower", icon: "github", command: "open github" },
    { label: "Twitter", href: "https://x.com/ixi_flower0", icon: "twitter", command: "open twitter" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/amirabbas-rouintan", icon: "linkedin", command: "open linkedin" },
    { label: "Email", href: "mailto:amirabbas.rouintan2007@gmail.com", icon: "mail", command: "send email" },
  ] as const,
};

const GIT_STATS = { repos: 46, stars: 10, followers: 7, commits: 1247 };

const TECH = [
  { name: "TypeScript", yrs: "3+ yrs", level: "Advanced", color: "#3178c6", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg" },
  { name: "React", yrs: "3+ yrs", level: "Advanced", color: "#00d8ff", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg" },
  { name: "Next.js", yrs: "2+ yrs", level: "Advanced", color: "#000000", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg", invert: true },
  { name: "Tailwind", yrs: "2+ yrs", level: "Advanced", color: "#06b6d4", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg" },
  { name: "Python", yrs: "3+ yrs", level: "Advanced", color: "#3776ab", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg" },
  { name: "Node.js", yrs: "5+ yrs", level: "Advanced", color: "#339933", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg" },
  { name: "Go", yrs: "1+ yrs", level: "Intermediate", color: "#00add8", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/go/go-original.svg" },
  { name: "Docker", yrs: "2+ yrs", level: "Intermediate", color: "#2496ed", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg" },
  { name: "PostgreSQL", yrs: "2+ yrs", level: "Intermediate", color: "#336791", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg" },
  { name: "MongoDB", yrs: "2+ yrs", level: "Intermediate", color: "#47a248", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-original.svg" },
  { name: "Bun", yrs: "1+ yrs", level: "Intermediate", color: "#fbf0df", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/bun/bun-original.svg" },
];

const WAKA = {
  total: "1,847h 32m",
  daily: "3 hrs 12 mins",
  codingSince: "2019",
  age: "17 (born 2007)",
  langs: [
    { name: "TypeScript", pct: 42 },
    { name: "Python", pct: 31 },
    { name: "JavaScript", pct: 9 },
    { name: "Go", pct: 7 },
    { name: "Others", pct: 11 },
  ],
};

const PLAYLIST = [
  { title: "AYNEH", artist: "Bahram", dur: "3:16" },
  { title: "Enfejare Rangha", artist: "Bahram", dur: "4:02" },
  { title: "Gole Sorkh", artist: "Bahram", dur: "3:48" },
  { title: "Goosht", artist: "Bahram", dur: "2:59" },
  { title: "Ki Ba Ma Zooze Mikeshe", artist: "Bahram", dur: "3:21" },
  { title: "MOMKEN", artist: "Bahram", dur: "3:44" },
  { title: "Mikhoonim Vase Taghia", artist: "Bahram", dur: "4:11" },
  { title: "Saeghe", artist: "Bahram", dur: "3:33" },
  { title: "Shabe Sarde Kalanshahr", artist: "Bahram", dur: "3:57" },
  { title: "YE CHIZI MORD", artist: "Bahram", dur: "3:08" },
];

const REPOS = [
  { name: "jitsi-infinity", desc: "Jitsi Meet on Docker with custom Python auto-scaler — production-ready autoscaling, Jibri, recording.", lang: "Python", stars: 3, forks: 1 },
  { name: "shopify-frost", desc: "A headless Shopify Hydrogen storefront with glassmorphism design and full cart/checkout.", lang: "TypeScript", stars: 1, forks: 0 },
  { name: "trademind-bot", desc: "AI-powered trading signal bot for Pocket Option & binary options — 8-factor scoring.", lang: "Python", stars: 1, forks: 1 },
  { name: "ixi-News-BOT", desc: "Persian news bot — fetches and delivers the latest headlines via Telegram.", lang: "Python", stars: 1, forks: 0 },
];

type LegacyBlog = { slug: string; title: string; date: string; excerpt: string; tag: string; readTime: string; content: string[] };
type ApiPost = {
  id: string; slug: string; slugFa: string | null; title: string; titleFa: string | null;
  excerpt: string | null; excerptFa: string | null; content: string; contentFa: string | null;
  coverUrl: string | null; coverPublicId?: string | null; status: string; publishedAt: string | null; createdAt: string; updatedAt?: string;
  tags?: { id: number; slug: string; name: string }[];
};
type Blog = LegacyBlog | ApiPost;
const BLOGS: LegacyBlog[] = [
  {
    slug: "deploying-jitsi-meet-at-scale",
    title: "Deploying Jitsi Meet at Scale",
    date: "Mar 11, 2026",
    excerpt: "How I autoscale Jitsi + Jibri on a single VPS with Python.",
    tag: "DevOps",
    readTime: "5 min read",
    content: [
      "# Deploying Jitsi Meet at Scale",
      "",
      "> How I autoscale Jitsi + Jibri on a single VPS with Python — no Kubernetes needed.",
      "",
      "```python",
      "# autoscaler.py — watches jvb load + spawns JVBs via Docker",
      "import docker, time",
      "client = docker.from_env()",
      "",
      "THRESHOLD = 180  # participants per JVB",
      "def scale():",
      "    load = get_jvb_load()",
      "    if load > THRESHOLD:",
      "        client.containers.run(",
      "            'jitsi/jvb:latest', detach=True,",
      "            network='jitsi_meet', environment={'JVB_OPTS': '--apis=rest'}",
      "        )",
      "        print(f'[scale] +1 JVB  load={load}')",
      "",
      "while True:",
      "    scale()",
      "    time.sleep(15)",
      "```",
      "",
      "### Why not Kubernetes?",
      "- Single €12 VPS handles 300+ participants with 2 JVBs + Jibri.",
      "- Docker + Python is 30 lines vs 300 lines of Helm.",
      "- Jibri recording just works — no sidecar hell.",
      "",
      "### Stack",
      "`Next.js` frontend → `Prosody` → `Jicofo` → `n× JVB` → `Jibri` → `MinIO`",
      "",
      "Full repo: `github.com/ixiflower/jitsi-infinity` — PRs welcome.",
    ],
  },
  {
    slug: "headless-shopify-hydrogen",
    title: "Headless Shopify with Hydrogen",
    date: "Feb 28, 2026",
    excerpt: "Building a glassmorphism storefront with Shopify Hydrogen + Tailwind.",
    tag: "Frontend",
    readTime: "4 min read",
    content: [
      "# Headless Shopify with Hydrogen",
      "",
      "> Oxygen, Remix, and glass — how I shipped shopify-frost in a weekend.",
      "",
      "```tsx",
      "// app/routes/products.$handle.tsx",
      "export async function loader({ params }: LoaderArgs) {",
      "  return await storefront.query(PRODUCT_QUERY, { variables: { handle: params.handle } });",
      "}",
      "export default function Product() {",
      "  const { product } = useLoaderData<typeof loader>();",
      "  return <GlassCard product={product} />;",
      "}",
      "```",
      "",
      "Hydrogen on Oxygen is stupid fast — 80ms TTFB from edge.",
    ],
  },
];

type Project = { title: string; tags: string[]; demo: string; status: "Active"; img?: string; iframe?: string; source?: string };
const PROJECTS: Project[] = [
  {
    title: "FilmShab",
    iframe: "https://filmshab.ir",
    // screenshot you pasted — save it as public/filmshab-preview.jpg (falls back to unsplash if missing)
    img: "/filmshab-preview.jpg",
    tags: ["Next.js", "Drizzle", "Cinema"],
    demo: "https://filmshab.ir",
    status: "Active",
  },
  {
    title: "Storipalorium",
    iframe: "https://storipalorium.vercel.app",
    tags: ["Next.js", "Minimal", "Story"],
    demo: "https://storipalorium.vercel.app",
    status: "Active",
  },
];

function ProjectCard({ p }: { p: Project }) {
  const [imgFailed, setImgFailed] = useState(false);
  const hasIframe = !!p.iframe;
  const hasImg = !!p.img;
  // filmshab.ir sends X-Frame-Options: SAMEORIGIN → iframe always blank → show image fallback directly
  const iframeBlocked = p.title === "FilmShab" && hasIframe;

  return (
    <div className="group relative overflow-hidden border border-zinc-800 bg-zinc-900 hover:border-zinc-700 transition-colors">
      <div className="relative h-[170px] bg-zinc-950 overflow-hidden">
        {hasIframe && !iframeBlocked ? (
          <iframe
            src={p.iframe}
            title={p.title}
            className="w-[200%] h-[200%] origin-top-left scale-50 border-0 pointer-events-none"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        ) : hasImg && !imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.img}
            alt={p.title}
            className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity"
            onError={() => setImgFailed(true)}
          />
        ) : hasImg && imgFailed ? (
          // ultimate fallback if /filmshab-preview.jpg not yet saved
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80"
            alt={p.title}
            className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity"
          />
        ) : null}
        {iframeBlocked && !imgFailed && (
          <div className="absolute inset-0 flex items-end justify-center pb-2 pointer-events-none">
            <span className="text-[9px] text-zinc-300 border border-zinc-600 bg-zinc-900/80 px-2 py-0.5">iframe blocked — showing preview image</span>
          </div>
        )}
        <div className="absolute top-0 left-0 bg-zinc-900/80 px-2 py-1 text-[10px] text-green-400">{p.status}</div>
        <div className="absolute top-0 right-0 bg-zinc-900/80 p-1 text-zinc-400">
          <IconGithub className="h-3 w-3" />
        </div>
        <a href={p.demo} target="_blank" rel="noopener noreferrer" className="absolute inset-0" aria-label={`Open ${p.title}`} />
      </div>
      <div className="p-2">
        <h3 className="font-bold text-sm text-zinc-100">{p.title}</h3>
        <div className="flex flex-wrap gap-1 mt-1">
          {p.tags.map((t) => (
            <span key={t} className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 text-[10px] rounded-none">
              {t}
            </span>
          ))}
        </div>
        <div className="flex gap-2 mt-2 text-[10px]">
          {p.source && (
            <a href={p.source} target="_blank" className="text-zinc-400 hover:text-zinc-200 flex items-center gap-1">
              Source
            </a>
          )}
          {p.source && p.demo && <span className="text-zinc-600">|</span>}
          <a href={p.demo} target="_blank" className="text-zinc-400 hover:text-zinc-200 flex items-center gap-1">
            Demo
          </a>
        </div>
      </div>
    </div>
  );
}

// ---- tiny icons ----
function IconGithub(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}
function IconTwitter(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={props.className}>
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  );
}
function IconLinkedin(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={props.className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width={4} height={12} x={2} y={9} />
      <circle cx={4} cy={4} r={2} />
    </svg>
  );
}
function IconMail(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={props.className}>
      <rect width={20} height={16} x={2} y={4} rx={2} />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}
const iconMap: Record<string, React.FC<{ className?: string }>> = {
  github: IconGithub,
  twitter: IconTwitter,
  linkedin: IconLinkedin,
  mail: IconMail,
};

// ---- blog helpers ----
function BlogCode({ lines }: { lines: string[] }) {
  const [typed, setTyped] = useState("");
  const [done, setDone] = useState(false);
  const full = lines.join("\n");

  useEffect(() => {
    setTyped("");
    setDone(false);
    let i = 0;
    const t = setInterval(() => {
      i += 2;
      setTyped(full.slice(0, i));
      if (i >= full.length) { clearInterval(t); setDone(true); }
    }, 12);
    return () => clearInterval(t);
  }, [full]);

  return (
    <pre className="bg-zinc-950 border border-zinc-800 p-2 sm:p-3 text-[10px] sm:text-[11px] leading-[1.65] overflow-x-auto text-zinc-300 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
      <code>{typed}</code>
      {!done && <span className="inline-block w-1.5 sm:w-2 h-3 sm:h-4 bg-zinc-400 animate-pulse ml-0.5 align-middle" />}
    </pre>
  );
}

function isLegacyBlog(b: Blog): b is LegacyBlog {
  return Array.isArray((b as any).content);
}

function BlogModal({ blog, onClose }: { blog: Blog | null; onClose: () => void }) {
  const [lang, setLang] = useState<"en" | "fa">("en");
  const isLegacy = blog ? isLegacyBlog(blog) : false;
  const api = !isLegacy && blog ? (blog as ApiPost) : null;
  const legacy = isLegacy && blog ? (blog as LegacyBlog) : null;

  // display values (FA falls back to EN)
  const displaySlug = api ? (lang === "fa" && api.slugFa ? api.slugFa : api.slug) : legacy?.slug ?? "";
  const displayTitle = api ? (lang === "fa" && api.titleFa ? api.titleFa : api.title) : legacy?.title ?? "";
  const displayExcerpt = api ? (lang === "fa" && api.excerptFa ? api.excerptFa : api.excerpt) ?? "" : legacy?.excerpt ?? "";
  const displayContentHtml = api ? (lang === "fa" && api.contentFa ? api.contentFa : api.content) : "";
  const displayTag = api ? (api.tags?.[0]?.name ?? "Blog") : legacy?.tag ?? "Blog";
  const displayDate = legacy?.date
    ? legacy.date
    : api
      ? new Date(api.publishedAt || api.createdAt).toLocaleDateString(lang === "fa" ? "fa-IR" : "en-US", { year: "numeric", month: "short", day: "numeric" })
      : "";
  const displayReadTime = legacy?.readTime
    ? legacy.readTime
    : api
      ? `${Math.max(1, Math.ceil((displayContentHtml?.length || 600) / 900))} min read`
      : "";
  const hasFa = !!(api && (api.titleFa || api.excerptFa || api.contentFa));
  const coverUrl = api?.coverUrl ?? null;

  function close() { onClose(); }

  useEffect(() => { setLang("en"); }, [(blog as any)?.id ?? (blog as any)?.slug]);

  useEffect(() => {
    if (!blog) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        if (hasFa) setLang((v) => (v === "en" ? "fa" : "en"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [blog, hasFa]);

  if (!blog) return null;

  const faActive = lang === "fa";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={close} aria-hidden />
      <div className="relative w-full max-w-2xl max-h-[92dvh] sm:max-h-[85vh] bg-zinc-900 border border-zinc-700 shadow-2xl flex flex-col overflow-hidden rounded-t-lg sm:rounded-none">
        {/* title bar */}
        <div className="flex items-center justify-between gap-2 px-2.5 sm:px-3 py-2 bg-zinc-800 border-b border-zinc-700 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            <span className="flex gap-1 shrink-0">
              <span className="h-2 sm:h-2.5 w-2 sm:w-2.5 rounded-full bg-red-500" />
              <span className="h-2 sm:h-2.5 w-2 sm:w-2.5 rounded-full bg-yellow-500" />
              <span className="h-2 sm:h-2.5 w-2 sm:w-2.5 rounded-full bg-green-500" />
            </span>
            <span className="text-[10px] sm:text-[11px] text-zinc-400 font-mono truncate min-w-0">
              <span className="hidden sm:inline">cat ~/blogs/{displaySlug}.md — nvim</span>
              <span className="sm:hidden">cat {displaySlug.slice(0, 22)}… — nvim</span>
            </span>
          </div>
          <button onClick={close} aria-label="Close" className="h-7 w-7 sm:h-6 sm:w-6 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-colors shrink-0 -mr-1 sm:mr-0">✕</button>
        </div>

        {/* terminal line */}
        <div className="px-3 sm:px-4 pt-2.5 sm:pt-3 pb-2 border-b border-zinc-800 bg-zinc-950 font-mono text-[10px] sm:text-[11px] leading-5 shrink-0 overflow-hidden">
          <div className="text-zinc-500 truncate">$ cat blogs/{displaySlug}.md</div>
          <div className="flex items-center gap-1 text-green-400 animate-pulse">
            <span className="h-1.5 w-1.5 bg-green-400 rounded-full shrink-0" /> rendering — {displayReadTime}
          </div>
        </div>

        {/* EN / FA toggle — sticky top of scroll area */}
        <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 border-b border-zinc-800 bg-zinc-900 shrink-0">
          <div role="tablist" aria-label="Language" className="inline-flex border border-zinc-700 overflow-hidden">
            <button role="tab" aria-selected={lang === "en"} onClick={() => setLang("en")} className={`px-3 py-1 text-xs font-mono transition-colors ${lang === "en" ? "bg-zinc-100 text-zinc-900" : "bg-zinc-900 text-zinc-500 hover:text-zinc-300"}`}>EN</button>
            <button role="tab" aria-selected={lang === "fa"} onClick={() => setLang("fa")} className={`px-3 py-1 text-xs transition-colors ${lang === "fa" ? "bg-zinc-100 text-zinc-900 font-[var(--font-vazirmatn)]" : "bg-zinc-900 text-zinc-500 hover:text-zinc-300 font-[var(--font-vazirmatn)]"}`}>FA</button>
          </div>
          {faActive && !hasFa && <span className="text-[10px] text-zinc-500">— ترجمه در دسترس نیست، نمایش انگلیسی</span>}
          {coverUrl && <span className="hidden sm:inline text-[10px] text-zinc-600 truncate max-w-[160px]">{coverUrl}</span>}
        </div>

        {/* scrollable content */}
        <div className="overflow-y-auto p-3 sm:p-4 md:p-5 custom-scrollbar overscroll-contain">
          {coverUrl && (
            <img src={coverUrl} alt={displayTitle} className="w-full h-auto border border-zinc-800 mb-4 object-cover max-h-[220px]" />
          )}

          {isLegacy && legacy ? (
            <div className={`space-y-2.5 sm:space-y-3 ${faActive ? "font-[var(--font-vazirmatn)] text-right" : ""}`} dir={faActive ? "rtl" : "ltr"}>
              {legacy.content.map((line, i) => {
                if (line.startsWith("# ")) return <h1 key={i} className="text-[15px] sm:text-lg font-bold text-zinc-100 tracking-tight leading-snug break-words">{line.slice(2)}</h1>;
                if (line.startsWith("### ")) return <h3 key={i} className="text-[13px] sm:text-sm font-bold text-zinc-200 mt-3 sm:mt-4 break-words">{line.slice(4)}</h3>;
                if (line.startsWith("> ")) return <div key={i} className="border-l-2 border-zinc-600 pl-2.5 sm:pl-3 text-[13px] sm:text-sm text-zinc-400 italic break-words">{line.slice(2)}</div>;
                if (line.startsWith("```")) return null;
                if (line.startsWith("`") || line.includes("`")) {
                  const parts = line.split(/(`[^`]+`)/g);
                  return <p key={i} className="text-[13px] sm:text-sm leading-relaxed text-zinc-300 break-words [overflow-wrap:anywhere]">{parts.map((p, j) => p.startsWith("`") ? <code key={j} className="px-1 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-100 text-[11px] sm:text-xs rounded-none break-all">{p.slice(1, -1)}</code> : p)}</p>;
                }
                if (line.startsWith("- ")) return <div key={i} className="text-[13px] sm:text-sm text-zinc-300 flex gap-2 break-words"><span className="text-zinc-500 shrink-0">—</span><span className="min-w-0 [overflow-wrap:anywhere]">{line.slice(2)}</span></div>;
                if (line === "") return <div key={i} className="h-1.5 sm:h-2" />;
                return <p key={i} className="text-[13px] sm:text-sm leading-relaxed text-zinc-300 break-words [overflow-wrap:anywhere]">{line}</p>;
              })}
              {(() => {
                const codeIdx = legacy.content.findIndex((l) => l.startsWith("```"));
                if (codeIdx === -1) return null;
                const end = legacy.content.indexOf("```", codeIdx + 1);
                const code = legacy.content.slice(codeIdx + 1, end === -1 ? undefined : end);
                const cLang = legacy.content[codeIdx].slice(3) || "text";
                return (
                  <div className="mt-3 sm:mt-4 -mx-1 sm:mx-0">
                    <div className="flex items-center justify-between gap-2 px-2 py-1 bg-zinc-800 border border-zinc-700 border-b-0 text-[9px] sm:text-[10px] text-zinc-400 overflow-hidden">
                      <span className="shrink-0">{cLang}</span><span className="text-zinc-500 truncate min-w-0 text-right">cat &gt; {legacy.slug}.{cLang === "python" ? "py" : "tsx"}</span>
                    </div>
                    <BlogCode lines={code} />
                  </div>
                );
              })()}
            </div>
          ) : (
            <div
              dir={faActive ? "rtl" : "ltr"}
              className={`blog-content ${faActive ? "font-[var(--font-vazirmatn)] text-right leading-[1.95] text-[13px] sm:text-[15px]" : "text-[13px] sm:text-sm"}`}
              dangerouslySetInnerHTML={{ __html: displayContentHtml || `<p class="text-zinc-500">No content.</p>` }}
            />
          )}
          {!isLegacy && displayExcerpt && (
            <p className={`mt-4 text-xs text-zinc-500 border-t border-zinc-800 pt-3 ${faActive ? "font-[var(--font-vazirmatn)] text-right" : ""}`} dir={faActive ? "rtl" : "ltr"}>
              {displayExcerpt}
            </p>
          )}
        </div>

        <div className="px-3 sm:px-4 py-2.5 sm:py-2 border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0 bg-zinc-900">
          <span className="text-[9px] sm:text-[10px] text-zinc-500 truncate min-w-0">{displayDate} · {displayTag} · {displayReadTime}</span>
          <button onClick={close} className="text-xs px-4 sm:px-3 py-1.5 sm:py-1 bg-zinc-100 text-zinc-900 hover:bg-white active:bg-zinc-200 transition-colors shrink-0">Close</button>
        </div>
      </div>
    </div>
  );
}

// ---- helpers ----
function Corner() {
  return (
    <div className="absolute top-1 right-1 text-zinc-700 text-[8px] leading-none pointer-events-none select-none">
      <pre className="font-mono">+--+{"\n"}|  |{"\n"}+--+</pre>
    </div>
  );
}
function Prompt({ cmd }: { cmd: string }) {
  return (
    <div className="flex items-center text-xs text-left mb-2">
      <span className="text-zinc-500 mr-1">$</span>
      <span className="text-zinc-300 font-medium">{cmd}</span>
      <span className="animate-pulse ml-1 text-zinc-300">_</span>
    </div>
  );
}
function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`relative bg-zinc-900/50 border border-zinc-800 overflow-hidden rounded-none hover:border-zinc-700 transition-all duration-300 shadow-md ${className || ""}`}>
      <Corner />
      <div className="p-3">{children}</div>
    </div>
  );
}

export default function Home() {
  const [cur, setCur] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [langTab, setLangTab] = useState<"languages" | "editors" | "os">("languages");
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [blogsExpanded, setBlogsExpanded] = useState(false);
  const [apiPosts, setApiPosts] = useState<ApiPost[] | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [sitePlaylist, setSitePlaylist] = useState<typeof PLAYLIST | null>(null);
  const [siteWaka, setSiteWaka] = useState<typeof WAKA | null>(null);
  const [siteTech, setSiteTech] = useState<typeof TECH | null>(null);

  useEffect(() => {
    fetch("/api/blog", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.posts) && d.posts.length) setApiPosts(d.posts); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/site-content", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.playlist) && d.playlist.length) setSitePlaylist(d.playlist as typeof PLAYLIST);
        if (d.waka && typeof d.waka === "object" && d.waka.total) setSiteWaka(d.waka as typeof WAKA);
        if (Array.isArray(d.tech) && d.tech.length) setSiteTech(d.tech as typeof TECH);
      })
      .catch(() => {});
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-200 p-3 font-mono">
      <div className="mx-auto max-w-5xl">
        {/* ASCII header - hidden on mobile like original */}
        <div className="hidden md:flex flex-col items-center text-center mb-4 text-zinc-500 px-2">
          <pre className="inline-block text-left whitespace-pre leading-none font-mono text-zinc-500 text-[7px] tracking-tight" style={{ fontVariantLigatures: "none", textRendering: "geometricPrecision" }}>
{`█     █░▓█████  ██▓     ▄████▄   ▒█████   ███▄ ▄███▓▓█████
▓█░ █ ░█░▓█   ▀ ▓██▒    ▒██▀ ▀█  ▒██▒  ██▒▓██▒▀█▀ ██▒▓█   ▀
▒█░ █ ░█ ▒███   ▒██░    ▒▓█    ▄ ▒██░  ██▒▓██    ▓██░▒███
░█░ █ ░█ ▒▓█  ▄ ▒██░    ▒▓▓▄ ▄██▒▒██   ██░▒██    ▒██ ▒▓█  ▄
░░██▒██▓ ░▒████▒░██████▒▒ ▓███▀ ░░ ████▓▒░▒██▒   ░██▒░▒████▒
░ ▓░▒ ▒  ░░ ▒░ ░░ ▒░▓  ░░ ░▒ ▒  ░░ ▒░▒░▒░ ░ ▒░   ░  ░░░ ▒░ ░
  ▒ ░ ░   ░ ░  ░░ ░ ▒  ░  ░  ▒     ░ ▒ ▒░ ░  ░      ░ ░ ░  ░
  ░   ░     ░     ░ ░   ░        ░ ░ ░ ▒  ░      ░      ░
    ░       ░  ░    ░  ░░ ░          ░ ░         ░      ░  ░
                        ░`}
          </pre>
          <div className="text-[10px] text-zinc-600 tracking-[0.3em] mt-1">ixi_flower — amirabbas rouintan</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 auto-rows-min">
          {/* PROFILE */}
          <Card className="md:col-span-3">
            <div className="flex flex-col gap-y-2 h-full p-0">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 overflow-hidden rounded-none shrink-0 bg-zinc-800 border border-zinc-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="Profile" src={PROFILE.avatar} className="object-cover w-full h-full" />
                </div>
                <div className="text-left">
                  <h1 className="text-xl font-bold text-zinc-100 tracking-tight">
                    {PROFILE.handle}
                    <span className="animate-pulse">_</span>
                  </h1>
                  <p className="text-zinc-400 text-sm">{PROFILE.title}</p>
                </div>
              </div>
              <div className="mt-2 text-sm text-zinc-300 text-left border-l-2 border-zinc-700 pl-2 leading-relaxed">
                <p>{PROFILE.bio}</p>
              </div>
              <div className="flex-grow flex items-end w-full">
                <div className="mt-3 grid grid-cols-4 gap-2 w-full">
                  {PROFILE.socials.map((s) => {
                    const Ico = iconMap[s.icon];
                    return (
                      <a key={s.label} target="_blank" href={s.href} className="relative overflow-hidden group">
                        <div className="border border-zinc-700 bg-zinc-800/50 group-hover:bg-zinc-800 group-hover:border-zinc-600 transition-all duration-300 p-2 flex flex-col items-center justify-center rounded-none h-[64px]">
                          <Ico className="h-4 w-4 text-zinc-300 mb-1" />
                          <span className="text-[10px] text-zinc-400">{s.label}</span>
                          <div className="absolute inset-0 bg-zinc-900/90 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100">
                            <div className="text-center">
                              <div className="text-[10px] text-zinc-400 mb-1">$ {s.command}</div>
                              <div className="text-[8px] text-green-400 flex items-center justify-center">
                                <span className="animate-pulse mr-1">▋</span>
                                <span>connecting...</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          {/* GIT STATS */}
          <Card className="md:col-span-3">
            <Prompt cmd="git stats --user ixiflower" />
            <div className="space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { k: "Repos", v: GIT_STATS.repos, icon: "fork" },
                  { k: "Stars", v: GIT_STATS.stars, icon: "star" },
                  { k: "Followers", v: GIT_STATS.followers, icon: "users" },
                  { k: "Commits", v: GIT_STATS.commits, icon: "chart" },
                ].map((x) => (
                  <div key={x.k} className="flex items-center p-2 bg-zinc-800/50 border border-zinc-700 rounded-none">
                    <div className="mr-2 text-zinc-400">
                      {x.icon === "fork" && (
                        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <circle cx={12} cy={18} r={3} />
                          <circle cx={6} cy={6} r={3} />
                          <circle cx={18} cy={6} r={3} />
                          <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" />
                          <path d="M12 12v3" />
                        </svg>
                      )}
                      {x.icon === "star" && (
                        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.3L12 14.8 7.2 16.8l.9-5.3L4.2 7.7l5.4-.8L12 2z" />
                        </svg>
                      )}
                      {x.icon === "users" && (
                        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx={9} cy={7} r={4} />
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      )}
                      {x.icon === "chart" && (
                        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <line x1={12} x2={12} y1={20} y2={10} />
                          <line x1={18} x2={18} y1={20} y2={4} />
                          <line x1={6} x2={6} y1={20} y2={16} />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-zinc-400 leading-none">{x.k}</div>
                      <div className="text-sm font-bold text-zinc-200">{x.v}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-zinc-900 border border-zinc-700 rounded-none overflow-hidden">
                <div className="bg-zinc-800 px-2 py-1 text-xs text-zinc-300 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <polyline points="4 17 10 11 4 5" />
                      <line x1={12} x2={20} y1={19} y2={19} />
                    </svg>{" "}
                    terminal
                  </span>
                  <span className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="h-2 w-2 rounded-full bg-yellow-500" />
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                  </span>
                </div>
                <div className="p-2 h-[150px] overflow-y-auto custom-scrollbar font-mono text-[10px] leading-tight text-zinc-400">
                  <div className="text-zinc-500">&gt; git clone https://github.com/ixiflower</div>
                  <div>remote: Enumerating objects: 1847, done.</div>
                  <div>remote: Counting objects: 100% (1847/1847), done.</div>
                  <div>remote: Compressing objects: 100% (812/812), done.</div>
                  <div>Receiving objects: 100% (1847/1847), 9.14 MiB | 4.82 MiB/s, done.</div>
                  <div>Resolving deltas: 100% (923/923), done.</div>
                  <div className="text-zinc-500">&gt; cd ixiflower</div>
                  <div className="text-zinc-500">&gt; ls -la</div>
                  <div>total 184</div>
                  <div>drwxr-xr-x  18 user  staff   576 Mar 11 22:00 .</div>
                  <div>drwxr-xr-x   5 user  staff   160 Mar 11 22:00 ..</div>
                  <div>drwxr-xr-x  12 user  staff   384 Mar 11 22:00 .git</div>
                  <div>-rw-r--r--   1 user  staff  2104 Mar 11 22:00 README.md</div>
                  <div>drwxr-xr-x   8 user  staff   256 Mar 11 22:00 projects</div>
                  <div>drwxr-xr-x  10 user  staff   320 Mar 11 22:00 src</div>
                  <div className="text-zinc-500">&gt; cat README.md</div>
                  <div className="text-zinc-200"># ixiflower</div>
                  <div>hey welcome — full-stack dev, bot builder, infra hacker.</div>
                  <div className="animate-pulse">▋</div>
                </div>
              </div>

              <a target="_blank" href="https://github.com/ixiflower" className="block">
                <button className="w-full h-8 text-xs border border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 rounded-none inline-flex items-center justify-center gap-2 transition-colors">
                  <IconGithub className="h-3 w-3" /> View GitHub Profile
                </button>
              </a>
            </div>
          </Card>

          {/* TECH */}
          <Card className="md:col-span-2">
            <Prompt cmd="ls -la tech/" />
            <div className="grid grid-cols-1 gap-1.5 max-h-[290px] overflow-y-auto custom-scrollbar pr-1">
              {(siteTech ?? TECH).map((t: (typeof TECH)[number]) => (
                <div key={t.name} className="flex justify-between items-center p-2 bg-zinc-800/50 border border-zinc-700 rounded-none hover:bg-zinc-800 transition-colors group gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={(t as { icon: string }).icon}
                      alt={t.name}
                      width={16}
                      height={16}
                      className={`h-4 w-4 rounded-none border bg-zinc-900 object-contain p-0.5 shrink-0 ${(t as { invert?: boolean }).invert ? "invert" : ""}`}
                      style={{ borderColor: t.color }}
                      loading="lazy"
                    />
                    <span className="text-xs font-medium text-zinc-200 truncate">{t.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-zinc-400 whitespace-nowrap shrink-0">{t.yrs}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-none whitespace-nowrap shrink-0">{t.level}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* WAKATIME */}
          {(() => {
            const wakaData = siteWaka ?? WAKA;
            const barColors = ["bg-sky-500", "bg-yellow-500", "bg-zinc-500", "bg-cyan-400", "bg-zinc-600"];
            return (
          <Card className="md:col-span-2">
            <Prompt cmd="wakatime --all" />
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-zinc-800/50 border border-zinc-700 p-2 min-w-0 overflow-hidden">
                  <div className="text-[10px] text-zinc-400 leading-tight">Coding since {wakaData.codingSince} — age 12</div>
                  <div className="text-[13px] font-bold text-zinc-100 leading-tight break-words">{`Born 2007 · 6+ yrs coding`}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5 break-words">{wakaData.total} logged · {wakaData.daily}/day</div>
                </div>
                <div className="bg-zinc-800/50 border border-zinc-700 p-2 min-w-0 overflow-hidden">
                  <div className="text-[10px] text-zinc-400">Daily</div>
                  <div className="text-sm font-bold text-zinc-100 whitespace-nowrap">{wakaData.daily}</div>
                </div>
              </div>
              <div className="flex gap-1">
                {(["languages", "editors", "os"] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setLangTab(k)}
                    className={`text-[10px] px-2 py-1 border rounded-none transition-colors ${langTab === k ? "bg-zinc-800 border-zinc-600 text-zinc-100" : "border-zinc-800 text-zinc-500 hover:text-zinc-300"}`}
                  >
                    --{k}
                  </button>
                ))}
              </div>
              <div>
                <div className="text-xs text-zinc-400 mb-1">Top Languages</div>
                <div className="h-2 w-full bg-zinc-800 flex overflow-hidden rounded-none">
                  {wakaData.langs.map((l, i) => (
                    <div key={l.name} className={barColors[i % barColors.length]} style={{ width: `${l.pct}%` }} />
                  ))}
                </div>
                <div className="mt-2 space-y-1">
                  {wakaData.langs.map((l) => (
                    <div key={l.name} className="flex justify-between text-xs">
                      <span className="text-zinc-300">{l.name}</span>
                      <span className="text-zinc-500">{l.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
            );
          })()}

          {/* MUSIC */}
          {(() => {
            const pl = sitePlaylist ?? PLAYLIST;
            const curTrack = pl[cur] ?? pl[0];
            return (
          <Card className="md:col-span-2">
            <Prompt cmd="mpv --playlist favorites.m3u" />
            <div className="space-y-2">
              <div className="bg-zinc-900 border border-zinc-800 p-2 flex items-center gap-2">
                <div className="h-10 w-10 bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">♪</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-zinc-100 truncate">{curTrack.title}</div>
                  <div className="text-xs text-zinc-400 truncate">{curTrack.artist} — 0:00 / {curTrack.dur}</div>
                  <div className="h-1 bg-zinc-800 mt-1">
                    <div className="h-1 bg-zinc-300" style={{ width: playing ? "38%" : "0%" }} />
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setCur((c) => (c - 1 + pl.length) % pl.length)} className="h-7 w-7 border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center">
                    ◀
                  </button>
                  <button
                    onClick={() => setPlaying((p) => !p)}
                    className="h-7 w-7 border border-zinc-700 bg-zinc-100 text-zinc-900 flex items-center justify-center"
                  >
                    {playing ? "❚❚" : "▶"}
                  </button>
                  <button onClick={() => setCur((c) => (c + 1) % pl.length)} className="h-7 w-7 border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center">
                    ▶
                  </button>
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-zinc-500">
                <span>Playlist</span>
                <span>{pl.length} tracks</span>
              </div>
              <div className="relative">
                <div className="max-h-[220px] overflow-y-auto custom-scrollbar space-y-1 pr-1 pb-6">
                  {pl.map((t, i) => (
                  <button
                    key={t.title}
                    onClick={() => {
                      setCur(i);
                      setPlaying(true);
                    }}
                    className={`w-full flex items-center justify-between p-1.5 border text-left rounded-none transition-colors ${i === cur ? "bg-zinc-800 border-zinc-600 text-zinc-100" : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"}`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="h-6 w-6 bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[10px] shrink-0">♪</span>
                      <span className="text-xs truncate">{t.title}</span>
                    </span>
                    <span className="text-[10px] shrink-0 ml-2">{t.dur}</span>
                  </button>
                  ))}
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-zinc-900/80 via-zinc-900/40 to-transparent" aria-hidden />
              </div>
            </div>
          </Card>
            );
          })()}

          {/* REPOS */}
          <Card className="md:col-span-6">
            <div className="flex justify-between items-center mb-3">
              <Prompt cmd="gh repo list --sort stars" />
              <a target="_blank" href="https://github.com/ixiflower" className="shrink-0 ml-2">
                <span className="inline-flex items-center gap-1 h-7 px-3 text-xs border border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 rounded-none">
                  View All <span aria-hidden>↗</span>
                </span>
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {REPOS.map((r) => (
                <div key={r.name} className="border border-zinc-800 bg-zinc-900 p-3 hover:border-zinc-700 transition-colors relative overflow-hidden group">
                  <div className="absolute top-1 right-1 text-zinc-700 text-[8px] leading-none pointer-events-none">
                    <pre>+---+{"\n"}|   |{"\n"}+---+</pre>
                  </div>
                  <h3 className="font-bold text-sm text-zinc-100 pr-6">{r.name}</h3>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-3 min-h-[48px]">{r.desc}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full" style={{ background: r.lang === "Python" ? "#3572A5" : "#3178c6" }} /> {r.lang}
                    </span>
                    <span className="flex items-center gap-1">★ {r.stars}</span>
                    <span className="flex items-center gap-1">⑂ {r.forks}</span>
                  </div>
                  <a href={`https://github.com/ixiflower/${r.name}`} target="_blank" className="absolute inset-0" aria-label={r.name} />
                </div>
              ))}
            </div>
          </Card>

          {/* BLOGS — live from DB (/api/blog), falls back to hardcoded BLOGS */}
          {(() => {
            const source: Blog[] = apiPosts ?? (BLOGS as unknown as Blog[]);
            const visible = blogsExpanded ? source : source.slice(0, 1);
            const fmtDate = (b: Blog) => {
              if (isLegacyBlog(b)) return b.date;
              const s = (b as ApiPost).publishedAt || (b as ApiPost).createdAt;
              return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            };
            const readTime = (b: Blog) => {
              if (isLegacyBlog(b)) return b.readTime;
              const html = (b as ApiPost).content || "";
              return `${Math.max(1, Math.ceil(html.length / 900))} min`;
            };
            const tag = (b: Blog) => isLegacyBlog(b) ? b.tag : ((b as ApiPost).tags?.[0]?.name ?? "Blog");
            return (
              <Card className="md:col-span-3">
                <Prompt cmd={`find ./blogs -type f -name '*.md' | sort -r`} />
                <div className="space-y-2">
                  {visible.map((b) => (
                    <button
                      key={b.slug}
                      onClick={() => setSelectedBlog(b)}
                      className="block w-full text-left border border-zinc-800 bg-zinc-800/50 p-2 hover:border-zinc-600 hover:bg-zinc-800 transition-colors relative group"
                    >
                      <span className="absolute top-0 left-0 text-zinc-700 text-[8px] leading-none"><pre>+--</pre></span>
                      <span className="absolute bottom-0 right-0 text-zinc-700 text-[8px] leading-none"><pre>--+</pre></span>
                      <h3 className="text-sm font-medium text-zinc-200 group-hover:text-white pr-6">
                        {b.title}
                        <span className="ml-2 text-[10px] text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">$ cat →</span>
                      </h3>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-500">
                        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <rect width={18} height={18} x={3} y={4} rx={2} /><path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>{" "}{fmtDate(b)} · {readTime(b)}
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-1">{b.excerpt}</p>
                      <span className="inline-block mt-2 text-[10px] px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-none">{tag(b)}</span>
                    </button>
                  ))}
                  <div className="text-center">
                    <button onClick={() => setBlogsExpanded((v) => !v)} className="text-xs text-zinc-300 hover:text-zinc-100 inline-flex items-center gap-1">
                      {blogsExpanded ? "Show less" : `View all posts (${source.length})`} <span>{blogsExpanded ? "↑" : "→"}</span>
                    </button>
                  </div>
                </div>
              </Card>
            );
          })()}

          {/* PROJECTS */}
          <Card className="md:col-span-3">
            <div className="flex justify-between items-center mb-3">
              <Prompt cmd={`find ./projects -type f -name '*.featured'`} />
              <a href="#" className="shrink-0 ml-2 inline-flex items-center gap-1 h-7 px-3 text-xs border border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 rounded-none">
                All Projects <span>↗</span>
              </a>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {PROJECTS.map((p) => (
                <ProjectCard key={p.title} p={p} />
              ))}
            </div>
          </Card>

          {/* FOOTER CONNECT */}
          <Card className="md:col-span-6">
            <div className="text-center">
              <pre className="inline-block text-xs text-zinc-500 leading-tight">+-----------------------+{"\n"}|     CONNECT WITH ME    |{"\n"}+-----------------------+</pre>
            </div>
            <Prompt cmd="ssh-connect --social" />
            <div className="flex justify-center gap-3">
              {PROFILE.socials.map((s) => {
                const Ico = iconMap[s.icon];
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    className="h-8 w-8 border border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:scale-105 transition-all flex items-center justify-center rounded-none"
                    aria-label={s.label}
                  >
                    <Ico className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="text-center text-[10px] text-zinc-600 mt-6 font-mono">© 2026 ixi_flower — built with Next.js • terminal edition • hoseinwave inspired</div>
      </div>
      {selectedBlog && <BlogModal blog={selectedBlog} onClose={() => setSelectedBlog(null)} />}
    </main>
  );
}
