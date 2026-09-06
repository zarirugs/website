import { NextResponse } from "next/server";

import { getDatabase } from "@/lib/server/database";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
};

export async function GET() {
  try {
    const database = await getDatabase();
    const result = await database.prepare(
      `SELECT categories.id, categories.name, categories.slug, categories.description,
        COALESCE(categories.image_url, (
          SELECT product_catalog.image_url FROM product_catalog
          WHERE product_catalog.category_id = categories.id AND product_catalog.is_visible = 1
          ORDER BY product_catalog.sort_order ASC LIMIT 1
        )) AS image_url
       FROM categories WHERE categories.is_active = 1
       ORDER BY categories.sort_order ASC, categories.name ASC`,
    ).all<CategoryRow>();
    return NextResponse.json({ collections: result.results.map((category) => ({
      id: category.id,
      title: category.name,
      slug: category.slug,
      subtitle: category.description ?? "Hand-knotted pieces from the ZARI atelier.",
      image: category.image_url ?? "/images/collection-1.jpg",
      imageFit: "cover" as const,
    })) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    // The storefront retains its curated fallback until the catalog migration is applied.
    return NextResponse.json({ collections: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}
