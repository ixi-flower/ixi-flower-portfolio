import type { Metadata } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://ixiflower.vercel.app").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Blogs — ixi_flower",
  description:
    "Writing by Amirabbas Rouintan (ixi_flower) — Jitsi Meet at scale, Onyx, Hydrogen, and notes from building with Next.js, TypeScript, Python and Go.",
  alternates: { canonical: `${SITE_URL}/blogs` },
  openGraph: {
    title: "Blogs — ixi_flower",
    description: "Writing by Amirabbas Rouintan — Jitsi, Onyx, Hydrogen and dev notes.",
    url: `${SITE_URL}/blogs`,
    type: "website",
  },
};

export default function BlogsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
