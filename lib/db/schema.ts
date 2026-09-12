import {
  pgTable,
  text,
  varchar,
  timestamp,
  serial,
  integer,
  index,
  uniqueIndex,
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

export type PostRow = typeof posts.$inferSelect;
export type TagRow = typeof tags.$inferSelect;
