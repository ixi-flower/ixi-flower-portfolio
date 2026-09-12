import Link from "next/link";
import BlogForm from "@/components/admin/BlogForm";

export default function NewPostPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/blog" className="text-xs border border-zinc-800 px-3 py-1.5 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700">← Back</Link>
        <h1 className="text-lg font-bold text-zinc-100">New post</h1>
      </div>
      <BlogForm />
    </div>
  );
}
