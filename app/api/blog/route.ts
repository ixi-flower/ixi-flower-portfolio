export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getBlogPosts, attachTags, publicPost, POSTS_PER_PAGE } from "@/lib/blog";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const page = parseInt(sp.get("page") || "1", 10);
  const q = (sp.get("q") || "").trim();
  const tag = (sp.get("tag") || "").trim();

  const { posts, total } = await getBlogPosts({
    status: "published",
    q: q || undefined,
    tag: tag || undefined,
    page,
    perPage: POSTS_PER_PAGE,
  });

  const withTags = await attachTags(posts);

  return NextResponse.json({
    posts: withTags.map(({ tags, ...p }) => ({ ...publicPost(p), tags })),
    total,
    page: Math.max(1, page || 1),
    totalPages: Math.max(1, Math.ceil(total / POSTS_PER_PAGE)),
  });
}
