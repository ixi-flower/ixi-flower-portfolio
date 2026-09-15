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
      url: z.string().url().max(2000).optional().or(z.literal("")),
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
  editors: z
    .array(
      z.object({
        name: z.string().min(1).max(40),
        pct: z.number().min(0).max(100),
      }),
    )
    .max(10)
    .optional(),
  os: z
    .array(
      z.object({
        name: z.string().min(1).max(40),
        pct: z.number().min(0).max(100),
      }),
    )
    .max(10)
    .optional(),
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

export const coursesSchema = z
  .array(
    z.object({
      title: z.string().min(1).max(120),
      provider: z.string().max(80),
      year: z.string().max(20),
      link: z.string().url().max(500).optional().or(z.literal("")),
      status: z.enum(["completed", "in-progress"]).default("completed"),
      details: z.array(z.string().max(200)).max(10).optional(),
    }),
  )
  .max(50);

export const profileSchema = z.object({
  handle: z.string().min(1).max(40),
  title: z.string().max(80),
  name: z.string().max(80),
  bio: z.string().max(500),
  avatar: z.string().url().max(500).or(z.literal("")).optional(),
  avatarPublicId: z.string().max(200).optional(),
  socials: z
    .array(
      z.object({
        label: z.string().max(40),
        href: z.string().url().max(500),
        icon: z.enum(["github", "twitter", "linkedin", "mail", "youtube", "telegram"]),
        command: z.string().max(40),
      }),
    )
    .max(8),
});

export const bannerSchema = z.object({
  enabled: z.boolean(),
  text: z.string().max(200),
  link: z.string().url().max(2000).optional().or(z.literal("")),
  dismissible: z.boolean().optional(),
});

export const VALID_KEYS = ["playlist", "waka", "tech", "courses", "profile", "banner"] as const;
export type SiteContentKey = (typeof VALID_KEYS)[number];

const schemas: Record<SiteContentKey, z.ZodTypeAny> = {
  playlist: playlistSchema,
  waka: wakaSchema,
  tech: techSchema,
  courses: coursesSchema,
  profile: profileSchema,
  banner: bannerSchema,
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
  editors: [
    { name: "VS Code", pct: 58 },
    { name: "Claude Code", pct: 22 },
    { name: "Neovim", pct: 12 },
    { name: "Cursor", pct: 8 },
  ],
  os: [
    { name: "Linux", pct: 76 },
    { name: "Windows", pct: 24 },
    { name: "macOS", pct: 0 },
  ],
} as const;

export const DEFAULT_COURSES = [
  { title: "The Modern Python 3 Bootcamp", provider: "Udemy", year: "2023", link: "https://www.udemy.com/certificate/UC-9842c80b-e377-4960-b027-83a31256595d/", status: "completed" as const, details: ["Python fundamentals through advanced topics", "OOP, decorators, generators, testing"] as const },
  { title: "OWASP Zero", provider: "voorivex.academy", year: "2023", link: "", status: "completed" as const, details: ["Web security fundamentals", "OWASP Top 10 vulnerabilities", "Ethical hacking methodology"] as const },
  { title: "Certified Ethical Hacker (CEH)", provider: "maktabkhooneh", year: "2023", link: "", status: "completed" as const, details: ["Ethical hacking methodology & tools", "Reconnaissance, scanning, exploitation", "Post-exploitation & reporting"] as const },
  { title: "Security Plus", provider: "maktabkhooneh", year: "2022", link: "", status: "completed" as const, details: ["Threats, attacks & vulnerabilities", "Architecture & design", "Cryptography & PKI"] as const },
  { title: "LPIC-1 Bootcamp", provider: "Jadi", year: "2022", link: "", status: "completed" as const, details: ["Linux system administration", "Command line, shell scripting", "System maintenance & security"] as const },
  { title: "CompTIA Network+", provider: "Arjang", year: "2022", link: "", status: "completed" as const, details: ["Networking concepts & protocols", "Infrastructure & troubleshooting", "Network security fundamentals"] as const },
  { title: "The Modern Python", provider: "Arjang", year: "2023", link: "", status: "completed" as const, details: ["Advanced Python programming", "AsyncIO, networking, APIs", "Real-world project-based learning"] as const },
  { title: "Docker — Kubernetes", provider: "DevOps", year: "2024", link: "", status: "completed" as const, details: ["Containerization with Docker", "Orchestration with Kubernetes", "CI/CD pipeline integration"] as const },
  { title: "nmap", provider: "Udemy", year: "2023", link: "", status: "completed" as const, details: ["Network discovery & scanning", "NSE scripting engine", "Vulnerability assessment techniques"] as const },
  { title: "REACT.JS Course", provider: "Frontend", year: "2024", link: "", status: "completed" as const, details: ["Modern React with hooks & context", "State management & routing", "Component design patterns"] as const },
] as const;

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

export const DEFAULT_PROFILE = {
  handle: "ixi_flower_",
  title: "Full-Stack Developer",
  name: "Amirabbas Rouintan",
  bio: "Self-taught software engineer from Iran. Specializing in Next.js, TypeScript, Python & Go — I build fast web apps, Telegram bots, trading systems and self-hosted infra. Obsessed with clean UIs, automation, and shipping real products.",
  avatar: "/avatar.jpg",
  avatarPublicId: "",
  socials: [
    { label: "GitHub", href: "https://github.com/ixiflower", icon: "github" as const, command: "open github" },
    { label: "Twitter", href: "https://x.com/ixi_flower0", icon: "twitter" as const, command: "open twitter" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/amirabbas-rouintan", icon: "linkedin" as const, command: "open linkedin" },
    { label: "Telegram", href: "https://t.me/ixi_flower", icon: "telegram" as const, command: "open telegram" },
    { label: "YouTube", href: "https://www.youtube.com/@ixi_flower0", icon: "youtube" as const, command: "open youtube" },
    { label: "Email", href: "mailto:amirabbas.rouintan2007@gmail.com", icon: "mail" as const, command: "send email" },
  ],
} as const;

export const DEFAULT_BANNER = {
  enabled: false,
  text: "",
  link: "",
  dismissible: true,
} as const;
