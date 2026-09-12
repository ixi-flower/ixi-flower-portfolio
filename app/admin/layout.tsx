import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — ixi-wave" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-mono">
      {children}
    </div>
  );
}
