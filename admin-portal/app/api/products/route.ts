import { NextResponse } from "next/server";

import { authenticatedAdminContext } from "@/lib/server/guard";
import { databaseErrorResponse, errorResponse, optionalText, requiredText, validImageUrl } from "@/lib/server/http";

type ProductRow = {
  sku: string;
  name: string;
  stock: number;
  reorder_level: number;
  is_active: number;
  category_id: string | null;
  category_name: string | null;
  description: string | null;
  image_url: string | null;
  media_asset_id: string | null;
  price_paise: number | null;
  is_visible: number | null;
  sort_order: number | null;
};

type CategoryRow = { id: string; name: string };
const skuPattern = /^[A-Z0-9-]{3,64}$/;

function productResponse(product: ProductRow) {
  return {
    sku: product.sku,
    name: product.name,
    stock: product.stock,
    reorderLevel: product.reorder_level,
    isActive: product.is_active === 1,
    categoryId: product.category_id,
    categoryName: product.category_name,
    description: product.description,
    imageUrl: product.image_url,
    mediaAssetId: product.media_asset_id,
    pricePaise: product.price_paise,
    isVisible: product.is_visible === 1,
    sortOrder: product.sort_order ?? 0,
  };
}

export async function GET(request: Request) {
  try {
    const context = await authenticatedAdminContext(request);
    if (!context) return errorResponse("Unauthorised.", 401);
    const result = await context.database.prepare(
      `SELECT inventory_items.sku, inventory_items.name, inventory_items.stock, inventory_items.reorder_level,
        inventory_items.is_active, product_catalog.category_id, categories.name AS category_name,
        product_catalog.description, product_catalog.image_url, product_catalog.media_asset_id, product_catalog.price_paise,
        product_catalog.is_visible, product_catalog.sort_order
       FROM inventory_items LEFT JOIN product_catalog ON product_catalog.sku = inventory_items.sku
       LEFT JOIN categories ON categories.id = product_catalog.category_id
       ORDER BY categories.sort_order ASC, product_catalog.sort_order ASC, inventory_items.name ASC`,
    ).all<ProductRow>();
    return NextResponse.json({ products: result.results.map(productResponse) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await authenticatedAdminContext(request);
    if (!context) return errorResponse("Unauthorised.", 401);
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return errorResponse("Enter product details.");
    const values = body as Record<string, unknown>;
    const sku = typeof values.sku === "string" ? values.sku.trim().toUpperCase() : "";
    const name = requiredText(values.name, 140);
    const categoryId = requiredText(values.categoryId, 100);
    const description = optionalText(values.description, 1_500);
    const imageUrl = values.imageUrl === undefined ? null : validImageUrl(values.imageUrl);
    const mediaAssetId = optionalText(values.mediaAssetId, 100);
    const stock = values.stock;
    const reorderLevel = values.reorderLevel;
    const pricePaise = values.pricePaise === "" || values.pricePaise === undefined || values.pricePaise === null ? null : values.pricePaise;
    const sortOrder = values.sortOrder === undefined ? 0 : values.sortOrder;
    if (!skuPattern.test(sku) || !name || !categoryId || (values.imageUrl !== undefined && imageUrl === null) ||
      typeof stock !== "number" || !Number.isInteger(stock) || stock < 0 || stock > 100_000 ||
      typeof reorderLevel !== "number" || !Number.isInteger(reorderLevel) || reorderLevel < 0 || reorderLevel > 100_000 ||
      (pricePaise !== null && (typeof pricePaise !== "number" || !Number.isInteger(pricePaise) || pricePaise < 0 || pricePaise > 10_000_000_000)) ||
      typeof sortOrder !== "number" || !Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10_000) {
      return errorResponse("Enter a SKU, product details, stock, price, and display order.");
    }

    const category = await context.database.prepare("SELECT id, name FROM categories WHERE id = ? AND is_active = 1")
      .bind(categoryId).first<CategoryRow>();
    if (!category) return errorResponse("Choose an active category.");
    if (mediaAssetId && !await context.database.prepare("SELECT id FROM media_assets WHERE id = ?").bind(mediaAssetId).first()) return errorResponse("Choose media from the library.");

    await context.database.batch([
      context.database.prepare(
        "INSERT INTO inventory_items (sku, name, collection, stock, reorder_level) VALUES (?, ?, ?, ?, ?)",
      ).bind(sku, name, category.name, stock, reorderLevel),
      context.database.prepare(
        `INSERT INTO product_catalog (sku, category_id, description, image_url, media_asset_id, price_paise, is_visible, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
      ).bind(sku, category.id, description, imageUrl, mediaAssetId, pricePaise, sortOrder),
      ...(stock > 0 ? [context.database.prepare(
        "INSERT INTO stock_movements (sku, quantity_delta, reason) VALUES (?, ?, ?)",
      ).bind(sku, stock, "Initial stock count")] : []),
    ]);
    return NextResponse.json({ created: true, sku }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && /unique|constraint/i.test(error.message)) return errorResponse("That SKU already exists.", 409);
    return databaseErrorResponse(error);
  }
}
