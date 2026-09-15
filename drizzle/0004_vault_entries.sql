CREATE TABLE "vault_entries" (
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
);
--> statement-breakpoint
CREATE INDEX "vault_sort_idx" ON "vault_entries" USING btree ("sort_order");
--> statement-breakpoint
CREATE INDEX "vault_site_idx" ON "vault_entries" USING btree ("site");
