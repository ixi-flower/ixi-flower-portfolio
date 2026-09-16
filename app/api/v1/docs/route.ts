export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://ixiflower.vercel.app";

const SCOPES = ["*", "blog:read", "blog:write", "notes:read", "notes:write", "bookmarks:read", "bookmarks:write", "vault:read", "vault:reveal", "vault:write", "site-content:read", "site-content:write", "upload:write"] as const;

type Ep = { method: string; path: string; auth: string; scope: string; desc: string };
const ENDPOINTS: Ep[] = [
  { method: "GET", path: "/api/v1/health", auth: "none", scope: "—", desc: "Health + token introspection · no auth" },
  { method: "GET", path: "/api/v1/docs", auth: "none", scope: "—", desc: "This doc · HTML in browser, JSON with Accept: application/json or ?format=json" },

  { method: "GET", path: "/api/v1/blog?q=&tag=&page=&status=", auth: "Bearer", scope: "blog:read", desc: "List posts · public shows published only · status filter needs owner/token" },
  { method: "POST", path: "/api/v1/blog", auth: "Bearer", scope: "blog:write", desc: "Create · {title, content, slug?, excerpt?, coverUrl?, status?, tags?}" },
  { method: "GET", path: "/api/v1/blog/:id", auth: "Bearer", scope: "blog:read", desc: "Get by id" },
  { method: "PATCH", path: "/api/v1/blog/:id", auth: "Bearer", scope: "blog:write", desc: "Update · partial" },
  { method: "DELETE", path: "/api/v1/blog/:id", auth: "Bearer", scope: "blog:write", desc: "Delete" },
  { method: "PUT", path: "/api/v1/blog/reorder", auth: "Bearer", scope: "blog:write", desc: "Reorder · {orderedIds: string[]}" },

  { method: "GET", path: "/api/v1/site-content?key=", auth: "Bearer", scope: "site-content:read", desc: "Get site_settings · playlist | waka | tech | courses | profile | banner or all" },
  { method: "PUT", path: "/api/v1/site-content", auth: "Bearer", scope: "site-content:write", desc: "Put · {key, value} · zod-validated" },

  { method: "GET", path: "/api/v1/notes", auth: "Bearer", scope: "notes:read", desc: "List notes" },
  { method: "POST", path: "/api/v1/notes", auth: "Bearer", scope: "notes:write", desc: "Create · {title, content?, parentId?, icon?}" },
  { method: "GET", path: "/api/v1/notes/:id", auth: "Bearer", scope: "notes:read", desc: "Get note" },
  { method: "PATCH", path: "/api/v1/notes/:id", auth: "Bearer", scope: "notes:write", desc: "Update" },
  { method: "DELETE", path: "/api/v1/notes/:id", auth: "Bearer", scope: "notes:write", desc: "Delete" },
  { method: "PUT", path: "/api/v1/notes/reorder", auth: "Bearer", scope: "notes:write", desc: "Reorder · {orderedIds}" },

  { method: "GET", path: "/api/v1/bookmarks", auth: "Bearer", scope: "bookmarks:read", desc: "List bookmarks" },
  { method: "POST", path: "/api/v1/bookmarks", auth: "Bearer", scope: "bookmarks:write", desc: "Create · {title, url, folder?, description?, favicon?}" },
  { method: "GET", path: "/api/v1/bookmarks/:id", auth: "Bearer", scope: "bookmarks:read", desc: "Get bookmark" },
  { method: "PATCH", path: "/api/v1/bookmarks/:id", auth: "Bearer", scope: "bookmarks:write", desc: "Update" },
  { method: "DELETE", path: "/api/v1/bookmarks/:id", auth: "Bearer", scope: "bookmarks:write", desc: "Delete" },
  { method: "PUT", path: "/api/v1/bookmarks/reorder", auth: "Bearer", scope: "bookmarks:write", desc: "Reorder · {orderedIds}" },

  { method: "GET", path: "/api/v1/vault?q=", auth: "Bearer", scope: "vault:read", desc: "List vault · never reveals passwords in bulk" },
  { method: "POST", path: "/api/v1/vault", auth: "Bearer", scope: "vault:write", desc: "Create · {title, password, site?, username?, notes?}" },
  { method: "GET", path: "/api/v1/vault/:id?reveal=1", auth: "Bearer", scope: "vault:reveal", desc: "Get · ?reveal=1 decrypts (needs vault:reveal) else metadata only" },
  { method: "PATCH", path: "/api/v1/vault/:id", auth: "Bearer", scope: "vault:write", desc: "Update · re-encrypts" },
  { method: "DELETE", path: "/api/v1/vault/:id", auth: "Bearer", scope: "vault:write", desc: "Delete" },
  { method: "GET", path: "/api/v1/vault/export", auth: "Bearer", scope: "vault:reveal", desc: "Bulk export · all decrypted · capped 500" },
  { method: "POST", path: "/api/v1/vault/import?mode=merge|replace&confirm=1", auth: "Bearer", scope: "vault:write", desc: "Bulk import · JSON or CSV · max 500" },
  { method: "PUT", path: "/api/v1/vault/reorder", auth: "Bearer", scope: "vault:write", desc: "Reorder · {orderedIds}" },
];

