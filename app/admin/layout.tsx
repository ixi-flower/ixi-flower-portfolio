import type { Metadata } from "next";
import AdminGate from "./AdminGate";

export const metadata: Metadata = {
  title: "Admin — ixi-wave",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-mono">
      <AdminGate>{children}</AdminGate>
    </div>
  );
}
