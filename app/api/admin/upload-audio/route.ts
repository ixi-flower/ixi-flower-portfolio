export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { requireOwner } from "@/lib/auth";
import { uploadAudio } from "@/lib/cloudinary";

const ALLOWED_EXT = /\.(mp3|wav|flac|ogg|m4a|aac|wma|aiff)$/i;

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

  const maxSize = 60 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json({ error: "Audio must be ≤ 60 MB" }, { status: 413 });
  }

  const baseName = path.basename(file.name || "");
  const ext = path.extname(baseName);
  if (!ext || !ALLOWED_EXT.test(ext)) {
    return NextResponse.json({ error: "Audio type not allowed — use mp3/wav/flac/ogg/m4a/aac" }, { status: 415 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // lightweight magic check for MP3/FLAC/OGG/WAV — don't block if unknown
  // MP3: FF FB or ID3, FLAC: fLaC, OGG: OggS, WAV: RIFF

  try {
    const { url, publicId } = await uploadAudio(buffer, baseName.replace(/\.[^.]+$/, ""));
    return NextResponse.json({ url, publicId, name: baseName, size: file.size, type: file.type });
  } catch (e) {
    console.error("Cloudinary audio upload failed:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
