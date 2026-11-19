import { NextResponse } from "next/server";
import { getDatabase, isAdminRequest } from "@/lib/server/database";
import { errorResponse, databaseErrorResponse } from "@/lib/server/http";
import { allowPublicRequest, isSameOrigin } from "@/lib/server/public-request";
export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return errorResponse("Invalid request origin.", 403);
    const text = await request.text();
    if (text.length > 2048) return errorResponse("Request too large.", 413);
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return errorResponse("Invalid request.");
    const body = parsed as { email?: unknown; website?: unknown };
    if (body.website) return NextResponse.json({ received: true }, { status: 202 });
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return errorResponse("Enter a valid email address.");
    const database = await getDatabase();
    if (!(await allowPublicRequest(database, request, "newsletter", 5))) return errorResponse("Please wait a minute before trying again.", 429);
    await database.prepare("INSERT INTO newsletter_subscribers (email, consent_version) VALUES (?, ?) ON CONFLICT(email) DO NOTHING").bind(email, "private-register-2026-11").run();
    return NextResponse.json({ message: "Thank you. Your interest in ZARI updates has been recorded." }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return error instanceof SyntaxError ? errorResponse("Enter a valid signup request.") : databaseErrorResponse(error); }
}
export async function GET(request: Request) {
  try {
    if (!(await isAdminRequest(request))) return errorResponse("Unauthorised.", 401);
    const result = await (await getDatabase()).prepare("SELECT email, subscribed_at, consent_version FROM newsletter_subscribers ORDER BY subscribed_at DESC LIMIT 1000").all();
    return NextResponse.json({ subscribers: result.results }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return databaseErrorResponse(error); }
}
