import { NextResponse } from "next/server";

import { customerFromRow } from "@/lib/server/auth";
import { getCurrentCustomer } from "@/lib/server/customer-account";
import { databaseErrorResponse, errorResponse, requiredText } from "@/lib/server/http";

export async function GET(request: Request) {
  try {
    const { customer } = await getCurrentCustomer(request);
    if (!customer) return errorResponse("Sign in to view your account.", 401);

    const response = NextResponse.json({ user: customer });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return errorResponse("Enter the name you would like to use.");
    const fullName = requiredText((body as Record<string, unknown>).fullName, "name", 120);
    if (!fullName) return errorResponse("Enter the name you would like to use.");

    const { database, customer } = await getCurrentCustomer(request);
    if (!customer) return errorResponse("Sign in to update your account.", 401);

    await database.prepare(
      "UPDATE customers SET full_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    ).bind(fullName, customer.id).run();

    const response = NextResponse.json({ user: customerFromRow({ ...customer, full_name: fullName }) });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
