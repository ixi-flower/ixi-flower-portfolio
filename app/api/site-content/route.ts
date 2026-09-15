export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAllSiteContent, getSiteContent, isValidKey } from "@/lib/site-content";

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key")?.trim();

  if (key) {
    if (!isValidKey(key)) {
      return NextResponse.json({ error: "Invalid key — expected playlist | waka | tech | courses | profile | banner" }, { status: 400 });
    }
    const value = await getSiteContent(key);
    // Return { key: value } so client can do data[key] regardless of single vs all
    return NextResponse.json(
      { [key]: value },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
    );
  }

  const all = await getAllSiteContent();
  return NextResponse.json(all, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}
