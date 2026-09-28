import { NextResponse } from "next/server";

import { getSiteMedia } from "@/lib/server/site-media";

export async function GET() {
  try {
    const media = await getSiteMedia();
    return NextResponse.json({ media }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ media: {} }, { headers: { "Cache-Control": "no-store" } });
  }
}
