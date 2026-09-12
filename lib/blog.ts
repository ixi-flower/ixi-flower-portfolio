import "server-only";
import { and, desc, eq, inArray, like, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts, tags, postTags } from "@/lib/db/schema";
import type { PostRow, TagRow } from "@/lib/db/schema";
import { slugify } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

export const POSTS_PER_PAGE = 10;

export type BlogStatus = "draft" | "published";

export interface BlogTag {
  id: number;
  slug: string;
  name: string;
}

export interface BlogPostInput {
  title?: string;
  titleFa?: string;
  slug?: string;
  slugFa?: string;
  excerpt?: string;
  excerptFa?: string;
  content?: string;
  contentFa?: string;
  coverUrl?: string;
  coverImage?: string; // legacy alias for coverUrl (filmshab compat)
  coverPublicId?: string;
  status?: BlogStatus;
  metaTitle?: string;
  metaTitleFa?: string;
  metaDescription?: string;
  metaDescriptionFa?: string;
  tags?: string[];
  authorId?: string;
  publishedAt?: Date | string | null;
}

// Re-export row type for consumers
export type { PostRow, TagRow };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toPublicPost(p: PostRow) {
  return {
    id: p.id,
    slug: p.slug,
    slugFa: p.slugFa,
    title: p.title,
    titleFa: p.titleFa,
    excerpt: p.excerpt,
    excerptFa: p.excerptFa,
    content: p.content,
    contentFa: p.contentFa,
    coverUrl: p.coverUrl,
    coverPublicId: p.coverPublicId,
    status: p.status,
    publishedAt: p.publishedAt,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    authorId: p.authorId,
    metaTitle: p.metaTitle,
    metaTitleFa: p.metaTitleFa,
    metaDescription: p.metaDescription,
    metaDescriptionFa: p.metaDescriptionFa,
  };
}

export { toPublicPost as publicPost };

// Normalise cover field: accept both `coverUrl` and legacy `coverImage`
function resolveCoverUrl(input: BlogPostInput): string | null | undefined {
  if (input.coverUrl !== undefined) return input.coverUrl;
  if (input.coverImage !== undefined) return input.coverImage;
  return undefined;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * List posts with optional filters and pagination.
 * Mirrors filmshab's getBlogPosts but async for neon-http.
 */
export async function getBlogPosts(opts: {
  status?: BlogStatus;
  q?: string;
  tag?: string;
  page?: number;
  perPage?: number;
}): Promise<{ posts: PostRow[]; total: number }> {
  const conds: ReturnType<typeof eq>[] | any[] = [];

  if (opts.status) {
    conds.push(eq(posts.status, opts.status));
  }

  if (opts.q) {
    // Escape `%` and `_` handled by Drizzle param binding; use LIKE with wildcards.
    const pattern = `%${opts.q}%`;
    const qCond = or(
      like(posts.title, pattern),
      like(posts.titleFa, pattern),
      like(posts.excerpt, pattern),
      like(posts.excerptFa, pattern),
      like(posts.content, pattern),
    );
    if (qCond) conds.push(qCond);
  }

  // Tag filter: resolve tag slug -> postIds via two queries (neon-http has no sub-query inArray with select builder as value on some versions, so fetch ids first)
  let tagPostIds: string[] | null = null;
  if (opts.tag) {
    const matchedTags = await db
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.slug, opts.tag));

    if (matchedTags.length === 0) return { posts: [], total: 0 };

    const tagIds = matchedTags.map((t) => t.id);
    const mappings = await db
      .select({ postId: postTags.postId })
      .from(postTags)
      .where(inArray(postTags.tagId, tagIds));

    tagPostIds = [...new Set(mappings.map((r) => r.postId))];
    if (tagPostIds.length === 0) return { posts: [], total: 0 };

    conds.push(inArray(posts.id, tagPostIds));
  }

  const where = conds.length ? and(...conds) : undefined;

  // Total count: fetch ids only then count length (simple + works on neon-http).
  // For large datasets a `select({ c: count() })` would be more efficient, but
  // this mirrors filmshab's `.all().length` approach.
  const allMatching = where
    ? await db.select({ id: posts.id }).from(posts).where(where)
    : await db.select({ id: posts.id }).from(posts);
  const total = allMatching.length;

  const page = Math.max(1, opts.page || 1);
  const perPage = Math.min(50, Math.max(1, opts.perPage || POSTS_PER_PAGE));
  const offset = (page - 1) * perPage;

  const rows = await db
    .select()
    .from(posts)
    .where(where)
    .orderBy(desc(posts.publishedAt), desc(posts.createdAt))
    .limit(perPage)
    .offset(offset);

  return { posts: rows as PostRow[], total };
}

