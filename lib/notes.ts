import "server-only";
import { asc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { notes, bookmarks } from "@/lib/db/schema";
import type { NoteRow, BookmarkRow } from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export async function getAllNotes(): Promise<NoteRow[]> {
  const rows = await db.select().from(notes).orderBy(asc(notes.sortOrder), asc(notes.createdAt));
  return rows as NoteRow[];
}

export async function getNoteTree(): Promise<NoteRow[]> {
  return getAllNotes();
}

export async function getNoteById(id: string): Promise<NoteRow | null> {
  const rows = await db.select().from(notes).where(eq(notes.id, id)).limit(1);
  return (rows[0] as NoteRow | undefined) ?? null;
}

export async function createNote(input: {
  title: string;
  content?: string;
  parentId?: string | null;
  icon?: string | null;
}): Promise<NoteRow> {
  const siblings = input.parentId
    ? await db.select({ id: notes.id }).from(notes).where(eq(notes.parentId, input.parentId))
    : await db.select({ id: notes.id }).from(notes).where(isNull(notes.parentId));
  const sortOrder = siblings.length;
  const id = crypto.randomUUID();
  const now = new Date();
  const row: typeof notes.$inferInsert = {
    id,
    parentId: input.parentId ?? null,
    title: input.title.trim() || (input.icon === "📁" || input.icon === "🗂️" ? "New Folder" : "New Note"),
    content: input.content ?? "",
    icon: input.icon ?? null,
    sortOrder,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(notes).values(row);
  const created = await getNoteById(id);
  return created as NoteRow;
}

export async function updateNote(
  id: string,
  patch: Partial<{ title: string; content: string; icon: string | null; parentId: string | null }>
): Promise<NoteRow | null> {
  const existing = await getNoteById(id);
  if (!existing) return null;
  const upd: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.title !== undefined) upd.title = patch.title.trim() || existing.title;
  if (patch.content !== undefined) upd.content = patch.content;
  if (patch.icon !== undefined) upd.icon = patch.icon;
  if (patch.parentId !== undefined) upd.parentId = patch.parentId;
  await db.update(notes).set(upd as any).where(eq(notes.id, id));
  return getNoteById(id);
}

export async function deleteNote(id: string): Promise<boolean> {
  const res: any = await db.delete(notes).where(eq(notes.id, id));
  if (res && typeof res.rowCount === "number") return res.rowCount > 0;
  if (Array.isArray(res)) return res.length > 0;
  const still = await getNoteById(id);
  return still === null;
}

export async function reorderNotes(orderedIds: string[], parentId: string | null = null): Promise<void> {
  for (let i = 0; i < orderedIds.length; i++) {
    await db.update(notes).set({ sortOrder: i } as any).where(eq(notes.id, orderedIds[i]));
  }
  // parentId is validated by caller; if groups need separate reorder, caller should partition
}

// ---------------------------------------------------------------------------
// Bookmarks
// ---------------------------------------------------------------------------

export async function getAllBookmarks(): Promise<BookmarkRow[]> {
  const rows = await db.select().from(bookmarks).orderBy(asc(bookmarks.sortOrder), asc(bookmarks.createdAt));
  return rows as BookmarkRow[];
}

export async function getBookmarkById(id: string): Promise<BookmarkRow | null> {
  const rows = await db.select().from(bookmarks).where(eq(bookmarks.id, id)).limit(1);
  return (rows[0] as BookmarkRow | undefined) ?? null;
}

export async function createBookmark(input: {
  title: string;
  url: string;
  description?: string | null;
  favicon?: string | null;
  folder?: string | null;
}): Promise<BookmarkRow> {
  const all = await db.select({ id: bookmarks.id }).from(bookmarks);
  const sortOrder = all.length;
  const id = crypto.randomUUID();
  const now = new Date();
  const row: typeof bookmarks.$inferInsert = {
    id,
    title: input.title.trim(),
    url: input.url.trim(),
    description: input.description ?? null,
    favicon: input.favicon ?? null,
    folder: input.folder ?? null,
    sortOrder,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(bookmarks).values(row);
  const created = await getBookmarkById(id);
  return created as BookmarkRow;
}

export async function updateBookmark(
  id: string,
  patch: Partial<{ title: string; url: string; description: string | null; favicon: string | null; folder: string | null }>
): Promise<BookmarkRow | null> {
  const existing = await getBookmarkById(id);
  if (!existing) return null;
  const upd: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.title !== undefined) upd.title = patch.title.trim() || existing.title;
  if (patch.url !== undefined) upd.url = patch.url.trim();
  if (patch.description !== undefined) upd.description = patch.description;
  if (patch.favicon !== undefined) upd.favicon = patch.favicon;
  if (patch.folder !== undefined) upd.folder = patch.folder;
  await db.update(bookmarks).set(upd as any).where(eq(bookmarks.id, id));
  return getBookmarkById(id);
}

export async function deleteBookmark(id: string): Promise<boolean> {
  const res: any = await db.delete(bookmarks).where(eq(bookmarks.id, id));
  if (res && typeof res.rowCount === "number") return res.rowCount > 0;
  if (Array.isArray(res)) return res.length > 0;
  const still = await getBookmarkById(id);
  return still === null;
}

export async function reorderBookmarks(orderedIds: string[]): Promise<void> {
  for (let i = 0; i < orderedIds.length; i++) {
    await db.update(bookmarks).set({ sortOrder: i } as any).where(eq(bookmarks.id, orderedIds[i]));
  }
}
