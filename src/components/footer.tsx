"use client";

import { AnimatedFooter } from "@/components/ui/animated-footer";
import { FaGithub, FaTelegram, FaEnvelope, FaLinkedin, FaYoutube } from "react-icons/fa";

const socialLinks = [
  { href: "https://github.com/ixiflower", label: "GitHub", icon: FaGithub },
  { href: "https://t.me/ixi_flower", label: "Telegram", icon: FaTelegram },
  { href: "mailto:amriabbas.rouintan2007@gmail.com", label: "Email", icon: FaEnvelope },
  { href: "https://linkedin.com/in/ixiflower", label: "LinkedIn", icon: FaLinkedin },
  { href: "https://youtube.com/@ixi_flower", label: "YouTube", icon: FaYoutube },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <div className="relative min-h-[500px] sm:min-h-[600px] w-full overflow-hidden">
      {/* Animated Footer fills the container */}
      <AnimatedFooter
        headingLines={["ixi_flower"]}
        leftImage="/animated-footer/hand-left.jpg"
        rightImage="/animated-footer/hand-right.jpg"
        charColor="#7C3AED"
        hoverColor="#A78BFA"
        hoverCharColor="#0f0f0f"
        parallaxStrength={15}
        hoverRadius={10}
        className="absolute inset-0"
      />

      {/* Social links overlay */}
      <div className="absolute inset-x-0 top-1/3 z-10 flex flex-col items-center gap-8 px-4">
        <p className="text-xs sm:text-sm text-zinc-500 tracking-[0.15em] uppercase font-light">
          find me on
        </p>
        <div className="flex items-center gap-4 sm:gap-6">
          {socialLinks.map(({ href, label, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title={label}
              className="group relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-zinc-800 bg-black/40 backdrop-blur-sm transition-all duration-300 hover:border-violet-600 hover:bg-violet-600/10 hover:shadow-[0_0_20px_rgba(124,58,237,0.3)]"
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-400 transition-colors duration-300 group-hover:text-violet-400" />
            </a>
          ))}
        </div>
      </div>

      {/* Copyright bar */}
      <div className="absolute bottom-0 inset-x-0 z-10 border-t border-zinc-800/40 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4">
          <p className="text-center text-xs text-zinc-600">
            &copy; {year} ixi_flower. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
