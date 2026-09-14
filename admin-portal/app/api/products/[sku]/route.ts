import { NextResponse } from "next/server";

import { authenticatedAdminContext } from "@/lib/server/guard";
import { databaseErrorResponse, errorResponse, optionalText, requiredText, validImageUrl } from "@/lib/server/http";

type CurrentProduct = { sku: string; stock: number; category_id: string | null; category_name: string | null; description: string | null; image_url: string | null; media_asset_id: string | null; price_paise: number | null; is_visible: number | null; sort_order: number | null; tags: string | null; dimensions: string | null; material: string | null; weave: string | null; colour: string | null; pile_height: string | null; origin: string | null };
type CategoryRow = { id: string; name: string };

export async function PATCH(request: Request, { params }: { params: Promise<{ sku: string }> }) {
  try {
    const context = await authenticatedAdminContext(request);
    if (!context) return errorResponse("Unauthorised.", 401);
    const { sku } = await params;
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return errorResponse("Enter product details.");
    const values = body as Record<string, unknown>;
    const current = await context.database.prepare(
      `SELECT inventory_items.sku, inventory_items.stock, product_catalog.category_id, categories.name AS category_name,
        product_catalog.description, product_catalog.image_url, product_catalog.media_asset_id, product_catalog.price_paise,
        product_catalog.is_visible, product_catalog.sort_order, product_catalog.tags, product_catalog.dimensions,
        product_catalog.material, product_catalog.weave, product_catalog.colour, product_catalog.pile_height, product_catalog.origin
       FROM inventory_items LEFT JOIN product_catalog ON product_catalog.sku = inventory_items.sku
       LEFT JOIN categories ON categories.id = product_catalog.category_id WHERE inventory_items.sku = ?`,
    ).bind(sku).first<CurrentProduct>();
    if (!current) return errorResponse("Product not found.", 404);

    const name = values.name === undefined ? undefined : requiredText(values.name, 140);
    const stock = values.stock === undefined ? undefined : values.stock;
    const reorderLevel = values.reorderLevel === undefined ? undefined : values.reorderLevel;
    const isActive = values.isActive;
    const isVisible = values.isVisible;
    const description = values.description === undefined ? current.description : optionalText(values.description, 1_500);
    const imageUrl = values.imageUrl === undefined ? current.image_url : validImageUrl(values.imageUrl);
    const mediaAssetId = values.mediaAssetId === undefined ? current.media_asset_id : optionalText(values.mediaAssetId, 100);
    const pricePaise = values.pricePaise === undefined ? current.price_paise : values.pricePaise === "" || values.pricePaise === null ? null : values.pricePaise;
    const sortOrder = values.sortOrder === undefined ? current.sort_order ?? 0 : values.sortOrder;
    const tags = values.tags === undefined ? current.tags : serialisedTags(values.tags);
    const dimensions = values.dimensions === undefined ? current.dimensions : optionalText(values.dimensions, 80);
    const material = values.material === undefined ? current.material : optionalText(values.material, 80);
    const weave = values.weave === undefined ? current.weave : optionalText(values.weave, 80);
    const colour = values.colour === undefined ? current.colour : optionalText(values.colour, 80);
    const pileHeight = values.pileHeight === undefined ? current.pile_height : optionalText(values.pileHeight, 80);
    const origin = values.origin === undefined ? current.origin : optionalText(values.origin, 80);
    let categoryId = values.categoryId === undefined ? current.category_id : requiredText(values.categoryId, 100);
    let categoryName = current.category_name;

    if ((values.name !== undefined && !name) ||
      (stock !== undefined && (typeof stock !== "number" || !Number.isInteger(stock) || stock < 0 || stock > 100_000)) ||
      (reorderLevel !== undefined && (typeof reorderLevel !== "number" || !Number.isInteger(reorderLevel) || reorderLevel < 0 || reorderLevel > 100_000)) ||
      (isActive !== undefined && typeof isActive !== "boolean") || (isVisible !== undefined && typeof isVisible !== "boolean") ||
      (values.imageUrl !== undefined && imageUrl === null) || (pricePaise !== null && (typeof pricePaise !== "number" || !Number.isInteger(pricePaise) || pricePaise < 0 || pricePaise > 10_000_000_000)) ||
      typeof sortOrder !== "number" || !Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10_000 || !categoryId || tags === null) return errorResponse("Invalid product update.");

    if (values.categoryId !== undefined) {
      const category = await context.database.prepare("SELECT id, name FROM categories WHERE id = ? AND is_active = 1")
        .bind(categoryId).first<CategoryRow>();
      if (!category) return errorResponse("Choose an active category.");
      categoryId = category.id;
      categoryName = category.name;
    }
    if (mediaAssetId && !await context.database.prepare("SELECT id FROM media_assets WHERE id = ?").bind(mediaAssetId).first()) return errorResponse("Choose media from the library.");

    const nextStock = stock ?? current.stock;
    await context.database.batch([
      context.database.prepare(
        `UPDATE inventory_items SET stock = ?, reorder_level = COALESCE(?, reorder_level), name = COALESCE(?, name),
          collection = COALESCE(?, collection), is_active = COALESCE(?, is_active), updated_at = CURRENT_TIMESTAMP WHERE sku = ?`,
      ).bind(nextStock, reorderLevel ?? null, name ?? null, categoryName ?? null,
        isActive === undefined ? null : Number(isActive), sku),
      context.database.prepare(
        `INSERT INTO product_catalog (sku, category_id, description, image_url, media_asset_id, price_paise, is_visible, sort_order,
          tags, dimensions, material, weave, colour, pile_height, origin)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(sku) DO UPDATE SET category_id = excluded.category_id, description = excluded.description,
           image_url = excluded.image_url, media_asset_id = excluded.media_asset_id, price_paise = excluded.price_paise, is_visible = excluded.is_visible,
           sort_order = excluded.sort_order, tags = excluded.tags, dimensions = excluded.dimensions, material = excluded.material,
           weave = excluded.weave, colour = excluded.colour, pile_height = excluded.pile_height, origin = excluded.origin, updated_at = CURRENT_TIMESTAMP`,
      ).bind(sku, categoryId, description, imageUrl, mediaAssetId, pricePaise, isVisible === undefined ? 1 : Number(isVisible), sortOrder,
        tags, dimensions, material, weave, colour, pileHeight, origin),
      ...(nextStock !== current.stock ? [context.database.prepare(
        "INSERT INTO stock_movements (sku, quantity_delta, reason) VALUES (?, ?, ?)",
      ).bind(sku, nextStock - current.stock, "Manual stock count")] : []),
    ]);
    return NextResponse.json({ updated: true, sku }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

function serialisedTags(value: unknown) {
  if (!Array.isArray(value) || value.length > 20) return null;
  const tags = value.map((tag) => requiredText(tag, 40)).filter((tag): tag is string => Boolean(tag));
  return tags.length === value.length ? JSON.stringify([...new Set(tags.map((tag) => tag.toLowerCase()))]) : null;
}
