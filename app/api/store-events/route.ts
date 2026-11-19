import { NextResponse } from "next/server";
import { getDatabase, isAdminRequest } from "@/lib/server/database";
import { errorResponse, databaseErrorResponse } from "@/lib/server/http";
import { allowPublicRequest, isSameOrigin } from "@/lib/server/public-request";
const events = new Set(["product_view", "add_to_bag", "enquiry_started", "enquiry_submitted"]);
export async function POST(request: Request) {
  try {
    if (request.headers.get("dnt") === "1" || request.headers.get("sec-gpc") === "1") return new Response(null, { status: 204 });
    if (!isSameOrigin(request)) return errorResponse("Invalid request origin.", 403);
    const text = await request.text();
    if (text.length > 512) return errorResponse("Request too large.", 413);
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return errorResponse("Invalid request.");
    const body = parsed as { event?: unknown; sku?: unknown };
    if (typeof body.event !== "string" || !events.has(body.event) || (body.sku !== undefined && (typeof body.sku !== "string" || !/^[A-Z0-9-]{3,64}$/.test(body.sku)))) return errorResponse("Invalid event.");
    const database = await getDatabase();
    if (!(await allowPublicRequest(database, request, "analytics", 60))) return errorResponse("Too many events.", 429);
    const sku = typeof body.sku === "string" ? body.sku : null;
    if (sku && !(await database.prepare("SELECT sku FROM inventory_items WHERE sku = ? AND is_active = 1").bind(sku).first())) return errorResponse("Unknown piece.");
    await database.prepare("INSERT INTO storefront_events (event_name, sku) VALUES (?, ?)").bind(body.event, sku).run();
    return new Response(null, { status: 204 });
  } catch (error) { return error instanceof SyntaxError ? errorResponse("Invalid event.") : databaseErrorResponse(error); }
}
export async function GET(request: Request) {
  try {
    if (!(await isAdminRequest(request))) return errorResponse("Unauthorised.", 401);
    const result = await (await getDatabase()).prepare("SELECT date(created_at) AS day, event_name AS event, COUNT(*) AS count FROM storefront_events WHERE created_at >= datetime('now', '-30 days') GROUP BY day, event_name ORDER BY day DESC, event_name").all();
    return NextResponse.json({ dailyCounts: result.results }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return databaseErrorResponse(error); }
}
