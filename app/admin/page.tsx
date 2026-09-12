import Link from "next/link";

export default function AdminIndex() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-xl font-bold text-zinc-100">Admin</h1>
      <p className="text-sm text-zinc-500 mt-1">ixi_flower — owner only</p>
      <div className="mt-6 flex gap-3">
        <Link href="/admin/blog" className="px-4 py-2 bg-zinc-100 text-zinc-900 text-sm hover:bg-white">
          Manage blog →
        </Link>
        <Link href="/" className="px-4 py-2 border border-zinc-800 text-sm text-zinc-400 hover:text-zinc-100 hover:border-zinc-700">
          Back to site
        </Link>
      </div>
    </div>
  );
}
