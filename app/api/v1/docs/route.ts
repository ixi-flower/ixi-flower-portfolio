export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://ixiflower.vercel.app";

const ENDPOINTS = [
  { method: "GET", path: "/api/v1/health", auth: "none", scope: "—", desc: "Health + token introspection" },
  { method: "GET", path: "/api/v1/docs", auth: "none", scope: "—", desc: "This doc" },

  { method: "GET", path: "/api/v1/blog?q=&tag=&page=&status=", auth: "Bearer", scope: "blog:read", desc: "List posts (status filter requires owner scope; public listing without token shows published only)" },
  { method: "POST", path: "/api/v1/blog", auth: "Bearer", scope: "blog:write", desc: "Create post — {title, content, slug?, excerpt?, coverUrl?, status?, tags?}" },
  { method: "GET", path: "/api/v1/blog/:id", auth: "Bearer", scope: "blog:read", desc: "Get post by id" },
  { method: "PATCH", path: "/api/v1/blog/:id", auth: "Bearer", scope: "blog:write", desc: "Update post" },
  { method: "DELETE", path: "/api/v1/blog/:id", auth: "Bearer", scope: "blog:write", desc: "Delete post" },
  { method: "PUT", path: "/api/v1/blog/reorder", auth: "Bearer", scope: "blog:write", desc: "Reorder {orderedIds: string[]}" },

  { method: "GET", path: "/api/v1/site-content?key=", auth: "Bearer", scope: "site-content:read", desc: "Get site_settings (playlist|waka|tech|courses|profile|banner or all)" },
  { method: "PUT", path: "/api/v1/site-content", auth: "Bearer", scope: "site-content:write", desc: "Put site_settings — {key, value}" },

  { method: "GET", path: "/api/v1/notes", auth: "Bearer", scope: "notes:read", desc: "List notes" },
  { method: "POST", path: "/api/v1/notes", auth: "Bearer", scope: "notes:write", desc: "Create note — {title, content?, parentId?, icon?}" },
  { method: "GET", path: "/api/v1/notes/:id", auth: "Bearer", scope: "notes:read", desc: "Get note" },
  { method: "PATCH", path: "/api/v1/notes/:id", auth: "Bearer", scope: "notes:write", desc: "Update note" },
  { method: "DELETE", path: "/api/v1/notes/:id", auth: "Bearer", scope: "notes:write", desc: "Delete note" },
  { method: "PUT", path: "/api/v1/notes/reorder", auth: "Bearer", scope: "notes:write", desc: "Reorder {orderedIds}" },

  { method: "GET", path: "/api/v1/bookmarks", auth: "Bearer", scope: "bookmarks:read", desc: "List bookmarks" },
  { method: "POST", path: "/api/v1/bookmarks", auth: "Bearer", scope: "bookmarks:write", desc: "Create bookmark — {title, url, folder?, description?, favicon?}" },
  { method: "GET", path: "/api/v1/bookmarks/:id", auth: "Bearer", scope: "bookmarks:read", desc: "Get bookmark" },
  { method: "PATCH", path: "/api/v1/bookmarks/:id", auth: "Bearer", scope: "bookmarks:write", desc: "Update bookmark" },
  { method: "DELETE", path: "/api/v1/bookmarks/:id", auth: "Bearer", scope: "bookmarks:write", desc: "Delete bookmark" },
  { method: "PUT", path: "/api/v1/bookmarks/reorder", auth: "Bearer", scope: "bookmarks:write", desc: "Reorder {orderedIds}" },

  { method: "GET", path: "/api/v1/vault?q=", auth: "Bearer", scope: "vault:read", desc: "List vault entries (never reveals passwords in bulk)" },
  { method: "POST", path: "/api/v1/vault", auth: "Bearer", scope: "vault:write", desc: "Create vault entry — {title, password, site?, username?, notes?}" },
  { method: "GET", path: "/api/v1/vault/:id?reveal=1", auth: "Bearer", scope: "vault:reveal (or vault:read without reveal)", desc: "Get entry; ?reveal=1 decrypts password (requires vault:reveal)" },
  { method: "PATCH", path: "/api/v1/vault/:id", auth: "Bearer", scope: "vault:write", desc: "Update entry" },
  { method: "DELETE", path: "/api/v1/vault/:id", auth: "Bearer", scope: "vault:write", desc: "Delete entry" },
  { method: "GET", path: "/api/v1/vault/export", auth: "Bearer", scope: "vault:reveal", desc: "Bulk export all entries with decrypted passwords" },
  { method: "POST", path: "/api/v1/vault/import?mode=merge|replace&confirm=1", auth: "Bearer", scope: "vault:write", desc: "Bulk import JSON/CSV" },
  { method: "PUT", path: "/api/v1/vault/reorder", auth: "Bearer", scope: "vault:write", desc: "Reorder {orderedIds}" },
];

export async function GET() {
  return NextResponse.json({
    name: "ixi-wave API v1",
    base: BASE,
    auth: {
      header: "Authorization: Bearer ixi_pat_...",
      alt: "x-api-token: ixi_pat_...  or  ?token=ixi_pat_...",
      create: "POST /api/admin/api-tokens (owner JWT required) — returns token once, store securely",
      scopes: ["*", "blog:read", "blog:write", "notes:read", "notes:write", "bookmarks:read", "bookmarks:write", "vault:read", "vault:reveal", "vault:write", "site-content:read", "site-content:write", "upload:write"],
      note: "Token is SHA-256 hashed at rest; prefix shown in list. Wildcard * grants all.",
    },
    rateLimit: "No hard limit yet — be reasonable. Bulk vault export/import capped at 500.",
    endpoints: ENDPOINTS,
    example: {
      createToken: `curl -X POST ${BASE}/api/admin/api-tokens -H "Cookie: ixi_admin_token=..." -H "Content-Type: application/json" -d '{"name":"my CI","scopes":["*"]}'`,
      useToken: `curl ${BASE}/api/v1/blog -H "Authorization: Bearer ixi_pat_..."`,
      createPost: `curl -X POST ${BASE}/api/v1/blog -H "Authorization: Bearer ixi_pat_..." -H "Content-Type: application/json" -d '{"title":"Hello","content":"<p>hi</p>","status":"draft"}'`,
    },
  });
}
