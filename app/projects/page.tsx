"use client";
import Link from "next/link";

type Proj = {
  title: string;
  desc: string;
  tech: string[];
  href: string;
  site?: string;
  img?: string;
  lang: string;
  langColor: string;
};

const PROJECTS: Proj[] = [
  {
    title: "FilmShab",
    desc: "Cinema discovery platform — curated film lists, Drizzle + Neon, Next.js with image previews and editorial picks.",
    tech: ["Next.js", "Drizzle", "Neon", "Cinema"],
    href: "https://github.com/ixiflower",
    site: "https://filmshab.ir",
    img: "/filmshab-preview.jpg",
    lang: "TypeScript",
    langColor: "#3178c6",
  },
  {
    title: "Storipalorium",
    desc: "Minimal bookmark & snippet storage — full-text search, tag organization, clean reading-focused interface.",
    tech: ["Next.js", "Neon Auth", "Drizzle", "TypeScript"],
    href: "https://github.com/ixiflower/Storipalorium",
    site: "https://storipalorium.vercel.app",
    lang: "TypeScript",
    langColor: "#3178c6",
  },
  {
    title: "jitsi-infinity",
    desc: "Production Jitsi Meet on Docker — Python auto-scaler, Jibri recording, monitoring, autoscaling infra.",
    tech: ["Docker", "Python", "Lua", "Nginx"],
    href: "https://github.com/ixiflower/jitsi-infinity",
    lang: "Docker",
    langColor: "#2496ed",
  },
  {
    title: "Shimer",
    desc: "Time-tracking & productivity app from scratch with React Native (Expo) — timer, goals, analytics, calendar, vault.",
    tech: ["React Native", "Expo", "SQLite", "TypeScript"],
    href: "https://github.com/ixiflower/Shimer",
    lang: "TypeScript",
    langColor: "#3178c6",
  },
  {
    title: "trademind-bot",
    desc: "AI trading signal bot for Pocket Option & binary options — multi-indicator analysis across Crypto/Forex/Stocks.",
    tech: ["Python", "TA-Lib", "Telegram API", "Pandas"],
    href: "https://github.com/ixiflower/trademind-bot",
    lang: "Python",
    langColor: "#3776ab",
  },
  {
    title: "BotU",
    desc: "No-code Telegram bot builder with AI — build, configure and manage bots visually via a web dashboard + Gemini.",
    tech: ["React", "Django", "Gemini AI", "Docker"],
    href: "https://github.com/ixiflower/BotU",
    site: "https://freaky-botu.netlify.app",
    lang: "TypeScript",
    langColor: "#3178c6",
  },
  {
    title: "SERENE",
    desc: "Premium Shopify Hydrogen storefront — atmospheric hero, glassmorphic design, cart + Storefront API integration.",
    tech: ["Hydrogen", "React Router", "Tailwind", "GraphQL"],
    href: "https://github.com/ixiflower/serene",
    site: "https://serene-two-azure.vercel.app",
    lang: "TypeScript",
    langColor: "#3178c6",
  },
  {
    title: "ixi-News-BOT",
    desc: "Python Telegram news bot — fetches latest headlines, category filtering and clean formatting on schedule.",
    tech: ["Python", "Telegram Bot API", "AsyncIO"],
    href: "https://github.com/ixiflower/ixi-News-BOT",
    lang: "Python",
    langColor: "#3776ab",
  },
  {
    title: "polybot-tg",
    desc: "Auto-fetches MTProto proxies & V2Ray configs, pings for latency and posts the best to your channel.",
    tech: ["Python", "MTProto", "V2Ray", "Async"],
    href: "https://github.com/ixiflower/polybot-tg",
    lang: "Python",
    langColor: "#3776ab",
  },
  {
    title: "Sofra",
    desc: "Furniture Shopify Hydrogen storefront — handcrafted pieces, Storefront API, collections, soulful design.",
    tech: ["Hydrogen", "Shopify", "Tailwind", "React Router"],
    href: "https://sofra-three.vercel.app",
    site: "https://sofra-three.vercel.app",
    lang: "TypeScript",
    langColor: "#3178c6",
  },
];

