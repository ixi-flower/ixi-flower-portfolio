import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Persian-aware slugify — keeps fa + latin + digits, same as filmshab
export function slugify(input: string): string {
  const s = input
    .trim()
    .toLowerCase()
    .replace(/[^؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿a-z0-9\s_-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return s || `post-${Date.now().toString(36)}`;
}
