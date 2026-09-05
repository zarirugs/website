import { NextResponse } from "next/server";

import { getAuthenticatedCustomer } from "@/lib/server/auth";
import { getCustomerCart } from "@/lib/server/cart";
import { getDatabase } from "@/lib/server/database";
import { databaseErrorResponse, errorResponse } from "@/lib/server/http";

type InventoryRow = { sku: string; stock: number; is_active: number };

const skuPattern = /^[A-Z0-9-]{3,64}$/;

async function currentCustomer(request: Request) {
  const database = await getDatabase();
  const customer = await getAuthenticatedCustomer(request, database);
  return { database, customer };
}

export async function GET(request: Request) {
  try {
    const { database, customer } = await currentCustomer(request);
    if (!customer) return errorResponse("Sign in to view your cart.", 401);
    const response = NextResponse.json(await getCustomerCart(database, customer.id));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return errorResponse("Invalid cart item.");
    const { sku: rawSku, quantity } = body as { sku?: unknown; quantity?: unknown };
    const sku = typeof rawSku === "string" ? rawSku.trim().toUpperCase() : "";
    if (!skuPattern.test(sku) || typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 0 || quantity > 25) {
      return errorResponse("Choose a valid product and quantity.");
    }

    const { database, customer } = await currentCustomer(request);
    if (!customer) return errorResponse("Sign in to add items to your cart.", 401);
    const inventory = await database.prepare(
      "SELECT sku, stock, is_active FROM inventory_items WHERE sku = ?",
    ).bind(sku).first<InventoryRow>();
    if (!inventory || inventory.is_active !== 1) return errorResponse("This piece is no longer available.", 404);
    if (quantity > inventory.stock) return errorResponse("That quantity is not currently available.", 409);

    if (quantity === 0) {
      await database.prepare("DELETE FROM cart_items WHERE customer_id = ? AND sku = ?").bind(customer.id, sku).run();
    } else {
      await database.prepare(
        `INSERT INTO cart_items (customer_id, sku, quantity)
         VALUES (?, ?, ?)
         ON CONFLICT(customer_id, sku) DO UPDATE SET quantity = excluded.quantity, updated_at = CURRENT_TIMESTAMP`,
      ).bind(customer.id, sku, quantity).run();
    }

    const response = NextResponse.json(await getCustomerCart(database, customer.id));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
