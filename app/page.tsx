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
  editors: [
    { name: "VS Code", pct: 58 },
    { name: "Claude Code", pct: 22 },
    { name: "Neovim", pct: 12 },
    { name: "Cursor", pct: 8 },
  ],
  os: [
    { name: "Linux", pct: 76 },
    { name: "Windows", pct: 24 },
    { name: "macOS", pct: 0 },
  ],
};

type Course = { title: string; provider: string; year: string; link?: string; status: "completed" | "in-progress" };
const COURSES: Course[] = [
  { title: "The Modern Python 3 Bootcamp", provider: "Udemy", year: "2023", link: "https://www.udemy.com/certificate/UC-9842c80b-e377-4960-b027-83a31256595d/", status: "completed" },
  { title: "OWASP Zero", provider: "voorivex.academy", year: "2023", link: "", status: "completed" },
  { title: "Certified Ethical Hacker (CEH)", provider: "maktabkhooneh", year: "2023", link: "", status: "completed" },
  { title: "Security Plus", provider: "maktabkhooneh", year: "2022", link: "", status: "completed" },
  { title: "LPIC-1 Bootcamp", provider: "Jadi", year: "2022", link: "", status: "completed" },
  { title: "CompTIA Network+", provider: "Arjang", year: "2022", link: "", status: "completed" },
  { title: "The Modern Python", provider: "Arjang", year: "2023", link: "", status: "completed" },
  { title: "Docker — Kubernetes", provider: "DevOps", year: "2024", link: "", status: "completed" },
  { title: "nmap", provider: "Udemy", year: "2023", link: "", status: "completed" },
  { title: "REACT.JS Course", provider: "Frontend", year: "2024", link: "", status: "completed" },
];

