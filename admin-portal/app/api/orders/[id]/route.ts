import { NextResponse } from "next/server";

import { orderStages, stockCommittedStages, type OrderStage } from "@/lib/data/orders";
import type { D1Result } from "@/lib/server/d1";
import { authenticatedAdminContext } from "@/lib/server/guard";
import { databaseErrorResponse, errorResponse } from "@/lib/server/http";

type OrderRow = { id: number; order_number: string; workflow_status: OrderStage | null };
type OrderItem = { sku: string; item_name: string; quantity: number };
type StockRow = { sku: string; stock: number };

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await authenticatedAdminContext(request);
    if (!context) return errorResponse("Unauthorised.", 401);
    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!Number.isInteger(id) || id < 1) return errorResponse("Invalid order.");
    const body: unknown = await request.json();
    const stage = body && typeof body === "object" ? (body as { stage?: unknown }).stage : undefined;
    if (typeof stage !== "string" || !orderStages.includes(stage as OrderStage)) return errorResponse("Invalid order stage.");
    const nextStage = stage as OrderStage;

    const order = await context.database.prepare(
      "SELECT id, order_number, workflow_status FROM orders WHERE id = ?",
    ).bind(id).first<OrderRow>();
    if (!order) return errorResponse("Order not found.", 404);
    const currentStage = order.workflow_status ?? "new";
    if (currentStage === nextStage) return NextResponse.json({ id, stage: nextStage });
    if (currentStage === "cancelled" || currentStage === "delivered") {
      return errorResponse("Delivered and cancelled orders cannot be changed.", 409);
    }

    const items = await context.database.prepare(
      "SELECT sku, item_name, quantity FROM order_items WHERE order_id = ?",
    ).bind(id).all<OrderItem>();
    const wasCommitted = stockCommittedStages.has(currentStage);
    const willCommit = stockCommittedStages.has(nextStage);

    if (!wasCommitted && willCommit) {
      const stockChecks = await context.database.batch<StockRow>(
        items.results.map((item) => context.database.prepare("SELECT sku, stock FROM inventory_items WHERE sku = ?").bind(item.sku)),
      );
      const missingStock = stockChecks.some((result: D1Result<StockRow>, index) => {
        const item = result.results[0];
        return !item || item.stock < items.results[index].quantity;
      });
      if (missingStock) return errorResponse("There is not enough stock to move this order to paid.", 409);
    }

    const stockStatements = !wasCommitted && willCommit
      ? items.results.flatMap((item) => [
        context.database.prepare(
          "UPDATE inventory_items SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP WHERE sku = ? AND stock >= ?",
        ).bind(item.quantity, item.sku, item.quantity),
        context.database.prepare(
          "INSERT INTO stock_movements (sku, quantity_delta, reason, order_id) VALUES (?, ?, ?, ?)",
        ).bind(item.sku, -item.quantity, `Order ${order.order_number} paid`, id),
      ])
      : wasCommitted && nextStage === "cancelled"
        ? items.results.flatMap((item) => [
          context.database.prepare(
            "UPDATE inventory_items SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE sku = ?",
          ).bind(item.quantity, item.sku),
          context.database.prepare(
            "INSERT INTO stock_movements (sku, quantity_delta, reason, order_id) VALUES (?, ?, ?, ?)",
          ).bind(item.sku, item.quantity, `Order ${order.order_number} cancelled`, id),
        ])
        : [];

    await context.database.batch([
      ...stockStatements,
      context.database.prepare(
        "UPDATE orders SET workflow_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      ).bind(nextStage, id),
    ]);
    return NextResponse.json({ id, stage: nextStage }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
