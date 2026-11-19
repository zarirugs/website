import { NextResponse } from "next/server";
import { orderStatuses, type OrderStatus } from "@/lib/inventory/types";
import { getDatabase, isAdminRequest } from "@/lib/server/database";
import { databaseErrorResponse, errorResponse } from "@/lib/server/http";

type OrderRow = { id: number; order_number: string; status: OrderStatus };
const committed = new Set<OrderStatus>(["confirmed", "in_production", "ready", "fulfilled"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdminRequest(request))) return errorResponse("Unauthorised.", 401);
    const id = Number((await params).id);
    if (!Number.isInteger(id) || id < 1) return errorResponse("Invalid order.");
    const { status } = await request.json() as { status: OrderStatus };
    if (!orderStatuses.includes(status)) return errorResponse("Invalid order status.");
    const database = await getDatabase();
    const order = await database.prepare("SELECT id, order_number, status FROM orders WHERE id = ?").bind(id).first<OrderRow>();
    if (!order) return errorResponse("Order not found.", 404);
    if (order.status === status) return NextResponse.json({ id, status });
    if (status === "new" || order.status === "cancelled") return errorResponse("Cancelled orders cannot be reopened and progressed orders cannot return to new.");

    const reserve = !committed.has(order.status) && committed.has(status);
    const release = committed.has(order.status) && status === "cancelled";
    const token = crypto.randomUUID();
    const guard = "EXISTS (SELECT 1 FROM orders WHERE id = ? AND stock_transition_token = ?)";
    // D1 executes the entire batch transactionally. The unique token makes all
    // effects conditional on this request winning the status-and-stock check.
    const stockGuard = reserve ? `AND EXISTS (SELECT 1 FROM order_items WHERE order_id = orders.id) AND NOT EXISTS (
      SELECT line.sku FROM order_items AS line
      LEFT JOIN inventory_items AS inventory ON inventory.sku = line.sku
      WHERE line.order_id = orders.id GROUP BY line.sku
      HAVING MAX(inventory.stock) IS NULL OR MAX(inventory.stock) < SUM(line.quantity)
    )` : "";
    const results = await database.batch([
      database.prepare(`UPDATE orders SET status = ?, stock_transition_token = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status = ? ${stockGuard} RETURNING id`)
        .bind(status, token, id, order.status),
      ...(reserve ? [database.prepare(`INSERT INTO storefront_events (event_name) SELECT 'order_confirmed' WHERE ${guard}`).bind(id, token)] : []),
      ...(reserve || release ? [
        database.prepare(`UPDATE inventory_items SET stock = stock + (? * (SELECT SUM(quantity) FROM order_items WHERE order_id = ? AND sku = inventory_items.sku)), updated_at = CURRENT_TIMESTAMP
          WHERE sku IN (SELECT sku FROM order_items WHERE order_id = ?) AND ${guard}`)
          .bind(release ? 1 : -1, id, id, id, token),
        database.prepare(`INSERT INTO stock_movements (sku, quantity_delta, reason, order_id)
          SELECT sku, ? * SUM(quantity), ?, ? FROM order_items WHERE order_id = ? AND ${guard} GROUP BY sku`)
          .bind(release ? 1 : -1, `Order ${order.order_number} ${release ? "cancelled" : "confirmed"}`, id, id, id, token),
      ] : []),
    ]);
    if (!results[0].results.length) return errorResponse("The order or available stock changed. Refresh and review the request before trying again.", 409);
    return NextResponse.json({ id, status });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
