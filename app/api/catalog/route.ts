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

type ProductRow = {
  sku: string;
  name: string;
  description: string | null;
  category_slug: string;
  fallback_image_url: string | null;
  media_id: string | null;
  source_type: "upload" | "url" | "color" | null;
  image_url: string | null;
  background_color: string | null;
  price_paise: number | null;
  stock: number;
};

export async function GET() {
  try {
    const database = await getDatabase();
    const [categoriesResult, productsResult] = await Promise.all([
      database.prepare(
      `SELECT categories.id, categories.name, categories.slug, categories.description, categories.image_url AS fallback_image_url,
        media_assets.id AS media_id, media_assets.name AS media_name, media_assets.alt_text,
        media_assets.source_type, media_assets.image_url, media_assets.object_key, media_assets.background_color
       FROM categories LEFT JOIN media_assets ON media_assets.id = categories.media_asset_id
       WHERE categories.is_active = 1
       ORDER BY categories.sort_order ASC, categories.name ASC`,
      ).all<CategoryRow>(),
      database.prepare(
        `SELECT inventory_items.sku, inventory_items.name, inventory_items.stock,
          product_catalog.description, product_catalog.image_url AS fallback_image_url, product_catalog.price_paise,
          categories.slug AS category_slug,
          media_assets.id AS media_id, media_assets.source_type, media_assets.image_url, media_assets.background_color
         FROM product_catalog
         JOIN inventory_items ON inventory_items.sku = product_catalog.sku
         JOIN categories ON categories.id = product_catalog.category_id
         LEFT JOIN media_assets ON media_assets.id = product_catalog.media_asset_id
         WHERE product_catalog.is_visible = 1 AND inventory_items.is_active = 1 AND categories.is_active = 1
         ORDER BY product_catalog.sort_order ASC, inventory_items.name ASC`,
      ).all<ProductRow>(),
    ]);

    return NextResponse.json({ collections: categoriesResult.results.map((category) => ({
      id: category.id,
      title: category.name,
      slug: category.slug,
      subtitle: category.description ?? "Hand-knotted pieces from the ZARI atelier.",
      image: category.media_id && category.source_type ? publicMediaUrl({ id: category.media_id, source_type: category.source_type, image_url: category.image_url }) ?? "" : category.fallback_image_url ?? "/api/media/media-default-heritage",
      backgroundColor: category.media_id ? category.background_color : null,
      imageFit: "cover" as const,
    })), products: productsResult.results.map((product) => ({
      sku: product.sku,
      name: product.name,
      description: product.description,
      categorySlug: product.category_slug,
      image: product.media_id && product.source_type
        ? publicMediaUrl({ id: product.media_id, source_type: product.source_type, image_url: product.image_url }) ?? ""
        : product.fallback_image_url ?? "",
      backgroundColor: product.media_id ? product.background_color : null,
      imageFit: "cover" as const,
      pricePaise: product.price_paise,
      stock: product.stock,
    })) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    // The storefront retains its curated fallback until the catalog migration is applied.
    return NextResponse.json({ collections: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}
