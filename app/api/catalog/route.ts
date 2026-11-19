import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/server/catalog";

export async function GET() {
  try {
    return NextResponse.json(await getCatalog(), { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } });
  } catch {
    return NextResponse.json({ error: "The catalog is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
