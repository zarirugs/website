import { NextResponse } from "next/server";

import { orderStatuses, type OrderStatus } from "@/lib/inventory/types";
import { getDatabase, isAdminRequest } from "@/lib/server/database";
import type { D1Result } from "@/lib/server/d1";
import { databaseErrorResponse, errorResponse } from "@/lib/server/http";

type OrderRow = { id: number; order_number: string; status: OrderStatus };
type OrderItem = { sku: string; item_name: string; quantity: number };
type StockRow = { sku: string; stock: number };

const stockCommittedStatuses = new Set<OrderStatus>([
  "confirmed",
  "in_production",
  "ready",
  "fulfilled",
]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdminRequest(request))) return errorResponse("Unauthorised.", 401);

    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!Number.isInteger(id) || id < 1) return errorResponse("Invalid order.");

    const body = await request.json();
    const nextStatus = body.status as OrderStatus;
    if (!orderStatuses.includes(nextStatus)) return errorResponse("Invalid order status.");

    const database = await getDatabase();
    const order = await database.prepare(
      "SELECT id, order_number, status FROM orders WHERE id = ?",
    ).bind(id).first<OrderRow>();
    if (!order) return errorResponse("Order not found.", 404);
    if (order.status === nextStatus) return NextResponse.json({ order });
    if (nextStatus === "new" || (order.status === "cancelled" && nextStatus !== "cancelled")) {
      return errorResponse("Cancelled or progressed orders cannot be moved back to new. Create a new order if it needs reopening.");
    }

    const wasCommitted = stockCommittedStatuses.has(order.status);
    const willCommit = stockCommittedStatuses.has(nextStatus);
    const items = await database.prepare(
      "SELECT sku, item_name, quantity FROM order_items WHERE order_id = ?",
    ).bind(id).all<OrderItem>();

    if (!wasCommitted && willCommit) {
      const stockChecks = await database.batch<StockRow>(
        items.results.map((item) => database.prepare(
          "SELECT sku, stock FROM inventory_items WHERE sku = ?",
        ).bind(item.sku)),
      );
      const missingStock = stockChecks.some((result: D1Result<StockRow>, index: number) => {
        const stock = result.results[0];
        return !stock || stock.stock < items.results[index].quantity;
      });
      if (missingStock) {
        return errorResponse("There is not enough stock to confirm this order. Update inventory before confirming.", 409);
      }
    }

    const stockStatements = !wasCommitted && willCommit
      ? items.results.flatMap((item) => [
        database.prepare(
          "UPDATE inventory_items SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP WHERE sku = ? AND stock >= ?",
        ).bind(item.quantity, item.sku, item.quantity),
        database.prepare(
          "INSERT INTO stock_movements (sku, quantity_delta, reason, order_id) VALUES (?, ?, ?, ?)",
        ).bind(item.sku, -item.quantity, `Order ${order.order_number} confirmed`, id),
      ])
      : wasCommitted && nextStatus === "cancelled"
        ? items.results.flatMap((item) => [
          database.prepare(
            "UPDATE inventory_items SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE sku = ?",
          ).bind(item.quantity, item.sku),
          database.prepare(
            "INSERT INTO stock_movements (sku, quantity_delta, reason, order_id) VALUES (?, ?, ?, ?)",
          ).bind(item.sku, item.quantity, `Order ${order.order_number} cancelled`, id),
        ])
        : [];

    await database.batch([
      ...stockStatements,
      database.prepare(
        "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      ).bind(nextStatus, id),
    ]);

    return NextResponse.json({ id, status: nextStatus });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
