CREATE TABLE "api_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"prefix" varchar(24) NOT NULL,
	"scopes" jsonb NOT NULL,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE INDEX "api_tokens_prefix_idx" ON "api_tokens" USING btree ("prefix");--> statement-breakpoint
CREATE INDEX "api_tokens_created_idx" ON "api_tokens" USING btree ("created_at");