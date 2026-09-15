import type { Metadata } from "next";
import AdminGate from "./AdminGate";
import AdminSidebar from "./AdminSidebar";

export const metadata: Metadata = { title: "Admin — ixi-wave" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-mono">
      <AdminGate>
        <AdminSidebar />
        {/* desktop sidebar is w-56 fixed; push content on md+ */}
        <div className="md:pl-56">
          {children}
        </div>
      </AdminGate>
    </div>
  );
}
