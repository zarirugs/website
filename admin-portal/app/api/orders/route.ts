import { NextResponse } from "next/server";

import { orderStages, type OrderStage } from "@/lib/data/orders";
import { authenticatedAdminContext } from "@/lib/server/guard";
import { databaseErrorResponse, errorResponse } from "@/lib/server/http";

type OrderRow = {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  delivery_address: string | null;
  notes: string | null;
  workflow_status: OrderStage | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type ItemRow = { order_id: number; sku: string; item_name: string; quantity: number };

export async function GET(request: Request) {
  try {
    const context = await authenticatedAdminContext(request);
    if (!context) return errorResponse("Unauthorised.", 401);
    const [orderResult, itemResult] = await context.database.batch([
      context.database.prepare(
        `SELECT id, order_number, customer_name, customer_email, customer_phone, delivery_address, notes,
          workflow_status, status, created_at, updated_at FROM orders ORDER BY created_at DESC LIMIT 100`,
      ),
      context.database.prepare(
        `SELECT order_items.order_id, order_items.sku, order_items.item_name, order_items.quantity
         FROM order_items JOIN orders ON orders.id = order_items.order_id
         ORDER BY orders.created_at DESC, order_items.id ASC LIMIT 500`,
      ),
    ]);
    const itemsByOrder = new Map<number, ItemRow[]>();
    for (const item of itemResult.results as ItemRow[]) {
      const lines = itemsByOrder.get(item.order_id) ?? [];
      lines.push(item);
      itemsByOrder.set(item.order_id, lines);
    }
    const orders = (orderResult.results as OrderRow[]).map((order) => ({
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      deliveryAddress: order.delivery_address,
      notes: order.notes,
      stage: order.workflow_status ?? "new",
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: (itemsByOrder.get(order.id) ?? []).map((item) => ({ sku: item.sku, name: item.item_name, quantity: item.quantity })),
    }));
    return NextResponse.json({ orders, stages: orderStages }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
