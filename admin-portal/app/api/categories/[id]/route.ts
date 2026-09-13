import { NextResponse } from "next/server";

import { authenticatedAdminContext } from "@/lib/server/guard";
import { databaseErrorResponse, errorResponse, optionalText, requiredText, validImageUrl } from "@/lib/server/http";

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
}

type CurrentCategory = {
  id: string;
  description: string | null;
  image_url: string | null;
  media_asset_id: string | null;
  sort_order: number;
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await authenticatedAdminContext(request);
    if (!context) return errorResponse("Unauthorised.", 401);
    const { id } = await params;
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return errorResponse("Enter category details.");
    const values = body as Record<string, unknown>;
    const name = values.name === undefined ? undefined : requiredText(values.name, 80);
    const slug = values.slug === undefined ? undefined : slugify(String(values.slug));
    const descriptionInput = values.description === undefined ? undefined : optionalText(values.description, 500);
    const imageInput = values.imageUrl === undefined ? undefined : validImageUrl(values.imageUrl);
    const mediaAssetId = values.mediaAssetId === undefined ? undefined : optionalText(values.mediaAssetId, 100);
    const sortOrder = values.sortOrder;
    const isActive = values.isActive;
    if ((values.name !== undefined && !name) || (values.slug !== undefined && !slug) || imageInput === null ||
      (sortOrder !== undefined && (typeof sortOrder !== "number" || !Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10_000)) ||
      (isActive !== undefined && typeof isActive !== "boolean")) return errorResponse("Invalid category update.");

    const existing = await context.database.prepare(
      "SELECT id, description, image_url, media_asset_id, sort_order FROM categories WHERE id = ?",
    ).bind(id).first<CurrentCategory>();
    if (!existing) return errorResponse("Category not found.", 404);
    const description = descriptionInput === undefined ? existing.description : descriptionInput;
    const imageUrl = imageInput === undefined ? existing.image_url : imageInput;
    if (mediaAssetId && !await context.database.prepare("SELECT id FROM media_assets WHERE id = ?").bind(mediaAssetId).first()) return errorResponse("Choose media from the library.");
    const nextMediaAssetId = mediaAssetId === undefined ? existing.media_asset_id : mediaAssetId;
    const nextSortOrder = sortOrder === undefined ? existing.sort_order : sortOrder;
    await context.database.batch([
      context.database.prepare(
        `UPDATE categories SET name = COALESCE(?, name), slug = COALESCE(?, slug),
          description = ?, image_url = ?, media_asset_id = ?, sort_order = ?,
          is_active = COALESCE(?, is_active), updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      ).bind(name ?? null, slug ?? null, description, imageUrl, nextMediaAssetId, nextSortOrder,
        isActive === undefined ? null : Number(isActive), id),
      ...(name ? [context.database.prepare(
        `UPDATE inventory_items SET collection = ?, updated_at = CURRENT_TIMESTAMP
         WHERE sku IN (SELECT sku FROM product_catalog WHERE category_id = ?)`,
      ).bind(name, id)] : []),
    ]);
    return NextResponse.json({ updated: true, id }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && /unique|constraint/i.test(error.message)) return errorResponse("That category name or URL slug already exists.", 409);
    return databaseErrorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await authenticatedAdminContext(request);
    if (!context) return errorResponse("Unauthorised.", 401);
    const { id } = await params;
    const category = await context.database.prepare(
      "SELECT id, name FROM categories WHERE id = ?",
    ).bind(id).first<{ id: string; name: string }>();
    if (!category) return errorResponse("Category not found.", 404);
    const count = await context.database.prepare(
      "SELECT COUNT(*) AS total FROM product_catalog WHERE category_id = ?",
    ).bind(id).first<{ total: number }>();
    if ((count?.total ?? 0) > 0) {
      return errorResponse(`Move or remove the ${count?.total} product(s) in ${category.name} before deleting this category.`, 409);
    }
    await context.database.prepare("DELETE FROM categories WHERE id = ?").bind(id).run();
    return NextResponse.json({ deleted: true, id }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
