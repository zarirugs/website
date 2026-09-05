import { NextResponse } from "next/server";

import { getAuthenticatedCustomer } from "@/lib/server/auth";
import { getDatabase } from "@/lib/server/database";
import { databaseErrorResponse, errorResponse } from "@/lib/server/http";

export async function GET(request: Request) {
  try {
    const customer = await getAuthenticatedCustomer(request, await getDatabase());
    if (!customer) return errorResponse("Sign in to continue.", 401);
    const response = NextResponse.json({ user: customer });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
