import { neon } from "@neondatabase/serverless";
const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL missing"); process.exit(1); }
const sql = neon(url);
await sql`CREATE TABLE IF NOT EXISTS "vault_entries" (
  "id" text PRIMARY KEY NOT NULL,
  "title" varchar(240) NOT NULL,
  "site" varchar(500),
  "username" varchar(240),
  "enc_ciphertext" text NOT NULL,
  "enc_iv" text NOT NULL,
  "enc_tag" text NOT NULL,
  "notes" varchar(500),
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
)`;
await sql`CREATE INDEX IF NOT EXISTS "vault_sort_idx" ON "vault_entries" USING btree ("sort_order")`;
await sql`CREATE INDEX IF NOT EXISTS "vault_site_idx" ON "vault_entries" USING btree ("site")`;
console.log("vault table ok");
