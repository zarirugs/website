import { NextResponse } from "next/server";

import { createPasswordRecord, createSession, customerFromRow, findCustomerByEmail, sessionCookie } from "@/lib/server/auth";
import { getDatabase } from "@/lib/server/database";
import { databaseErrorResponse, errorResponse, requiredText } from "@/lib/server/http";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return errorResponse("Enter your account details.");
    const values = body as Record<string, unknown>;
    const fullName = requiredText(values.fullName, "name", 120);
    const email = requiredText(values.email, "email", 254)?.toLowerCase();
    const password = typeof values.password === "string" ? values.password : "";

    if (!fullName || !email || !emailPattern.test(email) || password.length < 10 || password.length > 128) {
      return errorResponse("Use a valid email and a password of at least 10 characters.");
    }

    const database = await getDatabase();
    if (await findCustomerByEmail(database, email)) {
      return errorResponse("An account already exists for this email. Sign in instead.", 409);
    }

    const customer = { id: crypto.randomUUID(), email, full_name: fullName };
    const passwordRecord = await createPasswordRecord(password);
    await database.prepare(
      `INSERT INTO customers (id, email, full_name, password_hash, password_salt)
       VALUES (?, ?, ?, ?, ?)`,
    ).bind(customer.id, customer.email, customer.full_name, passwordRecord.passwordHash, passwordRecord.passwordSalt).run();

    const response = NextResponse.json({ user: customerFromRow(customer) }, { status: 201 });
    response.headers.append("Set-Cookie", sessionCookie(await createSession(database, customer.id), request));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    if (error instanceof Error && /unique|constraint/i.test(error.message)) {
      return errorResponse("An account already exists for this email. Sign in instead.", 409);
    }
    return databaseErrorResponse(error);
  }
}
