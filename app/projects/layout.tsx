import type { Metadata } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://ixiflower.vercel.app").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Projects — ixi_flower",
  description:
    "Projects by Amirabbas Rouintan (ixi_flower) — FilmShab, Storipalorium, Jitsi Infinity, Shimer and more. Next.js, Python, Go, Docker.",
  alternates: { canonical: `${SITE_URL}/projects` },
  openGraph: {
    title: "Projects — ixi_flower",
    description: "Projects by Amirabbas Rouintan — FilmShab, Storipalorium, Jitsi Infinity and beyond.",
    url: `${SITE_URL}/projects`,
    type: "website",
  },
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
