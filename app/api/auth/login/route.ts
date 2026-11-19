import { allowPublicRequest, isSameOrigin } from "@/lib/server/public-request";
import { NextResponse } from "next/server";

import { createSession, customerFromRow, findCustomerByEmail, passwordMatches, sessionCookie } from "@/lib/server/auth";
import { getDatabase } from "@/lib/server/database";
import { databaseErrorResponse, errorResponse, requiredText } from "@/lib/server/http";

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return errorResponse("Invalid request origin.", 403);
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return errorResponse("Enter your email and password.");
    const values = body as Record<string, unknown>;
    const email = requiredText(values.email, "email", 254)?.toLowerCase();
    const password = typeof values.password === "string" ? values.password : "";
    if (!email || !password || password.length > 128) return errorResponse("Enter your email and password.");

    const database = await getDatabase();
    if (!(await allowPublicRequest(database, request, "login", 10))) return errorResponse("Please wait a minute before trying again.", 429);
    const customer = await findCustomerByEmail(database, email);
    if (!customer || !(await passwordMatches(password, customer.password_hash, customer.password_salt))) {
      return errorResponse("Incorrect email or password.", 401);
    }

    const response = NextResponse.json({ user: customerFromRow(customer) });
    response.headers.append("Set-Cookie", sessionCookie(await createSession(database, customer.id), request));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
