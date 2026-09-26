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
  created_at: string;
  popularity: number;
};

const retiredDefaultImages = new Set([
  "/images/collection-1.jpg",
  "/images/collection-2.png",
  "/images/collection-3.jpg",
]);

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
          product_catalog.description, product_catalog.image_url AS fallback_image_url, product_catalog.price_paise, product_catalog.created_at,
          (SELECT COALESCE(SUM(order_items.quantity), 0) FROM order_items JOIN orders ON orders.id = order_items.order_id WHERE order_items.sku = inventory_items.sku AND orders.status IN ('confirmed', 'in_production', 'ready', 'fulfilled')) AS popularity,
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

    // Attributes are optional during rollout; older databases still serve their catalog.
    const attributes = await database.prepare("SELECT sku, sizes, colors, materials, weave FROM product_attributes")
      .all<{ sku: string; sizes: string; colors: string; materials: string; weave: string | null }>()
      .catch(() => ({ results: [] }));
    const bySku = new Map(attributes.results.map((row) => [row.sku, row]));
    function values(raw?: string): string[] {
      try { const parsed: unknown = JSON.parse(raw ?? "[]"); return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : []; }
      catch { return []; }
    }

    const gallery = await database.prepare(`SELECT product_images.sku, media_assets.id, media_assets.source_type, media_assets.image_url, media_assets.alt_text
      FROM product_images JOIN media_assets ON media_assets.id = product_images.media_asset_id
      JOIN product_catalog ON product_catalog.sku = product_images.sku
      JOIN inventory_items ON inventory_items.sku = product_catalog.sku
      JOIN categories ON categories.id = product_catalog.category_id
      WHERE product_catalog.is_visible = 1 AND inventory_items.is_active = 1 AND categories.is_active = 1
      ORDER BY product_images.sku, product_images.sort_order`)
      .all<{ sku: string; id: string; source_type: "upload" | "url" | "color"; image_url: string | null; alt_text: string | null }>()
      .catch((error) => { if (error instanceof Error && /no such table: product_images/i.test(error.message)) return { results: [] }; throw error; });
    const imagesBySku = new Map<string, { id: string; url: string; alt: string }[]>();
    for (const image of gallery.results) {
      const url = publicMediaUrl(image);
      if (url) imagesBySku.set(image.sku, [...(imagesBySku.get(image.sku) ?? []), { id: image.id, url, alt: image.alt_text ?? "" }]);
    }
    const categoryImages = new Map(categoriesResult.results.map((category) => [
      category.slug,
      (category.media_id && category.source_type
        ? publicMediaUrl({ id: category.media_id, source_type: category.source_type, image_url: category.image_url })
        : null) || category.fallback_image_url || "/api/media/media-default-heritage",
    ]));

    return NextResponse.json({ collections: categoriesResult.results.map((category) => ({
      id: category.id,
      title: category.name,
      slug: category.slug,
      subtitle: category.description ?? "Hand-knotted pieces from the ZARI atelier.",
      image: categoryImages.get(category.slug) ?? "",
      backgroundColor: category.media_id ? category.background_color : null,
      imageFit: "cover" as const,
    })), products: productsResult.results.map((product) => ({
      sku: product.sku,
      name: product.name,
      description: product.description,
      categorySlug: product.category_slug,
      images: imagesBySku.get(product.sku) ?? [],
      image: imagesBySku.get(product.sku)?.[0]?.url
        || (product.media_id && product.source_type
          ? publicMediaUrl({ id: product.media_id, source_type: product.source_type, image_url: product.image_url })
          : null)
        || (product.fallback_image_url && !retiredDefaultImages.has(product.fallback_image_url)
          ? product.fallback_image_url
          : null)
        || categoryImages.get(product.category_slug)
        || "",
      backgroundColor: product.media_id ? product.background_color : null,
      imageFit: "cover" as const,
      pricePaise: product.price_paise,
      stock: product.stock,
      createdAt: product.created_at.replace(" ", "T") + "Z",
      popularity: product.popularity,
      sizes: values(bySku.get(product.sku)?.sizes),
      colors: values(bySku.get(product.sku)?.colors),
      materials: values(bySku.get(product.sku)?.materials),
      weave: bySku.get(product.sku)?.weave ?? (/hand.knotted/i.test(product.name) ? "Hand-knotted" : null),
    })) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "The catalog is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
