import { NextResponse } from "next/server";

import { getDatabase, isAdminRequest } from "@/lib/server/database";
import { databaseErrorResponse, errorResponse, requiredText } from "@/lib/server/http";

type InventoryRow = {
  sku: string;
  name: string;
  collection: string;
  stock: number;
  reorder_level: number;
  is_active: number;
  updated_at: string;
};

const skuPattern = /^[A-Z0-9-]{3,64}$/;

export async function GET(request: Request) {
  try {
    if (!(await isAdminRequest(request))) return errorResponse("Unauthorised.", 401);
    const database = await getDatabase();
    const result = await database.prepare(
      `SELECT sku, name, collection, stock, reorder_level, is_active, updated_at
       FROM inventory_items ORDER BY collection ASC, name ASC`,
    ).all<InventoryRow>();

    const inventory = result.results.map((item: InventoryRow) => ({
      sku: item.sku,
      name: item.name,
      collection: item.collection,
      stock: item.stock,
      reorderLevel: item.reorder_level,
      isActive: item.is_active === 1,
      updatedAt: item.updated_at,
    }));
    return NextResponse.json({ inventory });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isAdminRequest(request))) return errorResponse("Unauthorised.", 401);
    const body = await request.json() as Record<string, unknown>;
    const sku = typeof body.sku === "string" ? body.sku.trim().toUpperCase() : "";
    const name = requiredText(body.name, "name", 140);
    const collection = requiredText(body.collection, "collection", 80);
    const stock = typeof body.stock === "number" ? body.stock : null;
    const reorderLevel = typeof body.reorderLevel === "number" ? body.reorderLevel : null;

    if (!skuPattern.test(sku) || !name || !collection || stock === null || reorderLevel === null ||
      !Number.isInteger(stock) || stock < 0 || stock > 100000 ||
      !Number.isInteger(reorderLevel) || reorderLevel < 0 || reorderLevel > 100000) {
      return errorResponse("Enter a SKU, product name, collection, stock count, and reorder level.");
    }

    const database = await getDatabase();
    await database.prepare(
      "INSERT INTO inventory_items (sku, name, collection, stock, reorder_level) VALUES (?, ?, ?, ?, ?)",
    ).bind(sku, name, collection, stock, reorderLevel).run();

    if (stock > 0) {
      await database.prepare(
        "INSERT INTO stock_movements (sku, quantity_delta, reason) VALUES (?, ?, ?)",
      ).bind(sku, stock, "Initial stock count").run();
    }

    return NextResponse.json({ created: true, sku }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && /unique/i.test(error.message)) return errorResponse("That SKU already exists.", 409);
    return databaseErrorResponse(error);
  }
}
