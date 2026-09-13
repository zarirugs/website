import { NextResponse } from "next/server";

import { getCurrentCustomer } from "@/lib/server/customer-account";
import type { D1Result } from "@/lib/server/d1";
import { databaseErrorResponse, errorResponse } from "@/lib/server/http";
import type { CustomerOrder, CustomerOrderItem } from "@/lib/store/types";

type OrderRow = {
  id: number;
  order_number: string;
  status: string;
  workflow_status: string | null;
  delivery_address: string | null;
  created_at: string;
  updated_at: string;
};

type OrderItemRow = {
  order_id: number;
  sku: string;
  item_name: string;
  quantity: number;
};

const customerOrderClause = "(orders.customer_id = ? OR (orders.customer_id IS NULL AND orders.customer_email = ? COLLATE NOCASE))";

export async function GET(request: Request) {
  try {
    const { database, customer } = await getCurrentCustomer(request);
    if (!customer) return errorResponse("Sign in to view your orders.", 401);

    const [ordersResult, itemsResult] = await database.batch([
      database.prepare(
        `SELECT orders.id, orders.order_number, orders.status, orders.workflow_status, orders.delivery_address,
          orders.created_at, orders.updated_at
         FROM orders WHERE ${customerOrderClause}
         ORDER BY orders.created_at DESC LIMIT 100`,
      ).bind(customer.id, customer.email),
      database.prepare(
        `SELECT order_items.order_id, order_items.sku, order_items.item_name, order_items.quantity
         FROM order_items JOIN orders ON orders.id = order_items.order_id
         WHERE ${customerOrderClause}
         ORDER BY orders.created_at DESC, order_items.id ASC LIMIT 500`,
      ).bind(customer.id, customer.email),
    ]);

    const itemsByOrder = new Map<number, CustomerOrderItem[]>();
    for (const item of (itemsResult as D1Result<OrderItemRow>).results) {
      const lines = itemsByOrder.get(item.order_id) ?? [];
      lines.push({ sku: item.sku, name: item.item_name, quantity: item.quantity });
      itemsByOrder.set(item.order_id, lines);
    }

    const orders: CustomerOrder[] = (ordersResult as D1Result<OrderRow>).results.map((order) => ({
      id: order.id,
      orderNumber: order.order_number,
      status: order.workflow_status ?? order.status,
      deliveryAddress: order.delivery_address,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: itemsByOrder.get(order.id) ?? [],
    }));

    const response = NextResponse.json({ orders });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
