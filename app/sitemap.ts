import type { MetadataRoute } from "next";
import { getBlogPosts } from "@/lib/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://ixiflower.vercel.app").replace(/\/$/, "");
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/blogs`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/projects`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];

  try {
    const { posts } = await getBlogPosts({ status: "published", perPage: 100 });
    for (const p of posts) {
      const slug = encodeURIComponent(p.slug);
      const lm = (p.publishedAt as Date | null) ?? (p.updatedAt as Date) ?? now;
      entries.push({
        url: `${base}/blogs/${slug}`,
        lastModified: lm instanceof Date ? lm : new Date(lm as unknown as string),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch {
    // DB not configured at build — still return static routes
  }

  return entries;
}
