import { NextResponse } from "next/server";

import { getAuthenticatedCustomer } from "@/lib/server/auth";
import { getCustomerCart } from "@/lib/server/cart";
import { getDatabase } from "@/lib/server/database";
import { databaseErrorResponse, errorResponse } from "@/lib/server/http";

export async function DELETE(request: Request, { params }: { params: Promise<{ sku: string }> }) {
  try {
    const database = await getDatabase();
    const customer = await getAuthenticatedCustomer(request, database);
    if (!customer) return errorResponse("Sign in to manage your cart.", 401);
    const { sku } = await params;
    await database.prepare("DELETE FROM cart_items WHERE customer_id = ? AND sku = ?").bind(customer.id, sku).run();
    const response = NextResponse.json(await getCustomerCart(database, customer.id));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
