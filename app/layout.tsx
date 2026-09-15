import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import localFont from "next/font/local";
import "./globals.css";

const vazirmatn = localFont({
  src: "../public/fonts/Vazirmatn.woff2",
  variable: "--font-vazirmatn",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Amirabbas Rouintan | Full-Stack Developer",
  description:
    "Amirabbas Rouintan (ixi_flower) — self-taught full-stack developer. MERN, Next.js, Python, Go. Building robust web apps and automation with a taste for clean terminal aesthetics.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${vazirmatn.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-200 font-mono">{children}</body>
    </html>
  );
}
