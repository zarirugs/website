import { NextResponse } from "next/server";

import {
  orderStages,
  stockCommittedStages,
  type OrderStage,
} from "@/lib/data/orders";
import type { D1Result } from "@/lib/server/d1";
import { authenticatedAdminContext } from "@/lib/server/guard";
import { databaseErrorResponse, errorResponse } from "@/lib/server/http";

type OrderRow = {
  id: number;
  order_number: string;
  workflow_status: OrderStage | null;
};
type OrderItem = { sku: string; item_name: string; quantity: number };
type StockRow = { sku: string; stock: number };

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await authenticatedAdminContext(request);
    if (!context) return errorResponse("Unauthorised.", 401);
    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!Number.isInteger(id) || id < 1) return errorResponse("Invalid order.");
    const body: unknown = await request.json();
    const stage =
      body && typeof body === "object"
        ? (body as { stage?: unknown }).stage
        : undefined;
    if (typeof stage !== "string" || !orderStages.includes(stage as OrderStage))
      return errorResponse("Invalid order stage.");
    const nextStage = stage as OrderStage;

    const order = await context.database
      .prepare(
        "SELECT id, order_number, workflow_status FROM orders WHERE id = ?",
      )
      .bind(id)
      .first<OrderRow>();
    if (!order) return errorResponse("Order not found.", 404);
    const currentStage = order.workflow_status ?? "new";
    if (currentStage === nextStage)
      return NextResponse.json({ id, stage: nextStage });
    if (currentStage === "cancelled" || currentStage === "delivered") {
      return errorResponse(
        "Delivered and cancelled orders cannot be changed.",
        409,
      );
    }

    const items = await context.database
      .prepare(
        "SELECT sku, item_name, quantity FROM order_items WHERE order_id = ?",
      )
      .bind(id)
      .all<OrderItem>();
    const wasCommitted = stockCommittedStages.has(currentStage);
    const willCommit = stockCommittedStages.has(nextStage);

    if (!wasCommitted && willCommit) {
      const stockChecks = await context.database.batch<StockRow>(
        items.results.map((item) =>
          context.database
            .prepare("SELECT sku, stock FROM inventory_items WHERE sku = ?")
            .bind(item.sku),
        ),
      );
      const missingStock = stockChecks.some(
        (result: D1Result<StockRow>, index) => {
          const item = result.results[0];
          return !item || item.stock < items.results[index].quantity;
        },
      );
      if (missingStock)
        return errorResponse(
          "There is not enough stock to move this order to paid.",
          409,
        );
    }

    // Every statement sees the same stage inside D1's atomic batch. A stale
    // request must not reserve stock twice or undo another operator's change.
    const stageGuard =
      "EXISTS (SELECT 1 FROM orders WHERE id = ? AND COALESCE(workflow_status, 'new') = ?)";
    const delta =
      !wasCommitted && willCommit ? -1 : wasCommitted && !willCommit ? 1 : 0;
    const stockStatements = delta
      ? items.results.flatMap((item) => [
          context.database
            .prepare(
              `UPDATE inventory_items SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE sku = ? AND ${stageGuard}`,
            )
            .bind(delta * item.quantity, item.sku, id, currentStage),
          context.database
            .prepare(
              `INSERT INTO stock_movements (sku, quantity_delta, reason, order_id) SELECT ?, ?, ?, ? WHERE ${stageGuard}`,
            )
            .bind(
              item.sku,
              delta * item.quantity,
              `Order ${order.order_number} moved to ${nextStage}`,
              id,
              id,
              currentStage,
            ),
        ])
      : [];

    // The stock CHECK constraint rolls back the entire batch if another order
    // used the last pieces after the earlier availability check.
    const results = await context.database.batch<{ id: number }>([
      ...stockStatements,
      context.database
        .prepare(
          "UPDATE orders SET workflow_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND COALESCE(workflow_status, 'new') = ? RETURNING id",
        )
        .bind(nextStage, id, currentStage),
    ]);
    if (!results.at(-1)?.results.length)
      return errorResponse(
        "This order changed while you were editing it. Refresh before trying again.",
        409,
      );
    return NextResponse.json(
      { id, stage: nextStage },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      /CHECK constraint failed.*stock/i.test(error.message)
    ) {
      return errorResponse(
        "Stock changed while you were editing. Refresh and check availability before trying again.",
        409,
      );
    }
    return databaseErrorResponse(error);
  }
}