export default function ProjectsPage() {
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
            ./projects<span className="animate-pulse">_</span>
          </h1>
          <div className="flex items-center text-xs mt-2 justify-center">
            <span className="text-zinc-500 mr-1">$</span>
            <span className="text-zinc-300 font-medium">find . -name &apos;*.project&apos; | sort</span>
            <span className="animate-pulse ml-1 text-zinc-300">_</span>
          </div>
        </div>

        <div className="text-center mb-4 text-zinc-600 hidden md:block">
          <pre className="text-xs leading-tight">
            {`
+----------------------------------------------------------------------+
|                                                                      |
|                        PROJECT REPOSITORY                            |
|                                                                      |
+----------------------------------------------------------------------+
`}
          </pre>
        </div>

        <div className="text-xs text-zinc-500 mb-3">
          <span className="text-zinc-600">$</span> ls -la ./projects — {PROJECTS.length} projects
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...PROJECTS].sort((a, b) => Number(!!b.site) - Number(!!a.site)).map((p) => (
            <div
              key={p.title}
              className="overflow-hidden border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-all duration-300 shadow-sm relative flex flex-col"
            >
              <div className="absolute top-1 right-1 text-zinc-700 text-[8px] leading-none z-10 pointer-events-none">
                <pre>+--+
|  |
+--+</pre>
              </div>

              {p.site ? (
                p.title === "FilmShab" && p.img ? (
                  <div className="aspect-video w-full bg-zinc-950 relative overflow-hidden">
                    {/* filmshab.ir blocks iframes (X-Frame-Options) — show image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.img} alt={p.title} className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-0 left-0 bg-zinc-900/80 px-2 py-1">
                      <span className="text-[10px] text-green-400">Active</span>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-zinc-950 relative overflow-hidden border-b border-zinc-800">
                    <iframe
                      src={p.site}
                      title={p.title}
                      className="w-[200%] h-[200%] origin-top-left scale-50 border-0 pointer-events-none"
                      loading="lazy"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    />
                    <div className="absolute inset-0" aria-hidden />
                    <div className="absolute top-0 left-0 bg-zinc-900/80 px-2 py-1">
                      <span className="text-[10px] text-green-400">Live</span>
                    </div>
                  </div>
                )
              ) : p.img ? (
                <div className="aspect-video w-full bg-zinc-950 relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.img} alt={p.title} className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-0 left-0 bg-zinc-900/80 px-2 py-1">
                    <span className="text-[10px] text-green-400">Active</span>
                  </div>
                </div>
              ) : (
                <div className="h-2 w-full" style={{ background: p.langColor }} />
              )}

              <div className="p-3 flex flex-col flex-grow">
                <div className="flex flex-col flex-grow">
                  <h2 className="font-medium text-zinc-100 text-sm">{p.title}</h2>
                  <p className="text-xs text-zinc-400 mb-2 mt-2 line-clamp-3">{p.desc}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {p.tech.map((t) => (
                      <span key={t} className="px-1.5 py-0.5 bg-zinc-800 text-[10px] text-zinc-300 border border-zinc-700">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 mb-3">
                    <span className="h-2 w-2 rounded-full" style={{ background: p.langColor }} /> {p.lang}
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={p.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 h-7 text-xs border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800">
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                      <path d="M9 18c-4.51 2-5-2-7-2" />
                    </svg>{" "}
                    Source
                  </a>
                  {p.site && (
                    <a href={p.site} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 h-7 text-xs border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800">
                      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M15 3h6v6" />
                        <path d="M10 14 21 3" />
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      </svg>{" "}
                      Demo
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center text-[10px] text-zinc-600 mt-8 font-mono">© 2026 ixiflower — crafted with Next.js · terminal soul · code & coffee</div>
      </div>
    </main>
  );
}
