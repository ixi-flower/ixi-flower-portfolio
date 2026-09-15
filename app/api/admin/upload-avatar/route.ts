export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { requireOwner } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";

const ALLOWED_EXT = /\.(png|jpe?g|gif|webp|avif)$/i;

const MAGIC: [RegExp, (b: Buffer) => boolean][] = [
  [/^png$/i, (b) => b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))],
  [/^(jpe?g)$/i, (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff],
  [/^gif$/i, (b) => b.subarray(0, 4).toString("latin1") === "GIF8"],
  [
    /^webp$/i,
    (b) =>
      b.subarray(0, 4).toString("latin1") === "RIFF" &&
      b.subarray(8, 12).toString("latin1") === "WEBP",
  ],
  [/^avif$/i, (b) => b.subarray(4, 8).toString("latin1") === "ftyp"],
];

function contentMatchesExt(ext: string, buffer: Buffer): boolean {
  const rule = MAGIC.find(([re]) => re.test(ext));
  if (!rule) return true;
  return rule[1](buffer);
}

export async function POST(request: NextRequest) {
  const err = await requireOwner(request);
  if (err) return err;

  let file: File | null = null;
  try {
    const formData = await request.formData();
    file = formData.get("file") as File | null;
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  if (!file) return NextResponse.json({ error: "No file sent" }, { status: 400 });

  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json({ error: "File must be ≤ 50 MB" }, { status: 413 });
  }

  const baseName = path.basename(file.name || "");
  const ext = path.extname(baseName);
  if (!ext || !ALLOWED_EXT.test(ext)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 415 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (!contentMatchesExt(ext.replace(".", ""), buffer)) {
    return NextResponse.json({ error: "File content does not match extension" }, { status: 415 });
  }

  try {
    const { url, publicId } = await uploadImage(buffer, "ixi-wave/avatars");
    return NextResponse.json({ url, publicId, name: baseName, size: file.size, type: file.type });
  } catch (e) {
    console.error("Cloudinary avatar upload failed:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