export async function getBlogPostBySlug(slug: string, status?: BlogStatus): Promise<PostRow | null> {
  // Support both slug and slugFa (bilingual) — match either column.
  const slugCond = or(eq(posts.slug, slug), eq(posts.slugFa, slug));
  const where = status ? and(slugCond, eq(posts.status, status)) : slugCond;
  const rows = await db.select().from(posts).where(where).limit(1);
  return (rows[0] as PostRow | undefined) ?? null;
}

export async function getBlogPostById(id: string): Promise<PostRow | null> {
  const rows = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return (rows[0] as PostRow | undefined) ?? null;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * createBlogPost(authorId, input)  — filmshab-compatible signature
 * createBlogPost(input)             — when authorId is inside input or caller passes single object
 */
export async function createBlogPost(
  authorIdOrInput: string | BlogPostInput,
  maybeInput?: BlogPostInput,
): Promise<PostRow> {
  let authorId: string | null = null;
  let input: BlogPostInput;

  if (typeof authorIdOrInput === "string") {
    authorId = authorIdOrInput;
    input = maybeInput ?? {};
  } else {
    input = authorIdOrInput;
    authorId = input.authorId ?? null;
  }

  const now = new Date();
  const title = (input.title ?? "").trim();
  const status: BlogStatus = input.status === "published" ? "published" : "draft";

  // Validation is done in the route; but guard empty title here too.
  const slug = (input.slug?.trim() || slugify(title || "untitled")).trim();
  const slugFa = input.slugFa?.trim() || null;
  const coverUrl = resolveCoverUrl(input) ?? null;

  let publishedAt: Date | null = null;
  if (input.publishedAt !== undefined) {
    if (input.publishedAt === null) publishedAt = null;
    else if (input.publishedAt instanceof Date) publishedAt = input.publishedAt;
    else publishedAt = new Date(input.publishedAt);
  } else {
    publishedAt = status === "published" ? now : null;
  }

  const id = crypto.randomUUID();

  const row: typeof posts.$inferInsert = {
    id,
    slug,
    slugFa,
    title: title || "Untitled",
    titleFa: input.titleFa ?? null,
    excerpt: input.excerpt ?? null,
    excerptFa: input.excerptFa ?? null,
    content: input.content ?? "",
    contentFa: input.contentFa ?? null,
    coverUrl,
    coverPublicId: input.coverPublicId ?? null,
    status,
    publishedAt,
    authorId,
    metaTitle: input.metaTitle ?? null,
    metaTitleFa: input.metaTitleFa ?? null,
    metaDescription: input.metaDescription ?? null,
    metaDescriptionFa: input.metaDescriptionFa ?? null,
    // createdAt / updatedAt have defaultNow() — but set explicitly for consistency
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(posts).values(row);

  if (input.tags?.length) {
    await setPostTags(id, input.tags);
  }

  const created = await getBlogPostById(id);
  return created as PostRow;
}

export async function updateBlogPost(
  id: string,
  input: BlogPostInput,
): Promise<PostRow | null> {
  const existing = await getBlogPostById(id);
  if (!existing) return null;

  const now = new Date();

  // Resolve status: keep existing if not provided, else coerce
  let status: BlogStatus = existing.status as BlogStatus;
  if (input.status === "published" || input.status === "draft") status = input.status;

  const coverResolved = resolveCoverUrl(input);

  // publishedAt logic: when transitioning to published and no previous date, set now
  let publishedAt = existing.publishedAt as Date | null;
  if (input.publishedAt !== undefined) {
    if (input.publishedAt === null) publishedAt = null;
    else if (input.publishedAt instanceof Date) publishedAt = input.publishedAt;
    else publishedAt = new Date(input.publishedAt as string);
  } else if (status === "published" && !existing.publishedAt) {
    publishedAt = now;
  }

  const patch: Record<string, unknown> = {
    updatedAt: now,
    status,
    publishedAt,
  };

  if (input.title !== undefined) patch.title = input.title;
  if (input.titleFa !== undefined) patch.titleFa = input.titleFa;
  if (input.slug !== undefined) patch.slug = input.slug.trim() || existing.slug;
  if (input.slugFa !== undefined) patch.slugFa = input.slugFa.trim() || null;
  if (input.excerpt !== undefined) patch.excerpt = input.excerpt;
  if (input.excerptFa !== undefined) patch.excerptFa = input.excerptFa;
  if (input.content !== undefined) patch.content = input.content;
  if (input.contentFa !== undefined) patch.contentFa = input.contentFa;
  if (coverResolved !== undefined) patch.coverUrl = coverResolved;
  if (input.coverPublicId !== undefined) patch.coverPublicId = input.coverPublicId;
  if (input.metaTitle !== undefined) patch.metaTitle = input.metaTitle;
  if (input.metaTitleFa !== undefined) patch.metaTitleFa = input.metaTitleFa;
  if (input.metaDescription !== undefined) patch.metaDescription = input.metaDescription;
  if (input.metaDescriptionFa !== undefined) patch.metaDescriptionFa = input.metaDescriptionFa;
  if (input.authorId !== undefined) patch.authorId = input.authorId;

  await db.update(posts).set(patch as any).where(eq(posts.id, id));

  if (input.tags !== undefined) {
    await setPostTags(id, input.tags);
  }

  const updated = await getBlogPostById(id);
  return updated;
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  await db.delete(postTags).where(eq(postTags.postId, id));
  const result: any = await db.delete(posts).where(eq(posts.id, id));
  // neon-http returns { rowCount } or array; normalise
  if (result && typeof result.rowCount === "number") return result.rowCount > 0;
  if (Array.isArray(result)) return result.length > 0;
  // Fallback: verify deletion
  const still = await getBlogPostById(id);
  return still === null;
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

export async function getPostTags(postId: string): Promise<BlogTag[]> {
  const rows = await db
    .select({ id: tags.id, slug: tags.slug, name: tags.name })
    .from(tags)
    .innerJoin(postTags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, postId));

  return rows as BlogTag[];
}

export async function attachTags(
  postList: PostRow[],
): Promise<(PostRow & { tags: BlogTag[] })[]> {
  if (!postList.length) return [];

  const ids = postList.map((p) => p.id);
  const rows = await db
    .select({
      postId: postTags.postId,
      id: tags.id,
      slug: tags.slug,
      name: tags.name,
    })
    .from(tags)
    .innerJoin(postTags, eq(postTags.tagId, tags.id))
    .where(inArray(postTags.postId, ids));

  const byPost = new Map<string, BlogTag[]>();
  for (const r of rows) {
    const arr = byPost.get(r.postId) ?? [];
    arr.push({ id: r.id, slug: r.slug, name: r.name });
    byPost.set(r.postId, arr);
  }

  return postList.map((p) => ({ ...p, tags: byPost.get(p.id) ?? [] }));
}

export async function setPostTags(postId: string, names: string[]): Promise<void> {
  await db.delete(postTags).where(eq(postTags.postId, postId));

  const seen = new Set<string>();
  for (const raw of names) {
    const name = raw.trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());

    const slug = slugify(name);
    // Try to find existing tag by slug
    const existing = await db.select().from(tags).where(eq(tags.slug, slug)).limit(1);
    let tagId: number;

    if (existing.length > 0) {
      tagId = (existing[0] as TagRow).id;
    } else {
      const inserted = await db.insert(tags).values({ slug, name }).returning();
      // neon-http returning() gives array of inserted rows; handle fallback if not supported
      if (inserted && inserted.length > 0) {
        tagId = (inserted[0] as TagRow).id;
      } else {
        // Fallback: re-query by slug if returning() not supported on this driver path
        const reFetched = await db.select().from(tags).where(eq(tags.slug, slug)).limit(1);
        if (!reFetched.length) continue;
        tagId = (reFetched[0] as TagRow).id;
      }
    }

    // Insert mapping — ignore duplicate via onConflict handling (unique index)
    try {
      await db.insert(postTags).values({ postId, tagId });
    } catch {
      // duplicate mapping (uniqueIndex) — ignore
    }
  }
}
