import type { D1Database } from "./d1";

export function parseImageIds(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > 12) return null;
  if (!value.every((id) => typeof id === "string" && id.trim().length > 0 && id.length <= 100)) return null;
  const ids = value.map((id: string) => id.trim());
  return new Set(ids).size === ids.length ? ids : null;
}

export async function validProductImages(database: D1Database, ids: string[], categoryId: string) {
  if (!ids.length) return true;
  const rows = await database.prepare(`SELECT id FROM media_assets WHERE category_id = ? AND source_type IN ('upload', 'url') AND id IN (${ids.map(() => "?").join(",")})`).bind(categoryId, ...ids).all<{ id: string }>();
  return rows.results.length === ids.length;
}

export function replaceProductImages(database: D1Database, sku: string, ids: string[]) {
  return [database.prepare("DELETE FROM product_images WHERE sku = ?").bind(sku), ...ids.map((id, index) => database.prepare("INSERT INTO product_images (sku, media_asset_id, sort_order) VALUES (?, ?, ?)").bind(sku, id, index))];
}
