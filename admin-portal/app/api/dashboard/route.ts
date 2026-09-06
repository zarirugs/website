import { NextResponse } from "next/server";

import { authenticatedAdminContext } from "@/lib/server/guard";
import { databaseErrorResponse, errorResponse } from "@/lib/server/http";

type CountRow = { count: number };

export async function GET(request: Request) {
  try {
    const context = await authenticatedAdminContext(request);
    if (!context) return errorResponse("Unauthorised.", 401);

    const [orders, awaitingPayment, lowStock, products] = await context.database.batch<CountRow>([
      context.database.prepare("SELECT COUNT(*) AS count FROM orders WHERE COALESCE(workflow_status, 'new') NOT IN ('delivered', 'cancelled')"),
      context.database.prepare("SELECT COUNT(*) AS count FROM orders WHERE COALESCE(workflow_status, 'new') = 'payment_pending'"),
      context.database.prepare("SELECT COUNT(*) AS count FROM inventory_items WHERE stock <= reorder_level AND is_active = 1"),
      context.database.prepare("SELECT COUNT(*) AS count FROM product_catalog WHERE is_visible = 1"),
    ]);

    return NextResponse.json({
      admin: context.admin,
      metrics: {
        openOrders: orders.results[0]?.count ?? 0,
        awaitingPayment: awaitingPayment.results[0]?.count ?? 0,
        lowStock: lowStock.results[0]?.count ?? 0,
        visibleProducts: products.results[0]?.count ?? 0,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
