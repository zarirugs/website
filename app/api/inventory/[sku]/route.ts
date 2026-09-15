import { NextResponse } from "next/server";

import { getDatabase, isAdminRequest } from "@/lib/server/database";
import { databaseErrorResponse, errorResponse, requiredText } from "@/lib/server/http";

type CurrentItem = { sku: string; stock: number };

export async function PATCH(request: Request, { params }: { params: Promise<{ sku: string }> }) {
  try {
    if (!(await isAdminRequest(request))) return errorResponse("Unauthorised.", 401);
    const { sku } = await params;
    const body = await request.json() as Record<string, unknown>;
    const database = await getDatabase();
    const current = await database.prepare(
      "SELECT sku, stock FROM inventory_items WHERE sku = ?",
    ).bind(sku).first<CurrentItem>();
    if (!current) return errorResponse("Inventory item not found.", 404);

    const stock = typeof body.stock === "number" ? body.stock : undefined;
    const reorderLevel = typeof body.reorderLevel === "number" ? body.reorderLevel : undefined;
    const name = body.name === undefined ? undefined : requiredText(body.name, "name", 140);
    const collection = body.collection === undefined ? undefined : requiredText(body.collection, "collection", 80);
    const isActive = body.isActive;

    if ((stock !== undefined && (!Number.isInteger(stock) || stock < 0 || stock > 100000)) ||
      (reorderLevel !== undefined && (!Number.isInteger(reorderLevel) || reorderLevel < 0 || reorderLevel > 100000)) ||
      (body.name !== undefined && !name) || (body.collection !== undefined && !collection) ||
      (isActive !== undefined && typeof isActive !== "boolean")) {
      return errorResponse("Invalid inventory update.");
    }

    const nextStock = stock ?? current.stock;
    await database.prepare(
      `UPDATE inventory_items SET stock = ?, reorder_level = COALESCE(?, reorder_level),
        name = COALESCE(?, name), collection = COALESCE(?, collection),
        is_active = COALESCE(?, is_active), updated_at = CURRENT_TIMESTAMP WHERE sku = ?`,
    ).bind(nextStock, reorderLevel ?? null, name ?? null, collection ?? null,
      isActive === undefined ? null : Number(isActive), sku).run();

    const delta = nextStock - current.stock;
    if (delta !== 0) {
      await database.prepare(
        "INSERT INTO stock_movements (sku, quantity_delta, reason) VALUES (?, ?, ?)",
      ).bind(sku, delta, "Manual stock count").run();
    }

    return NextResponse.json({ updated: true, sku });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