type PlaylistTrack = { title: string; artist: string; dur: string; url?: string };
const PLAYLIST: PlaylistTrack[] = [
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
function IconYoutube(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={props.className}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}
const iconMap: Record<string, React.FC<{ className?: string }>> = {
  github: IconGithub,
  twitter: IconTwitter,
  linkedin: IconLinkedin,
  mail: IconMail,
  youtube: IconYoutube,
};

// footer ssh-connect --social — always includes YouTube (PROFILE top card does NOT)
const FOOTER_SOCIALS_BASE = [
  { label: "GitHub", href: "https://github.com/ixiflower", icon: "github" },
  { label: "Twitter", href: "https://x.com/ixi_flower0", icon: "twitter" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/amirabbas-rouintan", icon: "linkedin" },
  { label: "YouTube", href: "https://www.youtube.com/@ixi_flower0", icon: "youtube" },
  { label: "Email", href: "mailto:amirabbas.rouintan2007@gmail.com", icon: "mail" },
] as const;

// ---- blog helpers ----
function BlogCode({ lines }: { lines: string[] }) {
  const [typed, setTyped] = useState("");
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
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

  async function copy() {
    await navigator.clipboard.writeText(full).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="relative group/code">
      <button onClick={copy} className={`absolute top-1.5 right-1.5 z-10 inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono border transition-all ${copied ? 'bg-emerald-950 border-emerald-700 text-emerald-300' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 opacity-0 group-hover/code:opacity-100'}`} title="Copy code">
        {copied ? '✓ Copied' : 'Copy'}
      </button>
      <pre dir="ltr" className="bg-zinc-950 border border-zinc-800 p-2 sm:p-3 text-[10px] sm:text-[11px] leading-[1.65] overflow-x-auto text-left text-zinc-300 whitespace-pre-wrap break-words [overflow-wrap:anywhere]" style={{ direction: "ltr", textAlign: "left", unicodeBidi: "plaintext" }}>
        <code dir="ltr" style={{ direction: "ltr", unicodeBidi: "plaintext" }}>{typed}</code>
        {!done && <span className="inline-block w-1.5 sm:w-2 h-3 sm:h-4 bg-zinc-400 animate-pulse ml-0.5 align-middle" />}
      </pre>
    </div>
  );
}

// — Animated terminal — types lines like a real terminal
function TermAnim() {
  const lines: { text: string; cls: string; delay: number }[] = [
    { text: "> git clone https://github.com/ixiflower", cls: "text-zinc-500", delay: 0 },
    { text: "remote: Enumerating objects: 1847, done.", cls: "", delay: 700 },
    { text: "remote: Counting objects: 100% (1847/1847), done.", cls: "", delay: 1100 },
    { text: "remote: Compressing objects: 100% (812/812), done.", cls: "", delay: 1450 },
    { text: "Receiving objects: 100% (1847/1847), 9.14 MiB | 4.82 MiB/s, done.", cls: "", delay: 1850 },
    { text: "Resolving deltas: 100% (923/923), done.", cls: "", delay: 2250 },
    { text: "> cd ixiflower", cls: "text-zinc-500", delay: 2700 },
    { text: "> ls -la", cls: "text-zinc-500", delay: 3100 },
    { text: "total 184", cls: "", delay: 3350 },
    { text: "drwxr-xr-x  18 user  staff   576 Mar 11 22:00 .", cls: "", delay: 3500 },
    { text: "drwxr-xr-x   5 user  staff   160 Mar 11 22:00 ..", cls: "", delay: 3650 },
    { text: "drwxr-xr-x  12 user  staff   384 Mar 11 22:00 .git", cls: "", delay: 3800 },
    { text: "-rw-r--r--   1 user  staff  2104 Mar 11 22:00 README.md", cls: "", delay: 3950 },
    { text: "drwxr-xr-x   8 user  staff   256 Mar 11 22:00 projects", cls: "", delay: 4100 },
    { text: "drwxr-xr-x  10 user  staff   320 Mar 11 22:00 src", cls: "", delay: 4250 },
    { text: "> cat README.md", cls: "text-zinc-500", delay: 4650 },
    { text: "# ixiflower", cls: "text-zinc-200", delay: 4950 },
    { text: "hey welcome — full-stack dev, bot builder, infra hacker.", cls: "", delay: 5150 },
  ];
  const [visible, setVisible] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (visible >= lines.length) return;
    const t = setTimeout(() => setVisible((v) => v + 1), lines[visible]?.delay ? (visible === 0 ? 400 : lines[visible].delay - (lines[visible - 1]?.delay ?? 0)) : 300);
    return () => clearTimeout(t);
  }, [visible]);
  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [visible]);
  // loop after 10s idle
  useEffect(() => {
    if (visible !== lines.length) return;
    const t = setTimeout(() => setVisible(0), 7000);
    return () => clearTimeout(t);
  }, [visible]);
  return (
    <div ref={scrollerRef} className="p-2 h-[150px] overflow-y-auto custom-scrollbar font-mono text-[10px] leading-tight text-zinc-400 scroll-smooth">
      {lines.slice(0, visible).map((l, i) => (
        <div key={i} className={l.cls + (l.text.startsWith(">") ? " flex" : "")}>
          {l.text}
          {i === visible - 1 && l.text.startsWith(">") && <span className="ml-1 inline-block h-3 w-1.5 bg-zinc-400 animate-[pulse-blink_1s_steps(1)_infinite] translate-y-px" />}
        </div>
      ))}
      {visible === lines.length && <div className="animate-pulse text-zinc-400">▋</div>}
    </div>
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
  const postId = api?.id ?? null;
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [mine, setMine] = useState<"like" | "dislike" | null>(null);
  const [reacting, setReacting] = useState(false);
  function getFp() {
    if (typeof window === "undefined") return "";
    let v = localStorage.getItem("ixi_fp");
    if (!v) { v = `fp-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`; localStorage.setItem("ixi_fp", v); }
    return v;
  }
  useEffect(() => {
    if (!postId) return;
    setLikes(0); setDislikes(0); setMine(null);
    fetch(`/api/blog/reactions?postId=${postId}`, { headers: { "x-fingerprint": getFp() } })
      .then((r) => r.json())
      .then((j) => { if (typeof j.likes === "number") setLikes(j.likes); if (typeof j.dislikes === "number") setDislikes(j.dislikes); if (j.mine) setMine(j.mine); })
      .catch(() => {});
  }, [postId]);
  async function react(kind: "like" | "dislike") {
    if (!postId || reacting) return;
    setReacting(true);
    try {
      const r = await fetch("/api/blog/reactions", { method: "POST", headers: { "Content-Type": "application/json", "x-fingerprint": getFp() }, body: JSON.stringify({ postId, kind, fingerprint: getFp() }) });
      const j = await r.json();
      if (r.ok) { setLikes(j.likes ?? 0); setDislikes(j.dislikes ?? 0); setMine(j.mine ?? null); }
    } catch {}
    setReacting(false);
  }

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

  const contentRef = useRef<HTMLDivElement>(null);

  // inject Copy buttons into Tiptap HTML (<pre> inside .blog-content)
  useEffect(() => {
    const root = contentRef.current;
    if (!root || isLegacy) return;
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
        setTimeout(() => { btn.textContent = "Copy"; btn.classList.remove("copied"); }, 1400);
      });
      pre.appendChild(btn);
    });
  }, [displayContentHtml, isLegacy]);

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
              ref={contentRef}
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

        <div className="px-3 sm:px-4 py-2.5 sm:py-2 border-t border-zinc-800 flex items-center justify-between gap-2 shrink-0 bg-zinc-900">
          <span className="text-[9px] sm:text-[10px] text-zinc-500 truncate min-w-0 hidden sm:inline">{displayDate} · {displayTag} · {displayReadTime}</span>
          {postId ? (
            <span className="flex items-center gap-1.5 shrink-0">
              <button disabled={reacting} onClick={() => react("like")} className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border transition-colors ${mine === "like" ? "bg-emerald-500 text-zinc-950 border-emerald-500" : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"}`} title="Like">
                <svg width={12} height={12} viewBox="0 0 24 24" fill={mine === "like" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={mine === "like" ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-2l-1.33-6.66A2 2 0 0 0 16.96 11H14z" /><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" /></svg> {likes}
              </button>
              <button disabled={reacting} onClick={() => react("dislike")} className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border transition-colors ${mine === "dislike" ? "bg-red-500 text-white border-red-500" : "border-zinc-700 text-zinc-400 hover:bg-zinc-800"}`} title="Dislike">
                <svg width={12} height={12} viewBox="0 0 24 24" fill={mine === "dislike" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={mine === "dislike" ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 2l1.33 6.66A2 2 0 0 0 7.04 13H10z" /><path d="M17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" /></svg> {dislikes}
              </button>
            </span>
          ) : <span className="text-[10px] text-zinc-600 hidden sm:inline" />}
          <button onClick={close} className="text-xs px-4 sm:px-3 py-1.5 sm:py-1 bg-zinc-100 text-zinc-900 hover:bg-white active:bg-zinc-200 transition-colors shrink-0">Close</button>
        </div>
      </div>
    </div>
  );
}

function BlogsAllModal({ blogs, onClose, onSelect }: { blogs: Blog[]; onClose: () => void; onSelect: (b: Blog) => void }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

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
  const tag = (b: Blog) => (isLegacyBlog(b) ? b.tag : ((b as ApiPost).tags?.[0]?.name ?? "Blog"));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-zinc-900 border border-zinc-700 shadow-2xl flex flex-col overflow-hidden rounded-none">
        {/* title bar */}
        <div className="flex items-center justify-between gap-2 px-2.5 sm:px-3 py-2 bg-zinc-800 border-b border-zinc-700 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            <span className="flex gap-1 shrink-0">
              <span className="h-2 sm:h-2.5 w-2 sm:w-2.5 rounded-full bg-red-500" />
              <span className="h-2 sm:h-2.5 w-2 sm:w-2.5 rounded-full bg-yellow-500" />
              <span className="h-2 sm:h-2.5 w-2 sm:w-2.5 rounded-full bg-green-500" />
            </span>
            <span className="text-[10px] sm:text-[11px] text-zinc-400 font-mono truncate">ls ~/blogs --all</span>
          </div>
          <button onClick={onClose} aria-label="Close" className="h-7 w-7 sm:h-6 sm:w-6 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-colors shrink-0 -mr-1 sm:mr-0">
            ✕
          </button>
        </div>
        {/* terminal line */}
        <div className="px-3 sm:px-4 pt-2.5 sm:pt-3 pb-2 border-b border-zinc-800 bg-zinc-950 font-mono text-[10px] sm:text-[11px] leading-5 shrink-0 overflow-hidden">
          <div className="text-zinc-500 truncate">$ ls -la ~/blogs --all</div>
          <div className="flex items-center gap-1 text-zinc-400">
            <span className="h-1.5 w-1.5 bg-green-400 rounded-full shrink-0 animate-pulse" /> {blogs.length} posts — click to open
          </div>
        </div>
        {/* scrollable grid */}
        <div className="overflow-y-auto p-3 sm:p-4 custom-scrollbar overscroll-contain">
          {blogs.length === 0 ? (
            <p className="text-sm text-zinc-500 font-mono">no posts yet</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {blogs.map((b) => (
                <button
                  key={b.slug}
                  onClick={() => onSelect(b)}
                  className="text-left border border-zinc-800 bg-zinc-800/50 p-3 hover:border-zinc-600 hover:bg-zinc-800 transition-colors relative group"
                >
                  <span className="absolute top-0 left-0 text-zinc-700 text-[8px] leading-none">
                    <pre>+--</pre>
                  </span>
                  <span className="absolute bottom-0 right-0 text-zinc-700 text-[8px] leading-none">
                    <pre>--+</pre>
                  </span>
                  <h3 className="text-sm font-medium text-zinc-200 group-hover:text-white pr-4 line-clamp-2">
                    {b.title}
                    <span className="ml-2 text-[10px] text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">$ cat →</span>
                  </h3>
                  <div className="flex items-center gap-1 mt-1.5 text-[10px] text-zinc-500">
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <rect width={18} height={18} x={3} y={4} rx={2} />
                      <path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>{" "}
                    {fmtDate(b)} · {readTime(b)}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2">{b.excerpt}</p>
                  <span className="inline-block mt-2 text-[10px] px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-none">{tag(b)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="px-3 sm:px-4 py-2.5 sm:py-2 border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0 bg-zinc-900">
          <span className="text-[10px] text-zinc-500 font-mono">{blogs.length} posts</span>
          <button onClick={onClose} className="text-xs px-4 sm:px-3 py-1.5 sm:py-1 bg-zinc-100 text-zinc-900 hover:bg-white active:bg-zinc-200 transition-colors">
            Close
          </button>
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
function Card({ className, children, delay }: { className?: string; children: React.ReactNode; delay?: number }) {
  return (
    <div
      style={delay != null ? { animationDelay: `${delay}ms` } : undefined}
      className={`fade-up relative bg-zinc-900/50 border border-zinc-800 overflow-hidden rounded-none hover:border-zinc-700 transition-all duration-300 shadow-md ${className || ""}`}
    >
      <div className="p-3">{children}</div>
    </div>
  );
}

function fmtTime(s: number) {
  if (!isFinite(s) || s <= 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function Home() {
  const [cur, setCur] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [langTab, setLangTab] = useState<"languages" | "editors" | "os">("languages");
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [showAllBlogs, setShowAllBlogs] = useState(false);
  const [apiPosts, setApiPosts] = useState<ApiPost[] | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [sitePlaylist, setSitePlaylist] = useState<typeof PLAYLIST | null>(null);
  const [siteWaka, setSiteWaka] = useState<typeof WAKA | null>(null);
  const [siteTech, setSiteTech] = useState<typeof TECH | null>(null);
  const [siteCourses, setSiteCourses] = useState<typeof COURSES | null>(null);
  const [siteProfile, setSiteProfile] = useState<typeof PROFILE | null>(null);

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
        if (Array.isArray(d.courses) && d.courses.length) setSiteCourses(d.courses as typeof COURSES);
        if (d.profile && typeof d.profile === "object" && (d.profile as Record<string, unknown>).handle) setSiteProfile(d.profile as typeof PROFILE);
      })
      .catch(() => {});
  }, []);

  // keep audio in sync with play/cur state (auto-play next track)
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (playing && el.src) el.play().catch(() => {});
  }, [cur, playing]);

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

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 auto-rows-min md:items-stretch">
          {/* PROFILE */}
          <Card className="md:col-span-3" delay={0}>
            <div className="flex flex-col gap-y-2 h-full p-0">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 overflow-hidden rounded-none shrink-0 bg-zinc-800 border border-zinc-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="Profile" src={(siteProfile ?? PROFILE).avatar || "/avatar.jpg"} className="object-cover w-full h-full" />
                </div>
                <div className="text-left">
                  <h1 className="text-xl font-bold text-zinc-100 tracking-tight">
                    {(siteProfile ?? PROFILE).handle}
                    <span className="animate-pulse">_</span>
                  </h1>
                  <p className="text-zinc-400 text-sm">{(siteProfile ?? PROFILE).title}</p>
                </div>
              </div>
              <div className="mt-2 text-sm text-zinc-300 text-left border-l-2 border-zinc-700 pl-2 leading-relaxed">
                <p>{(siteProfile ?? PROFILE).bio}</p>
              </div>
              <div className="flex-grow flex items-end w-full">
                <div className="mt-3 grid grid-cols-4 gap-2 w-full">
                  {(() => {
                    const src = siteProfile ? (siteProfile.socials as unknown as typeof PROFILE.socials) : PROFILE.socials;
                    const filtered = (src as unknown as { icon: string }[]).filter(s => s.icon !== 'youtube') as unknown as typeof PROFILE.socials;
                    return filtered;
                  })().map((s) => {
                    const Ico = iconMap[s.icon as string] ?? IconGithub;
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
          <Card className="md:col-span-3" delay={60}>
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
                <TermAnim />
              </div>

              <a target="_blank" href="https://github.com/ixiflower" className="block">
                <button className="w-full h-8 text-xs border border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 rounded-none inline-flex items-center justify-center gap-2 transition-colors">
                  <IconGithub className="h-3 w-3" /> View GitHub Profile
                </button>
              </a>
            </div>
          </Card>

          {/* TECH */}
          <Card className="md:col-span-2 flex flex-col md:h-[360px] [&>div]:flex-1 [&>div]:flex [&>div]:flex-col [&>div]:min-h-0" delay={120}>
            <Prompt cmd="ls -la tech/" />
            <div className="relative flex-1 flex flex-col min-h-0">
              <div className="grid grid-cols-1 gap-1.5 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 content-start pb-6">
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
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-zinc-900/80 via-zinc-900/40 to-transparent" aria-hidden />
            </div>
          </Card>

          {/* WAKATIME */}
          {(() => {
            const wakaData = siteWaka ?? WAKA;
            const barColors = ["bg-sky-500", "bg-yellow-500", "bg-violet-500", "bg-emerald-500", "bg-orange-500"];
            const osColors = ["bg-orange-500", "bg-sky-600", "bg-zinc-500"];
            const editorColors = ["bg-sky-500", "bg-violet-500", "bg-emerald-500", "bg-yellow-500"];
            const activeList =
              langTab === "languages" ? wakaData.langs
              : langTab === "editors" ? (wakaData.editors ?? WAKA.editors)
              : (wakaData.os ?? WAKA.os);
            const activeColors = langTab === "os" ? osColors : langTab === "editors" ? editorColors : barColors;
            const title = langTab === "languages" ? "Top Languages" : langTab === "editors" ? "Editors" : "Operating Systems";
            return (
          <Card className="md:col-span-2 flex flex-col md:h-[360px] [&>div]:flex-1 [&>div]:flex [&>div]:flex-col [&>div]:min-h-0" delay={180}>
            <Prompt cmd="wakatime --all" />
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
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
                <div className="text-xs text-zinc-400 mb-1">{title}</div>
                <div className="h-2 w-full bg-zinc-800 flex overflow-hidden rounded-none">
                  {activeList.map((l, i) => (
                    <div key={l.name} className={activeColors[i % activeColors.length]} style={{ width: `${l.pct}%` }} />
                  ))}
                </div>
                <div className="mt-2 space-y-1">
                  {activeList.map((l) => (
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

          {/* MUSIC — real <audio> wired to Cloudinary urls, progress + seek + auto-next */}
          {(() => {
            const pl = sitePlaylist ?? PLAYLIST;
            const curTrack = pl[cur] ?? pl[0];
            const hasUrl = !!curTrack.url;
            const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

            // effect wiring inside IIFE scope via refs — attach inline handlers below
            return (
          <Card className="md:col-span-2 flex flex-col md:h-[360px] [&>div]:flex-1 [&>div]:flex [&>div]:flex-col [&>div]:min-h-0" delay={240}>
            <Prompt cmd="mpv --playlist favorites.m3u" />
            <audio
              ref={audioRef}
              src={curTrack.url || undefined}
              preload="metadata"
              onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
              onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
              onEnded={() => {
                setCur((c) => (c + 1) % pl.length);
                setPlaying(true);
              }}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />
            <div className="space-y-2 flex-1 flex flex-col min-h-0">
              <div className="bg-zinc-900 border border-zinc-800 p-1.5 flex items-center gap-1.5 shrink-0">
                <div className="h-8 w-8 bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 text-xs shrink-0">♪</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-zinc-100 truncate">{curTrack.title}</div>
                  <div className="text-[11px] text-zinc-400 truncate">
                    {curTrack.artist} — {hasUrl ? `${fmtTime(currentTime)} / ${duration ? fmtTime(duration) : curTrack.dur}` : curTrack.dur}
                    {!hasUrl && <span className="text-amber-400 ml-1">(no audio)</span>}
                  </div>
                  <div
                    className="h-0.5 bg-zinc-800 mt-1 cursor-pointer"
                    onClick={(e) => {
                      if (!hasUrl || !duration || !audioRef.current) return;
                      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                      const frac = (e.clientX - rect.left) / rect.width;
                      audioRef.current.currentTime = frac * duration;
                    }}
                  >
                    <div className="h-0.5 bg-zinc-300 transition-[width] duration-100" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="flex gap-0.5">
                  <button
                    onClick={() => setCur((c) => (c - 1 + pl.length) % pl.length)}
                    className="h-6 w-6 border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center text-[10px] leading-none"
                  >
                    <span className="leading-none translate-y-[0.5px] inline-block">◀</span>
                  </button>
                  <button
                    onClick={() => {
                      if (!hasUrl) return;
                      if (playing) audioRef.current?.pause();
                      else audioRef.current?.play().catch(() => {});
                    }}
                    disabled={!hasUrl}
                    className={`h-6 w-6 border flex items-center justify-center text-[10px] leading-none ${hasUrl ? "border-zinc-700 bg-zinc-100 text-zinc-900 hover:bg-white" : "border-zinc-800 bg-zinc-800 text-zinc-600 cursor-not-allowed"}`}
                  >
                    <span className="leading-none translate-y-[0.5px] inline-block">{playing ? "❚❚" : "▶"}</span>
                  </button>
                  <button
                    onClick={() => setCur((c) => (c + 1) % pl.length)}
                    className="h-6 w-6 border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center text-[10px] leading-none"
                  >
                    <span className="leading-none translate-y-[0.5px] inline-block">▶</span>
                  </button>
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-zinc-500">
                <span>Playlist</span>
                <span>{pl.length} tracks{hasUrl ? "" : " · upload audio in /admin/site-content"}</span>
              </div>
              <div className="relative flex-1 flex flex-col min-h-0">
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-1 pr-1 pb-6">
                  {pl.map((t, i) => (
                  <button
                    key={`${t.title}-${i}`}
                    onClick={() => {
                      setCur(i);
                      // play will trigger via effect when src changes; nudge play after tick if url exists
                      if (t.url) setTimeout(() => audioRef.current?.play().catch(() => {}), 80);
                      else setPlaying(false);
                    }}
                    className={`w-full flex items-center justify-between p-1.5 border text-left rounded-none transition-colors ${i === cur ? "bg-zinc-800 border-zinc-600 text-zinc-100" : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"}`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="h-6 w-6 bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[10px] shrink-0">♪</span>
                      <span className="text-xs truncate">{t.title}</span>
                      {t.url ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" title="audio ready" /> : null}
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
          <Card className="md:col-span-6" delay={300}>
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
              <Card className="md:col-span-3" delay={360}>
                <Prompt cmd={`find ./blogs -type f -name '*.md' | sort -r`} />
                <div className="relative">
                  <div className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar pr-1 pb-6">
                    {source.map((b) => (
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
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-zinc-900/80 via-zinc-900/40 to-transparent" aria-hidden />
                </div>
                <div className="text-center mt-2">
                  <a href="/blogs" className="text-xs text-zinc-300 hover:text-zinc-100 inline-flex items-center gap-1">
                    View all posts ({source.length}) <span>→</span>
                  </a>
                </div>
              </Card>
            );
          })()}

          {/* PROJECTS */}
          <Card className="md:col-span-3" delay={420}>
            <div className="flex justify-between items-center mb-3">
              <Prompt cmd={`find ./projects -type f -name '*.featured'`} />
              <a href="/projects" className="shrink-0 ml-2 inline-flex items-center gap-1 h-7 px-3 text-xs border border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 rounded-none">
                All Projects <span>↗</span>
              </a>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {PROJECTS.map((p) => (
                <ProjectCard key={p.title} p={p} />
              ))}
            </div>
          </Card>

          {/* COURSES */}
          <Card className="md:col-span-6" delay={440}>
            <Prompt cmd="cat ./courses.json | jq" />
            <div className="relative">
              <div className="max-h-[320px] overflow-y-auto custom-scrollbar space-y-1 pr-1 pb-6">
                {(siteCourses ?? COURSES).map((c, i) => (
                  <div key={`${c.title}-${i}`} className="flex items-center justify-between gap-2 p-2 bg-zinc-800/50 border border-zinc-800 hover:border-zinc-600 transition-colors">
                    <div className="min-w-0 flex-1">
                      {c.link ? (
                        <a href={c.link} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-zinc-200 hover:text-white hover:underline truncate block">
                          {c.title}
                        </a>
                      ) : (
                        <span className="text-xs font-medium text-zinc-200 truncate block">{c.title}</span>
                      )}
                      <span className="text-[11px] text-zinc-500 truncate block">
                        {c.provider} · {c.year}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {c.link ? (
                        <a href={c.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-zinc-500 hover:text-zinc-300 border border-zinc-700 px-1.5 py-0.5">
                          link ↗
                        </a>
                      ) : null}
                      <span className={`text-[10px] px-1.5 py-0.5 border rounded-none whitespace-nowrap ${c.status === "completed" ? "bg-emerald-950/40 border-emerald-800 text-emerald-300" : "bg-amber-950/40 border-amber-800 text-amber-300"}`}>
                        {c.status === "completed" ? "completed" : "in-progress"}
                      </span>
                    </div>
                  </div>
                ))}
                {(siteCourses ?? COURSES).length === 0 && <p className="text-zinc-600 text-xs text-center py-6">No courses yet.</p>}
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-zinc-900/80 via-zinc-900/40 to-transparent" aria-hidden />
            </div>
          </Card>

          {/* YOUTUBE — terminal themed */}
          <Card className="md:col-span-6" delay={460}>
            <Prompt cmd="mpv --playlist youtube.m3u --channel ixi_flower" />
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-1">
              <div className="lg:col-span-3">
                <div className="flex items-center justify-between px-2 py-1 bg-zinc-800 border border-zinc-700 border-b-0 text-[10px] font-mono">
                  <span className="flex items-center gap-1.5 text-zinc-400"><svg width={12} height={12} viewBox="0 0 24 24" fill="#ef4444" className="shrink-0"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg> youtube — ixi_flower</span>
                  <span className="flex gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /><span className="h-2 w-2 rounded-full bg-yellow-500" /><span className="h-2 w-2 rounded-full bg-green-500" /></span>
                </div>
                <div className="border border-zinc-800 bg-black overflow-hidden">
                  <div className="relative aspect-video">
                    <iframe
                      src="https://www.youtube.com/embed/NQJa6Las1Jw"
                      title="YouTube — ixi_flower"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                    />
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2 flex flex-col justify-between gap-3 py-1">
                <div>
                  <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1.5"><svg width={11} height={11} viewBox="0 0 24 24" fill="#ef4444" className="shrink-0"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg> now playing</div>
                  <div className="text-sm font-bold text-zinc-100 mt-1.5 leading-tight text-right" dir="rtl">پیدا کردن هر فایلی زیر ۱ ثانیه! 😳⚡</div>
                  <div className="text-[11px] text-zinc-500 mt-1 font-mono flex items-center gap-1"><svg width={11} height={11} viewBox="0 0 24 24" fill="#ef4444" className="shrink-0"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg> ixi_flower · YouTube · tools</div>
                  <p className="text-xs text-zinc-400 mt-3 leading-relaxed">Tutorials, tools, and things I learn — captured on video. New uploads weekly — quick tips, deep dives, and behind-the-scenes.</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  <a href="https://youtube.com/@ixi_flower0" target="_blank" rel="noopener noreferrer" className="yt-shine inline-flex items-center gap-2 px-4 py-2 bg-red-600 border border-red-500 text-white hover:bg-red-500 text-xs font-mono transition-all shadow-[0_0_14px_rgba(239,68,68,0.45)] hover:shadow-[0_0_22px_rgba(239,68,68,0.7)] hover:border-red-400">
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                    Visit channel ↗
                  </a>
                </div>
              </div>
            </div>
          </Card>

          {/* FOOTER CONNECT */}
          <Card className="md:col-span-6" delay={500}>
            <div className="text-center">
              <pre className="inline-block text-xs text-zinc-500 leading-tight">+-----------------------+{"\n"}|     CONNECT WITH ME    |{"\n"}+-----------------------+</pre>
            </div>
            <Prompt cmd="ssh-connect --social" />
            <div className="flex justify-center gap-3">
              {FOOTER_SOCIALS_BASE.map((s) => {
                const Ico = iconMap[s.icon as string] ?? IconGithub;
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

        <div className="text-center text-[10px] text-zinc-600 mt-6 font-mono">© 2026 ixiflower — crafted with Next.js · terminal soul · code & coffee</div>
      </div>
      {showAllBlogs && (
        <BlogsAllModal
          blogs={(apiPosts ?? (BLOGS as unknown as Blog[]))}
          onClose={() => setShowAllBlogs(false)}
          onSelect={(b) => setSelectedBlog(b)}
        />
      )}
      {selectedBlog && <BlogModal blog={selectedBlog} onClose={() => setSelectedBlog(null)} />}
    </main>
  );
}
