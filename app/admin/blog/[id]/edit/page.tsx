import { notFound } from "next/navigation";
import Link from "next/link";
import BlogForm from "@/components/admin/BlogForm";
import { getBlogPostById, getPostTags } from "@/lib/blog";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getBlogPostById(id);
  if (!post) notFound();
  const tags = await getPostTags(id);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/blog" className="text-xs border border-zinc-800 px-3 py-1.5 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700">← Back</Link>
        <h1 className="text-lg font-bold text-zinc-100">Edit — {post.title}</h1>
      </div>
      <BlogForm post={{ ...post, tags } as any} />
    </div>
  );
}
