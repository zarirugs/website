import { NextResponse } from "next/server";

import { getDatabase } from "@/lib/server/database";
import { publicMediaUrl } from "@/lib/server/media";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  fallback_image_url: string | null;
  media_id: string | null;
  source_type: "upload" | "url" | "color" | null;
  image_url: string | null;
  background_color: string | null;
};

export async function GET() {
  try {
    const database = await getDatabase();
    const result = await database.prepare(
      `SELECT categories.id, categories.name, categories.slug, categories.description, categories.image_url AS fallback_image_url,
        media_assets.id AS media_id, media_assets.name AS media_name, media_assets.alt_text,
        media_assets.source_type, media_assets.image_url, media_assets.object_key, media_assets.background_color
       FROM categories LEFT JOIN media_assets ON media_assets.id = categories.media_asset_id
       WHERE categories.is_active = 1
       ORDER BY categories.sort_order ASC, categories.name ASC`,
    ).all<CategoryRow>();
    return NextResponse.json({ collections: result.results.map((category) => ({
      id: category.id,
      title: category.name,
      slug: category.slug,
      subtitle: category.description ?? "Hand-knotted pieces from the ZARI atelier.",
      image: category.media_id && category.source_type ? publicMediaUrl({ id: category.media_id, source_type: category.source_type, image_url: category.image_url }) ?? "" : category.fallback_image_url ?? "/api/media/media-default-heritage",
      backgroundColor: category.media_id ? category.background_color : null,
      imageFit: "cover" as const,
    })) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    // The storefront retains its curated fallback until the catalog migration is applied.
    return NextResponse.json({ collections: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}