const GROUPS: { title: string; icon: string; paths: string[] }[] = [
  { title: "Health", icon: "◉", paths: ["/api/v1/health", "/api/v1/docs"] },
  { title: "Blog", icon: "✎", paths: ["/api/v1/blog", "/api/v1/blog/:id", "/api/v1/blog/reorder"] },
  { title: "Site Content", icon: "◈", paths: ["/api/v1/site-content"] },
  { title: "Notes", icon: "▤", paths: ["/api/v1/notes", "/api/v1/notes/:id", "/api/v1/notes/reorder"] },
  { title: "Bookmarks", icon: "⬢", paths: ["/api/v1/bookmarks", "/api/v1/bookmarks/:id", "/api/v1/bookmarks/reorder"] },
  { title: "Vault", icon: "⬣", paths: ["/api/v1/vault", "/api/v1/vault/:id", "/api/v1/vault/export", "/api/v1/vault/import", "/api/v1/vault/reorder"] },
];

function methodClass(m: string) {
  if (m === "GET") return "m-get";
  if (m === "POST") return "m-post";
  if (m === "PATCH") return "m-patch";
  if (m === "DELETE") return "m-del";
  if (m === "PUT") return "m-put";
  return "";
}
function scopeClass(s: string) {
  if (s === "*") return "s-all";
  if (s === "—") return "s-none";
  if (s.includes("reveal")) return "s-reveal";
  if (s.includes(":write")) return "s-write";
  return "s-read";
}

