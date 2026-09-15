import {
  pgTable,
  text,
  varchar,
  timestamp,
  serial,
  integer,
  index,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";

// — Posts (bilingual EN + FA; FA nullable, fallback to EN) —
export const posts = pgTable(
  "posts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: varchar("slug", { length: 160 }).notNull().unique(),
    slugFa: varchar("slug_fa", { length: 160 }),
    title: varchar("title", { length: 240 }).notNull(),
    titleFa: varchar("title_fa", { length: 240 }),
    excerpt: varchar("excerpt", { length: 500 }),
    excerptFa: varchar("excerpt_fa", { length: 500 }),
    content: text("content").notNull(), // HTML from Tiptap
    contentFa: text("content_fa"),
    coverUrl: text("cover_url"),
    coverPublicId: text("cover_public_id"),
    status: varchar("status", { length: 20 }).notNull().default("draft"), // draft | published
    sortOrder: integer("sort_order").notNull().default(0),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    authorId: text("author_id"),
    metaTitle: varchar("meta_title", { length: 240 }),
    metaTitleFa: varchar("meta_title_fa", { length: 240 }),
    metaDescription: varchar("meta_description", { length: 400 }),
    metaDescriptionFa: varchar("meta_description_fa", { length: 400 }),
  },
  (t) => [
    index("posts_status_idx").on(t.status),
    index("posts_published_idx").on(t.status, t.publishedAt),
    index("posts_slug_idx").on(t.slug),
  ]
);

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 80 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const postTags = pgTable(
  "post_tags",
  {
    id: serial("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [
    index("post_tags_post_idx").on(t.postId),
    index("post_tags_tag_idx").on(t.tagId),
    uniqueIndex("post_tags_uniq").on(t.postId, t.tagId),
  ]
);

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 240 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 80 }).primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const postReactions = pgTable(
  "post_reactions",
  {
    id: serial("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    fingerprint: varchar("fingerprint", { length: 120 }).notNull(),
    kind: varchar("kind", { length: 10 }).notNull(), // like | dislike
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("post_reactions_post_idx").on(t.postId),
    uniqueIndex("post_reactions_uniq").on(t.postId, t.fingerprint),
  ]
);

// — Notes (Trilium-style hierarchical notes, Tiptap HTML) —
export const notes = pgTable(
  "notes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    parentId: text("parent_id").references((): any => notes.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 240 }).notNull(),
    content: text("content").notNull().default(""),
    icon: varchar("icon", { length: 40 }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("notes_parent_idx").on(t.parentId),
    index("notes_sort_idx").on(t.parentId, t.sortOrder),
  ]
);

export const bookmarks = pgTable(
  "bookmarks",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: varchar("title", { length: 240 }).notNull(),
    url: text("url").notNull(),
    description: varchar("description", { length: 500 }),
    favicon: text("favicon"),
    folder: varchar("folder", { length: 80 }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("bookmarks_sort_idx").on(t.sortOrder), index("bookmarks_folder_idx").on(t.folder)]
);

// — Vault (high-security password manager — AES-256-GCM, key = ADMIN_JWT_SECRET) —
export const vaultEntries = pgTable(
  "vault_entries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: varchar("title", { length: 240 }).notNull(),
    site: varchar("site", { length: 500 }),
    username: varchar("username", { length: 240 }),
    encCiphertext: text("enc_ciphertext").notNull(), // base64
    encIv: text("enc_iv").notNull(), // base64 (12 bytes)
    encTag: text("enc_tag").notNull(), // base64 (16 bytes, GCM auth tag)
    notes: varchar("notes", { length: 500 }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("vault_sort_idx").on(t.sortOrder), index("vault_site_idx").on(t.site)]
);

export type PostRow = typeof posts.$inferSelect;
export type TagRow = typeof tags.$inferSelect;
export type AdminUserRow = typeof adminUsers.$inferSelect;
export type SiteSettingRow = typeof siteSettings.$inferSelect;
export type NoteRow = typeof notes.$inferSelect;
export type BookmarkRow = typeof bookmarks.$inferSelect;
export type VaultEntryRow = typeof vaultEntries.$inferSelect;
