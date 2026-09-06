import { NextResponse } from "next/server";

import { authenticatedAdminContext } from "@/lib/server/guard";
import { databaseErrorResponse, errorResponse, optionalText, requiredText, validImageUrl } from "@/lib/server/http";

type CurrentProduct = { sku: string; stock: number; category_id: string | null; category_name: string | null; description: string | null; image_url: string | null; price_paise: number | null; is_visible: number | null; sort_order: number | null };
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
        product_catalog.description, product_catalog.image_url, product_catalog.price_paise,
        product_catalog.is_visible, product_catalog.sort_order
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
    const pricePaise = values.pricePaise === undefined ? current.price_paise : values.pricePaise === "" || values.pricePaise === null ? null : values.pricePaise;
    const sortOrder = values.sortOrder === undefined ? current.sort_order ?? 0 : values.sortOrder;
    let categoryId = values.categoryId === undefined ? current.category_id : requiredText(values.categoryId, 100);
    let categoryName = current.category_name;

    if ((values.name !== undefined && !name) ||
      (stock !== undefined && (typeof stock !== "number" || !Number.isInteger(stock) || stock < 0 || stock > 100_000)) ||
      (reorderLevel !== undefined && (typeof reorderLevel !== "number" || !Number.isInteger(reorderLevel) || reorderLevel < 0 || reorderLevel > 100_000)) ||
      (isActive !== undefined && typeof isActive !== "boolean") || (isVisible !== undefined && typeof isVisible !== "boolean") ||
      imageUrl === null || (pricePaise !== null && (typeof pricePaise !== "number" || !Number.isInteger(pricePaise) || pricePaise < 0 || pricePaise > 10_000_000_000)) ||
      typeof sortOrder !== "number" || !Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10_000 || !categoryId) return errorResponse("Invalid product update.");

    if (values.categoryId !== undefined) {
      const category = await context.database.prepare("SELECT id, name FROM categories WHERE id = ? AND is_active = 1")
        .bind(categoryId).first<CategoryRow>();
      if (!category) return errorResponse("Choose an active category.");
      categoryId = category.id;
      categoryName = category.name;
    }

    const nextStock = stock ?? current.stock;
    await context.database.batch([
      context.database.prepare(
        `UPDATE inventory_items SET stock = ?, reorder_level = COALESCE(?, reorder_level), name = COALESCE(?, name),
          collection = COALESCE(?, collection), is_active = COALESCE(?, is_active), updated_at = CURRENT_TIMESTAMP WHERE sku = ?`,
      ).bind(nextStock, reorderLevel ?? null, name ?? null, categoryName ?? null,
        isActive === undefined ? null : Number(isActive), sku),
      context.database.prepare(
        `INSERT INTO product_catalog (sku, category_id, description, image_url, price_paise, is_visible, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(sku) DO UPDATE SET category_id = excluded.category_id, description = excluded.description,
           image_url = excluded.image_url, price_paise = excluded.price_paise, is_visible = excluded.is_visible,
           sort_order = excluded.sort_order, updated_at = CURRENT_TIMESTAMP`,
      ).bind(sku, categoryId, description, imageUrl, pricePaise, isVisible === undefined ? 1 : Number(isVisible), sortOrder),
      ...(nextStock !== current.stock ? [context.database.prepare(
        "INSERT INTO stock_movements (sku, quantity_delta, reason) VALUES (?, ?, ?)",
      ).bind(sku, nextStock - current.stock, "Manual stock count")] : []),
    ]);
    return NextResponse.json({ updated: true, sku }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
