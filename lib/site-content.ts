import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// Zod schemas — mirror the const shapes in app/page.tsx
// ---------------------------------------------------------------------------

export const playlistSchema = z
  .array(
    z.object({
      title: z.string().min(1).max(120),
      artist: z.string().max(120).default(""),
      dur: z.string().regex(/^\d+:\d{2}$/, "dur must be m:ss like 3:16"),
    }),
  )
  .max(100);

export const wakaSchema = z.object({
  total: z.string().max(40),
  daily: z.string().max(40),
  codingSince: z.string().max(10),
  age: z.string().max(40),
  langs: z
    .array(
      z.object({
        name: z.string().min(1).max(40),
        pct: z.number().min(0).max(100),
      }),
    )
    .max(10),
});

export const techSchema = z
  .array(
    z.object({
      name: z.string().min(1).max(40),
      yrs: z.string().max(20),
      level: z.enum(["Advanced", "Intermediate", "Beginner"]),
      color: z.string().regex(/^#[0-9a-fA-F]{3,8}$/, "color must be hex like #3178c6"),
      icon: z.string().url().max(500),
      invert: z.boolean().optional(),
    }),
  )
  .max(50);

export const VALID_KEYS = ["playlist", "waka", "tech"] as const;
export type SiteContentKey = (typeof VALID_KEYS)[number];

const schemas: Record<SiteContentKey, z.ZodTypeAny> = {
  playlist: playlistSchema,
  waka: wakaSchema,
  tech: techSchema,
};

export function isValidKey(k: string): k is SiteContentKey {
  return (VALID_KEYS as readonly string[]).includes(k);
}

export function validateSiteContent(key: SiteContentKey, value: unknown) {
  return schemas[key].safeParse(value);
}

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

export async function getSiteContent<T = unknown>(key: SiteContentKey): Promise<T | null> {
  const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
  if (!rows.length) return null;
  return (rows[0] as { value: T }).value ?? null;
}

export async function getAllSiteContent(): Promise<Partial<Record<SiteContentKey, unknown>>> {
  const rows = await db.select().from(siteSettings);
  const out: Partial<Record<SiteContentKey, unknown>> = {};
  for (const r of rows as { key: string; value: unknown }[]) {
    if (isValidKey(r.key)) out[r.key] = r.value;
  }
  return out;
}

export async function setSiteContent(key: SiteContentKey, value: unknown) {
  const parsed = validateSiteContent(key, value);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(msg || "Validation failed");
  }
  const clean = parsed.data;
  await db
    .insert(siteSettings)
    .values({ key, value: clean as unknown as object, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { value: clean as unknown as object, updatedAt: new Date() },
    });
  return clean;
}

// ---------------------------------------------------------------------------
// Defaults — same as hardcoded consts in app/page.tsx (for seeding)
// ---------------------------------------------------------------------------

export const DEFAULT_PLAYLIST = [
  { title: "AYNEH", artist: "Bahram", dur: "3:16" },
  { title: "Enfejare Rangha", artist: "Bahram", dur: "4:02" },
  { title: "Gole Sorkh", artist: "Bahram", dur: "3:48" },
  { title: "Goosht", artist: "Bahram", dur: "2:59" },
  { title: "Ki Ba Ma Zooze Mikeshe", artist: "Bahram", dur: "3:21" },
  { title: "MOMKEN", artist: "Bahram", dur: "3:44" },
  { title: "Mikhoonim Vase Taghia", artist: "Bahram", dur: "4:11" },
  { title: "Saeghe", artist: "Bahram", dur: "3:33" },
  { title: "Shabe Sarde Kalanshahr", artist: "Bahram", dur: "3:57" },
  { title: "YE CHIZI MORD", artist: "Bahram", dur: "3:08" },
] as const;

export const DEFAULT_WAKA = {
  total: "1,847h 32m",
  daily: "3 hrs 12 mins",
  codingSince: "2019",
  age: "17 (born 2007)",
  langs: [
    { name: "TypeScript", pct: 42 },
    { name: "Python", pct: 31 },
    { name: "JavaScript", pct: 9 },
    { name: "Go", pct: 7 },
    { name: "Others", pct: 11 },
  ],
} as const;

export const DEFAULT_TECH = [
  { name: "TypeScript", yrs: "3+ yrs", level: "Advanced", color: "#3178c6", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg" },
  { name: "React", yrs: "3+ yrs", level: "Advanced", color: "#00d8ff", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg" },
  { name: "Next.js", yrs: "2+ yrs", level: "Advanced", color: "#000000", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg", invert: true },
  { name: "Tailwind", yrs: "2+ yrs", level: "Advanced", color: "#06b6d4", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg" },
  { name: "Python", yrs: "3+ yrs", level: "Advanced", color: "#3776ab", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg" },
  { name: "Node.js", yrs: "5+ yrs", level: "Advanced", color: "#339933", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg" },
  { name: "Go", yrs: "1+ yrs", level: "Intermediate", color: "#00add8", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/go/go-original.svg" },
  { name: "Docker", yrs: "2+ yrs", level: "Intermediate", color: "#2496ed", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg" },
  { name: "PostgreSQL", yrs: "2+ yrs", level: "Intermediate", color: "#336791", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg" },
  { name: "MongoDB", yrs: "2+ yrs", level: "Intermediate", color: "#47a248", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-original.svg" },
  { name: "Bun", yrs: "1+ yrs", level: "Intermediate", color: "#fbf0df", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/bun/bun-original.svg" },
] as const;
