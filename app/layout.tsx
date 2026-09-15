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

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://ixiflower.vercel.app").replace(/\/$/, "");
const SITE_NAME = "Amirabbas Rouintan — ixi_flower";
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Amirabbas Rouintan | Full-Stack Developer — ixi_flower",
    template: "%s | ixi_flower",
  },
  description:
    "Amirabbas Rouintan (ixi_flower) — 17, born 2007, coding since 2019. Full-stack developer from Iran. Next.js, React, TypeScript, Python, Go, Docker, Neon. 46 repos, terminal soul — portfolio, blogs, projects at ixiflower.vercel.app.",
  keywords: [
    "Amirabbas Rouintan",
    "amirabbas rouintan",
    "Amirabbas rouintan",
    "ixi_flower",
    "ixi flower",
    "ixiflower",
    "ixi-flower",
    "ixi_flower portfolio",
    "ixiflower portfolio",
    "amirabbas rouintan portfolio",
    "amirabbas rouintan developer",
    "full-stack developer",
    "full stack developer Iran",
    "Next.js developer",
    "React developer",
    "TypeScript",
    "Python Go Docker",
    "portfolio terminal",
    "Amirabbas Rouintan 2007",
  ],
  authors: [{ name: "Amirabbas Rouintan", url: SITE_URL }],
  creator: "Amirabbas Rouintan",
  publisher: "Amirabbas Rouintan",
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Amirabbas Rouintan | Full-Stack Developer — ixi_flower",
    description:
      "Self-taught full-stack developer building fast web apps, Telegram bots, and cloud infra. Next.js · React · Python · Go — terminal aesthetic at ixiflower.vercel.app.",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Amirabbas Rouintan — ixi_flower portfolio" }],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@ixi_flower0",
    site: "@ixi_flower0",
    title: "Amirabbas Rouintan | Full-Stack Developer — ixi_flower",
    description: "Full-stack developer — Next.js, React, TypeScript, Python, Go. Terminal portfolio at ixiflower.vercel.app.",
    images: [OG_IMAGE],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  category: "technology",
  verification: { google: ["WaFpQHDDo7wXFI-lKwKR-NDkTdn6x5cH5bz1tIVHCAs", "eNLKi5bqXZ2OndyTUP29vcOEPIPUceTXcEBuPG8jmH8"] },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE_URL}#person`,
      name: "Amirabbas Rouintan",
      alternateName: ["ixi_flower", "ixiflower", "ixi-flower", "ixi flower", "amirabbas rouintan", "Amirabbas rouintan"],
      url: SITE_URL,
      image: `${SITE_URL}/avatar.jpg`,
      sameAs: [
        "https://github.com/ixi-flower",
        "https://www.linkedin.com/in/amirabbas-rouintan",
        "https://x.com/ixi_flower0",
        "https://www.youtube.com/@ixi_flower0",
      ],
      jobTitle: "Full-Stack Developer",
      knowsAbout: ["Next.js", "React", "TypeScript", "Python", "Go", "Docker", "PostgreSQL", "Neon"],
      birthDate: "2007",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: "Amirabbas Rouintan — terminal portfolio, blogs, projects.",
      publisher: { "@id": `${SITE_URL}#person` },
      inLanguage: "en",
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${vazirmatn.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-200 font-mono">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {children}
      </body>
    </html>
  );
}
