import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getBlogPostBySlug, getPostTags } from "@/lib/blog";
import BlogDetailClient from "./BlogDetailClient";

export const dynamic = "force-dynamic";

function siteUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://ixiflower.vercel.app").replace(/\/$/, "");
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  try {
    const post = await getBlogPostBySlug(decoded, "published");
    if (!post) return { title: "Not found — ixi_flower" };
    const url = `${siteUrl()}/blogs/${encodeURIComponent(post.slug)}`;
    const raw = (post.excerpt || post.content || "").slice(0, 300);
    const description = stripHtml(raw).slice(0, 160) || `Blog by Amirabbas Rouintan (ixi_flower) — ${post.title}`;
    const title = post.title ? `${post.title} — ixi_flower` : "Blog — ixi_flower";
    const images = post.coverUrl ? [{ url: post.coverUrl, width: 1200, height: 630, alt: post.title }] : undefined;
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        type: "article",
        url,
        title: post.title,
        description,
        images,
        publishedTime: (post.publishedAt as unknown as string) || undefined,
        authors: ["Amirabbas Rouintan"],
        tags: undefined,
      },
      twitter: {
        card: post.coverUrl ? "summary_large_image" : "summary",
        title: post.title,
        description,
        images: post.coverUrl ? [post.coverUrl] : undefined,
        creator: "@ixi_flower0",
      },
    };
  } catch {
    return { title: "Blog — ixi_flower" };
  }
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(decodeURIComponent(slug), "published");
  if (!post) notFound();
  const tags = await getPostTags(post.id);
  const hasFa = !!(post.titleFa || post.contentFa);

  // JSON-LD Article for SEO — invisible, terminal keeps its look
  const ld = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: stripHtml((post.excerpt || post.content || "").slice(0, 200)),
    image: post.coverUrl || undefined,
    author: { "@type": "Person", name: "Amirabbas Rouintan", url: siteUrl() },
    publisher: { "@type": "Person", name: "Amirabbas Rouintan" },
    datePublished: post.publishedAt ? new Date(post.publishedAt as unknown as string).toISOString() : undefined,
    dateModified: post.updatedAt ? new Date(post.updatedAt as unknown as string).toISOString() : undefined,
    mainEntityOfPage: `${siteUrl()}/blogs/${encodeURIComponent(post.slug)}`,
    inLanguage: hasFa ? ["en", "fa"] : "en",
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-200 p-3 font-mono">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="mx-auto max-w-3xl">
        {/* top bar */}
        <div className="mb-4">
          <Link href="/">
            <span className="inline-flex items-center gap-1 h-10 px-4 text-xs border border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 rounded-none">
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>{" "}
              cd ..
            </span>
          </Link>
          <div className="flex items-center gap-1.5 mt-3 text-zinc-600">
            <span className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="h-2 w-2 rounded-full bg-yellow-500" />
              <span className="h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span className="text-[11px] text-zinc-500 ml-2">cat ~/blogs/{post.slug}.md — nvim</span>
          </div>
          <div className="flex items-center text-xs mt-2">
            <span className="text-zinc-500 mr-1">$</span>
            <span className="text-zinc-300 font-medium">cat ~/blogs/{post.slug}.md | less</span>
            <span className="animate-pulse ml-1 text-zinc-300">_</span>
          </div>
        </div>

        {/* window */}
        <div className="bg-zinc-900 border border-zinc-800 overflow-hidden shadow-xl">
          <div className="flex items-center justify-between px-3 py-2 bg-zinc-800 border-b border-zinc-700">
            <span className="flex gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
            <span className="text-[11px] text-zinc-400">zsh — 80×24</span>
            <span className="w-9" />
          </div>

          {/* cover */}
          {post.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.coverUrl} alt={post.title} className="w-full h-auto object-cover max-h-[320px] border-b border-zinc-800" />
          )}

          <BlogDetailClient post={post} tags={tags} hasFa={hasFa} />
        </div>

        <div className="text-center text-[10px] text-zinc-600 mt-6 font-mono">© 2026 ixiflower — crafted with Next.js · terminal soul · code & coffee</div>
      </div>
    </main>
  );
}