function buildHtml(base: string) {
  const groupsHtml = GROUPS.map((g) => {
    const eps = ENDPOINTS.filter((e) => g.paths.some((p) => e.path.startsWith(p.split("?")[0].split(":")[0].replace(/\/$/, "")) || e.path === p || e.path.startsWith(p)));
    // fallback: if filter missed due to query, match loosely
    const uniq = Array.from(new Map(eps.map((e) => [`${e.method}:${e.path}`, e])).values());
    const rows = uniq
      .map(
        (e) => `
      <div class="ep" data-method="${e.method}" data-path="${e.path.toLowerCase()}" data-scope="${e.scope.toLowerCase()}" data-desc="${e.desc.toLowerCase().replace(/"/g, "&quot;")}">
        <div class="ep-top">
          <span class="badge ${methodClass(e.method)}">${e.method}</span>
          <code class="ep-path">${e.path}</code>
          <span class="scope ${scopeClass(e.scope)}" title="required scope">${e.scope}</span>
          <button class="copy" data-copy="curl — ${e.method} ${e.path}" data-method="${e.method}" data-path="${e.path}" aria-label="Copy curl">copy curl</button>
        </div>
        <div class="ep-desc">${e.desc} <span class="auth-dot ${e.auth === "none" ? "auth-none" : "auth-bearer"}">${e.auth === "none" ? "no auth" : "Bearer ixi_pat_…"}</span></div>
      </div>`
      )
      .join("");
    return `
    <section class="group" data-group="${g.title.toLowerCase()}">
      <div class="group-head">
        <span class="group-icon">${g.icon}</span>
        <h2 class="group-title">${g.title}</h2>
        <span class="group-count">${uniq.length}</span>
        <span class="group-line"></span>
      </div>
      <div class="ep-list">${rows}</div>
    </section>`;
  }).join("");

  const scopeChips = SCOPES.map((s) => `<span class="chip ${scopeClass(s)}">${s}</span>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>ixi-wave API v1 — docs</title>
<meta name="color-scheme" content="dark" />
<style>
  @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;700&family=Geist:wght@400;600;700&display=swap');
  *{box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{margin:0;background:#09090b;color:#e4e4e7;font-family:"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace;-webkit-font-smoothing:antialiased}
  a{color:inherit}
  /* bg */
  .bg-grid{position:fixed;inset:0;pointer-events:none;opacity:.35;
    background:
      linear-gradient(to right, rgba(113,113,122,.07) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(113,113,122,.07) 1px, transparent 1px);
    background-size:32px 32px;
    mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, #000 60%, transparent 110%);
  }
  .glow{position:fixed;pointer-events:none;inset:0;overflow:hidden}
  .glow::before{content:"";position:absolute;left:50%;top:-180px;transform:translateX(-50%);width:900px;height:520px;background:radial-gradient(ellipse at center, rgba(56,189,248,.18), transparent 65%), radial-gradient(ellipse at 30% 40%, rgba(251,146,60,.10), transparent 60%), radial-gradient(ellipse at 70% 30%, rgba(16,185,129,.10), transparent 60%);filter:blur(8px)}
  .wrap{position:relative;max-width:1120px;margin:0 auto;padding:24px 16px 48px}
  @media(min-width:640px){.wrap{padding:32px 24px 64px}}
  /* header terminal */
  .term{border:1px solid #27272a;background:rgba(24,24,27,.72);backdrop-filter:blur(8px);border-radius:14px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.03) inset}
  .term-bar{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid #27272a;background:linear-gradient(to bottom, #18181b, #0f0f12)}
  .dots{display:flex;gap:6px}
  .dot{width:9px;height:9px;border-radius:50%}
  .dot.r{background:#fb2c36;box-shadow:0 0 8px rgba(251,44,54,.5)}
  .dot.y{background:#f59e0b}
  .dot.g{background:#10b981}
  .bar-title{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#71717a;margin-left:8px}
  .bar-right{margin-left:auto;display:flex;gap:8px;align-items:center}
  .pill{font-size:10px;letter-spacing:.08em;text-transform:uppercase;padding:4px 8px;border-radius:999px;border:1px solid #27272a;background:#09090b;color:#a1a1aa}
  .pill.live{border-color:rgba(16,185,129,.35);color:#6ee7b7;background:rgba(16,185,129,.12)}
  .pill.live i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#10b981;margin-right:6px;box-shadow:0 0 8px #10b981;animation:pulse 1.6s infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}
  .hero{padding:22px 18px 18px;display:grid;gap:18px}
  @media(min-width:860px){.hero{grid-template-columns:1.15fr .85fr;padding:28px 24px 22px}}
  .h-title{font-family:"Geist", system-ui, sans-serif;font-weight:800;letter-spacing:-.04em;line-height:.95;font-size:30px;color:#fafafa}
  @media(min-width:640px){.h-title{font-size:38px}}
  .h-title span{color:#fbbf24;text-shadow:0 0 18px rgba(251,191,36,.35)}
  .h-title em{font-style:normal;color:#7dd3fc}
  .h-sub{margin-top:10px;color:#a1a1aa;font-size:13px;line-height:1.6;max-width:560px}
  .h-sub b{color:#e4e4e7;font-weight:600}
  .meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}
  .meta{border:1px solid #27272a;background:#09090b;border-radius:10px;padding:10px 12px}
  .meta k{display:block;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#71717a;margin-bottom:6px}
  .meta v{font-size:13px;color:#fafafa;word-break:break-all}
  .meta v.mono{font-family:"Geist Mono", monospace}
  .actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
  .btn{appearance:none;border:1px solid #27272a;background:#fafafa;color:#09090b;padding:9px 14px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;transition:.15s}
  .btn:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(0,0,0,.25)}
  .btn.ghost{background:#18181b;color:#e4e4e7;border-color:#3f3f46}
  .btn.ghost:hover{background:#27272a;border-color:#52525b}
  .btn.small{padding:7px 10px;font-size:12px;border-radius:8px}
  /* right code */
  .code{border:1px solid #27272a;background:#09090b;border-radius:12px;overflow:hidden}
  .code-head{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid #27272a;background:#0f0f12}
  .code-head span{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#71717a}
  .code pre{margin:0;padding:14px 12px;overflow:auto;font-size:12.5px;line-height:1.65;color:#d4d4d8}
  .tok-k{color:#7dd3fc} .tok-s{color:#fde68a} .tok-c{color:#71717a} .tok-v{color:#86efac}
  /* nav */
  .nav{margin-top:16px;display:flex;gap:8px;flex-wrap:wrap}
  .nav a{font-size:11px;letter-spacing:.06em;text-transform:uppercase;padding:7px 10px;border:1px solid #27272a;background:rgba(24,24,27,.6);border-radius:999px;color:#a1a1aa;text-decoration:none;backdrop-filter:blur(6px)}
  .nav a:hover{color:#fafafa;border-color:#3f3f46}
  /* toolbar */
  .toolbar{margin-top:18px;border:1px solid #27272a;background:rgba(24,24,27,.6);backdrop-filter:blur(8px);border-radius:12px;padding:10px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
  .search{flex:1 1 220px;display:flex;align-items:center;gap:8px;background:#09090b;border:1px solid #27272a;border-radius:10px;padding:8px 10px}
  .search input{flex:1;background:transparent;border:0;outline:0;color:#fafafa;font-family:"Geist Mono", monospace;font-size:13px}
  .search input::placeholder{color:#52525b}
  .tabs{display:flex;gap:6px;flex-wrap:wrap}
  .tab{padding:7px 10px;border-radius:999px;border:1px solid #27272a;background:#09090b;color:#a1a1aa;font-size:11px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer}
  .tab.on{background:#fafafa;color:#09090b;border-color:#fafafa}
  /* sections */
  .layout{display:grid;gap:16px;margin-top:16px}
  @media(min-width:980px){.layout{grid-template-columns:300px 1fr}}
  .side{position:sticky;top:16px;align-self:start;display:grid;gap:12px}
  .card{border:1px solid #27272a;background:rgba(24,24,27,.55);backdrop-filter:blur(8px);border-radius:12px;overflow:hidden}
  .card h3{margin:0;padding:12px 14px;border-bottom:1px solid #27272a;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#e4e4e7;background:linear-gradient(to bottom, rgba(39,39,42,.6), transparent)}
  .card-body{padding:12px 14px}
  .kv{display:grid;gap:10px}
  .kv div{border:1px dashed #27272a;background:#09090b;border-radius:10px;padding:10px 12px}
  .kv k{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#71717a;display:block;margin-bottom:6px}
  .kv v{font-size:12px;color:#d4d4d8;word-break:break-all;line-height:1.5}
  .chip{display:inline-flex;align-items:center;padding:4px 8px;border-radius:999px;border:1px solid #27272a;background:#09090b;font-size:11px;letter-spacing:.02em;margin:3px 4px 0 0}
  .s-all{color:#6ee7b7;border-color:rgba(16,185,129,.35);background:rgba(16,185,129,.12)}
  .s-read{color:#7dd3fc;border-color:rgba(56,189,248,.35);background:rgba(56,189,248,.10)}
  .s-write{color:#fde68a;border-color:rgba(251,191,36,.35);background:rgba(251,191,36,.12)}
  .s-reveal{color:#fca5a5;border-color:rgba(248,113,113,.35);background:rgba(248,113,113,.12)}
  .s-none{color:#71717a}
  .hint{font-size:11px;color:#71717a;line-height:1.6}
  .hint b{color:#a1a1aa}
  /* groups */
  .group{border:1px solid #27272a;background:rgba(24,24,27,.45);backdrop-filter:blur(8px);border-radius:12px;overflow:hidden}
  .group-head{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid #27272a;background:linear-gradient(to right, rgba(39,39,42,.55), transparent)}
  .group-icon{width:26px;height:26px;display:grid;place-items:center;border:1px solid #3f3f46;background:#09090b;border-radius:8px;color:#fafafa;font-size:12px}
  .group-title{font-family:"Geist", sans-serif;font-weight:700;letter-spacing:-.02em;color:#fafafa;font-size:14px}
  .group-count{font-size:11px;color:#71717a;border:1px solid #27272a;background:#09090b;padding:2px 7px;border-radius:999px}
  .group-line{flex:1;height:1px;background:linear-gradient(to right, #27272a, transparent);margin-left:8px}
  .ep-list{display:grid}
  .ep{padding:12px 14px;border-top:1px solid rgba(39,39,42,.6);display:grid;gap:8px}
  .ep:first-child{border-top:0}
  .ep:hover{background:rgba(39,39,42,.25)}
  .ep-top{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
  .badge{font-size:10px;letter-spacing:.08em;text-transform:uppercase;padding:4px 7px;border-radius:999px;border:1px solid #27272a;font-weight:700}
  .m-get{color:#6ee7b7;border-color:rgba(16,185,129,.4);background:rgba(16,185,129,.14)}
  .m-post{color:#7dd3fc;border-color:rgba(56,189,248,.4);background:rgba(56,189,248,.14)}
  .m-patch{color:#fde68a;border-color:rgba(251,191,36,.4);background:rgba(251,191,36,.14)}
  .m-del{color:#fca5a5;border-color:rgba(248,113,113,.4);background:rgba(248,113,113,.14)}
  .m-put{color:#c4b5fd;border-color:rgba(167,139,250,.4);background:rgba(167,139,250,.14)}
  .ep-path{font-size:13px;color:#fafafa;background:#09090b;border:1px solid #27272a;padding:4px 8px;border-radius:8px;word-break:break-all}
  .scope{font-size:10px;letter-spacing:.06em;text-transform:uppercase;padding:4px 7px;border-radius:999px;border:1px solid #27272a}
  .copy{margin-left:auto;font-size:11px;padding:6px 9px;border-radius:8px;border:1px solid #3f3f46;background:#18181b;color:#e4e4e7;cursor:pointer}
  .copy:hover{background:#27272a}
  .copy.ok{border-color:rgba(16,185,129,.4);color:#6ee7b7;background:rgba(16,185,129,.12)}
  .ep-desc{font-size:12px;color:#a1a1aa;line-height:1.5}
  .auth-dot{margin-left:6px;font-size:10px;letter-spacing:.06em;text-transform:uppercase;padding:3px 6px;border-radius:999px;border:1px solid #27272a}
  .auth-none{color:#71717a;background:#09090b}
  .auth-bearer{color:#fde68a;border-color:rgba(251,191,36,.35);background:rgba(251,191,36,.10)}
  .foot{margin-top:18px;border:1px solid #27272a;background:rgba(24,24,27,.45);border-radius:12px;padding:14px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between}
  .foot span{font-size:11px;color:#71717a}
  .foot b{color:#e4e4e7}
  .toast{position:fixed;right:16px;bottom:16px;z-index:50;max-width:360px;pointer-events:none}
  .toast div{margin-top:8px;padding:10px 12px;border-radius:10px;border:1px solid #27272a;background:#18181b;color:#fafafa;font-size:12px;box-shadow:0 16px 40px rgba(0,0,0,.5);animation:slide .22s ease}
  .toast .ok{border-color:rgba(16,185,129,.4);background:rgba(16,185,129,.12);color:#a7f3d0}
  .toast .err{border-color:rgba(248,113,113,.4);background:rgba(248,113,113,.12);color:#fecaca}
  @keyframes slide{from{transform:translateY(6px);opacity:0}to{transform:none;opacity:1}}
  .hidden{display:none !important}
</style>
</head>
<body>
<div class="bg-grid"></div><div class="glow"></div>
<div class="wrap">
  <div class="term">
    <div class="term-bar">
      <div class="dots"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span></div>
      <span class="bar-title">ixi-wave — api v1 · terminal docs</span>
      <div class="bar-right">
        <span class="pill live"><i></i> live</span>
        <span class="pill" id="basePill">ixiflower.vercel.app</span>
        <a class="pill" href="/api/v1/health" target="_blank" style="text-decoration:none">health ↗</a>
      </div>
    </div>
    <div class="hero">
      <div>
        <div class="h-title">ixi-wave <span>API</span> <em>v1</em><br/>100% bridge — token based</div>
        <div class="h-sub">One token <b>ixi_pat_…</b> for everything — blog, notes, bookmarks, vault, site-content. Owner JWT still works on <b>/api/v1/*</b>. Tokens are <b>SHA-256</b> hashed at rest, only the <b>prefix</b> is shown. <b>*</b> wildcard grants all scopes. Vault bulk lists never leak passwords — use <b>?reveal=1</b> or <b>/export</b> with <b>vault:reveal</b>.</div>
        <div class="meta-grid">
          <div class="meta"><k>base url</k><v class="mono" id="baseVal">${base}</v></div>
          <div class="meta"><k>auth header</k><v class="mono">Authorization: Bearer ixi_pat_…</v></div>
          <div class="meta"><k>alt headers</k><v class="mono">x-api-token: ixi_pat_…<br/>?token=ixi_pat_…</v></div>
          <div class="meta"><k>create token</k><v class="mono">POST /api/admin/api-tokens<br/><span style="color:#71717a">owner JWT required · shown once</span></v></div>
        </div>
        <div class="actions">
          <button class="btn" id="btnCopyBase">Copy base URL</button>
          <a class="btn ghost" href="/admin/api">Manage tokens →</a>
          <button class="btn ghost" id="btnCopyCurl">Copy quick curl</button>
          <a class="btn ghost" href="?format=json">View JSON</a>
        </div>
        <div class="nav">
          <a href="#auth">Auth & scopes</a>
          <a href="#quick">Quick start</a>
          <a href="#endpoints">Endpoints</a>
          <a href="#vault-note">Vault rules</a>
        </div>
      </div>
      <div class="code">
        <div class="code-head"><span>quick start — shell</span><button class="btn small ghost" data-copy-block="qs">Copy</button></div>
        <pre id="qsBlock"><span class="tok-c"># 1 — create a token (owner cookie)</span>
<span class="tok-k">curl</span> -X POST <span class="tok-s" data-base-replace>${base}</span><span class="tok-v">/api/admin/api-tokens</span> \\
  -H <span class="tok-s">"Cookie: ixi_admin_token=..."</span> \\
  -H <span class="tok-s">"Content-Type: application/json"</span> \\
  -d <span class="tok-s">'{"name":"my bot","scopes":["*"]}'</span>

<span class="tok-c"># 2 — use it anywhere on /api/v1/*</span>
<span class="tok-k">curl</span> <span class="tok-s" data-base-replace>${base}</span><span class="tok-v">/api/v1/blog</span> \\
  -H <span class="tok-s">"Authorization: Bearer ixi_pat_..."</span>

<span class="tok-c"># 3 — create a post</span>
<span class="tok-k">curl</span> -X POST <span class="tok-s" data-base-replace>${base}</span><span class="tok-v">/api/v1/blog</span> \\
  -H <span class="tok-s">"Authorization: Bearer ixi_pat_..."</span> \\
  -H <span class="tok-s">"Content-Type: application/json"</span> \\
  -d <span class="tok-s">'{"title":"Hello","content":"&lt;p&gt;hi&lt;/p&gt;","status":"draft"}'</span></pre>
      </div>
    </div>
  </div>

  <div class="toolbar">
    <label class="search" aria-label="Search endpoints">🔎 <input id="q" placeholder="Filter — try: vault, blog:write, POST, reorder…" autocomplete="off" /></label>
    <div class="tabs" id="tabs">
      <button class="tab on" data-tab="all">All · ${ENDPOINTS.length}</button>
      ${GROUPS.map((g) => `<button class="tab" data-tab="${g.title.toLowerCase()}">${g.title}</button>`).join("")}
    </div>
  </div>

  <div class="layout">
    <aside class="side">
      <div class="card" id="auth">
        <h3>Auth & scopes</h3>
        <div class="card-body" style="display:grid;gap:12px">
          <div class="kv">
            <div><k>header (preferred)</k><v>Authorization: Bearer ixi_pat_…</v></div>
            <div><k>alternatives</k><v>x-api-token: ixi_pat_…<br/>?token=ixi_pat_…</v></div>
            <div><k>owner bypass</k><v>If <b>ixi_admin_token</b> cookie/JWT is valid, scope checks are skipped — owner can call any /api/v1/* without a token.</v></div>
          </div>
          <div>
            <div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#71717a;margin-bottom:8px">Scopes</div>
            <div>${scopeChips}</div>
            <div class="hint" style="margin-top:8px"><b>*</b> = all · <b>vault:reveal</b> implies <b>vault:read</b> · bulk export needs <b>vault:reveal</b> · bulk list never returns passwords.</div>
          </div>
          <div class="kv">
            <div><k>rate & limits</k><v>No hard limit yet — be reasonable.<br/>Vault import/export capped at <b>500</b> entries.</v></div>
            <div><k>responses</k><v><b>401</b> missing/invalid token<br/><b>403</b> missing scope<br/><b>400</b> zod / validation</v></div>
          </div>
        </div>
      </div>
      <div class="card" id="quick">
        <h3>Try it</h3>
        <div class="card-body" style="display:grid;gap:10px">
          <div class="code" style="border-radius:10px">
            <div class="code-head"><span>health (no auth)</span><button class="btn small ghost" data-copy="curl \${base}/api/v1/health">Copy</button></div>
            <pre><span class="tok-k">curl</span> <span class="tok-s" data-base-replace>${base}</span><span class="tok-v">/api/v1/health</span></pre>
          </div>
          <div class="hint">Tip: open <a href="/api/v1/health" target="_blank" style="color:#7dd3fc">/api/v1/health</a> — if you send a token it echoes <b>via, scopes</b>.</div>
        </div>
      </div>
      <div class="card" id="vault-note">
        <h3>Vault rules</h3>
        <div class="card-body hint">
          <div>• <b>GET /vault</b> lists metadata only.</div>
          <div>• <b>GET /vault/:id</b> without <b>?reveal=1</b> hides password (needs <b>vault:read</b>).</div>
          <div>• <b>?reveal=1</b> decrypts (needs <b>vault:reveal</b>).</div>
          <div>• <b>GET /vault/export</b> bulk decrypts (needs <b>vault:reveal</b>).</div>
          <div>• <b>POST /vault/import</b> accepts JSON <b>{entries|vault|items}</b> or CSV, <b>?mode=replace&confirm=1</b> to wipe first.</div>
        </div>
      </div>
    </aside>

    <main style="display:grid;gap:12px" id="endpoints">
      ${groupsHtml}
    </main>
  </div>

  <div class="foot">
    <span><b>ixi-wave</b> API v1 · <span id="footBase">${base}</span> · <a href="/api/v1/health" target="_blank" style="color:#7dd3fc">health</a> · <a href="/admin/api" style="color:#7dd3fc">admin/api</a> · <a href="?format=json" style="color:#71717a">json</a></span>
    <span>© 2026 Amirabbas Rouintan · terminal docs · <span style="color:#52525b">hash at rest · prefix shown · plaintext once</span></span>
  </div>
</div>

<div class="toast" id="toast"></div>
<script>
(function(){
  var base = (typeof window !== 'undefined' ? window.location.origin : '') || ${JSON.stringify(base)};
  var baseVal = document.getElementById('baseVal');
  var basePill = document.getElementById('basePill');
  var footBase = document.getElementById('footBase');
  if(baseVal) baseVal.textContent = base;
  if(basePill) basePill.textContent = base.replace(/^https?:\\/\\//,'');
  if(footBase) footBase.textContent = base;
  document.querySelectorAll('[data-base-replace]').forEach(function(el){ el.textContent = base; });

  function toast(msg, kind){
    var t=document.getElementById('toast'); if(!t) return;
    var d=document.createElement('div'); d.className=kind||''; d.textContent=msg;
    t.appendChild(d); setTimeout(function(){ d.style.opacity='0'; d.style.transform='translateY(4px)'; d.style.transition='.2s'; }, 2200);
    setTimeout(function(){ d.remove(); }, 2600);
  }
  async function copyText(s){
    try{ await navigator.clipboard.writeText(s); toast('Copied ✓','ok'); return true; }catch(e){
      var ta=document.createElement('textarea'); ta.value=s; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select();
      try{ document.execCommand('copy'); toast('Copied ✓','ok'); }catch(_){ toast('Copy failed','err'); }
      ta.remove(); return false;
    }
  }
  function curlFor(method, path){
    var clean = path.split('?')[0].replace(':id','123');
    var hasBody = method==='POST' || method==='PATCH' || method==='PUT';
    var body = '';
    if(clean.includes('/blog') && method==='POST') body = " -H \\"Content-Type: application/json\\" -d '{\\"title\\":\\"Hello\\",\\"content\\":\\"<p>hi</p>\\",\\"status\\":\\"draft\\"}'";
    else if(clean.includes('/notes') && method==='POST') body = " -H \\"Content-Type: application/json\\" -d '{\\"title\\":\\"New Note\\"}'";
    else if(clean.includes('/bookmarks') && method==='POST') body = " -H \\"Content-Type: application/json\\" -d '{\\"title\\":\\"My link\\",\\"url\\":\\"https://example.com\\"}'";
    else if(clean.includes('/vault') && method==='POST' && !clean.includes('import')) body = " -H \\"Content-Type: application/json\\" -d '{\\"title\\":\\"GitHub\\",\\"password\\":\\"s3cr3t\\"}'";
    else if(clean.includes('reorder')) body = " -H \\"Content-Type: application/json\\" -d '{\\"orderedIds\\":[\\"id1\\",\\"id2\\"]}'";
    else if(clean.includes('site-content') && method==='PUT') body = " -H \\"Content-Type: application/json\\" -d '{\\"key\\":\\"profile\\",\\"value\\":{}}'";
    else if(method==='PATCH') body = " -H \\"Content-Type: application/json\\" -d '{}'";
    var flag = method==='GET' ? '' : ' -X '+method;
    return 'curl'+flag+' '+base+clean+' -H "Authorization: Bearer ixi_pat_..."'+body;
  }

  document.getElementById('btnCopyBase')?.addEventListener('click', function(){ copyText(base); });
  document.getElementById('btnCopyCurl')?.addEventListener('click', function(){ copyText('curl '+base+'/api/v1/blog -H "Authorization: Bearer ixi_pat_..."'); });
  document.querySelectorAll('[data-copy-block="qs"]').forEach(function(b){
    b.addEventListener('click', function(){
      var pre=document.getElementById('qsBlock'); if(!pre) return;
      copyText(pre.innerText);
      b.textContent='Copied ✓'; b.classList.add('ok'); setTimeout(function(){ b.textContent='Copy'; }, 1400);
    });
  });
  document.querySelectorAll('.copy[data-method]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var m=btn.getAttribute('data-method')||'GET';
      var p=btn.getAttribute('data-path')||'/api/v1/health';
      copyText(curlFor(m,p));
      var old=btn.textContent; btn.textContent='copied ✓'; btn.classList.add('ok');
      setTimeout(function(){ btn.textContent=old; btn.classList.remove('ok'); }, 1400);
    });
  });
  document.querySelectorAll('[data-copy^="curl"]').forEach(function(btn){
    if(btn.hasAttribute('data-method')) return;
    btn.addEventListener('click', function(){
      var raw=btn.getAttribute('data-copy')||'';
      copyText(raw.replace('\\\${base}', base).replace('\${base}', base));
    });
  });

  var q=document.getElementById('q');
  var tabs=document.getElementById('tabs');
  var currentTab='all';
  function apply(){
    var needle=(q && q.value || '').trim().toLowerCase();
    document.querySelectorAll('.group').forEach(function(sec){
      var g=(sec.getAttribute('data-group')||'').toLowerCase();
      var showTab = currentTab==='all' || g===currentTab;
      var any=false;
      sec.querySelectorAll('.ep').forEach(function(ep){
        var hay=(ep.getAttribute('data-method')+' '+ep.getAttribute('data-path')+' '+ep.getAttribute('data-scope')+' '+ep.getAttribute('data-desc')).toLowerCase();
        var ok = !needle || hay.includes(needle);
        ep.classList.toggle('hidden', !ok);
        if(ok) any=true;
      });
      var hideGroup = !showTab || (!any && !!needle);
      sec.classList.toggle('hidden', hideGroup);
    });
  }
  q && q.addEventListener('input', apply);
  tabs && tabs.addEventListener('click', function(e){
    var t=e.target; if(!(t instanceof HTMLElement)) return;
    var b=t.closest('[data-tab]'); if(!b) return;
    currentTab=(b.getAttribute('data-tab')||'all').toLowerCase();
    tabs.querySelectorAll('.tab').forEach(function(x){ x.classList.toggle('on', x===b); });
    apply();
  });
})();
</script>
</body>
</html>`;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const accept = request.headers.get("accept") || "";
  const format = url.searchParams.get("format");

  const wantsJson =
    format === "json" ||
    (accept.includes("application/json") && !accept.includes("text/html"));

  // browser direct hit with no explicit json accept -> html
  if (!wantsJson && (format === "html" || accept.includes("text/html") || (!accept.includes("application/json") && !accept.includes("text/html")))) {
    // default to html for naked browser navigation; explicit ?format=json still wins above
    // if accept is */* (fetch without header) treat as html for human
    const html = buildHtml(BASE);
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  if (wantsJson) {
    return NextResponse.json(
      {
        name: "ixi-wave API v1",
        base: BASE,
        auth: {
          header: "Authorization: Bearer ixi_pat_...",
          alt: "x-api-token: ixi_pat_...  or  ?token=ixi_pat_...",
          create: "POST /api/admin/api-tokens (owner JWT required) — returns token once, store securely",
          scopes: [...SCOPES],
          note: "Token is SHA-256 hashed at rest; prefix shown in list. Wildcard * grants all. vault:reveal implies vault:read. Owner JWT cookie bypasses scope checks.",
        },
        rateLimit: "No hard limit yet — be reasonable. Bulk vault export/import capped at 500.",
        endpoints: ENDPOINTS,
        example: {
          createToken: `curl -X POST ${BASE}/api/admin/api-tokens -H "Cookie: ixi_admin_token=..." -H "Content-Type: application/json" -d '{"name":"my CI","scopes":["*"]}'`,
          useToken: `curl ${BASE}/api/v1/blog -H "Authorization: Bearer ixi_pat_..."`,
          createPost: `curl -X POST ${BASE}/api/v1/blog -H "Authorization: Bearer ixi_pat_..." -H "Content-Type: application/json" -d '{"title":"Hello","content":"<p>hi</p>","status":"draft"}'`,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  // fallback html
  const html = buildHtml(BASE);
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
