CREATE TABLE "bookmarks" (
	"id" text PRIMARY KEY NOT NULL,
	"title" varchar(240) NOT NULL,
	"url" text NOT NULL,
	"description" varchar(500),
	"favicon" text,
	"folder" varchar(80),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" text PRIMARY KEY NOT NULL,
	"parent_id" text,
	"title" varchar(240) NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"icon" varchar(40),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_parent_id_notes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bookmarks_sort_idx" ON "bookmarks" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "bookmarks_folder_idx" ON "bookmarks" USING btree ("folder");--> statement-breakpoint
CREATE INDEX "notes_parent_idx" ON "notes" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "notes_sort_idx" ON "notes" USING btree ("parent_id","sort_order");