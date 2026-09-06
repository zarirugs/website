import { NextResponse } from "next/server";

import { adminCount, adminSessionCookie, createAdminSession, createPasswordRecord, findAdminByEmail } from "@/lib/server/auth";
import { getBootstrapToken, getDatabase } from "@/lib/server/database";
import { stringToBytes, timingSafeEqual } from "@/lib/server/crypto";
import { databaseErrorResponse, errorResponse, requiredText } from "@/lib/server/http";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return errorResponse("Enter the first administrator details.");
    const values = body as Record<string, unknown>;
    const fullName = requiredText(values.fullName, 120);
    const email = requiredText(values.email, 254)?.toLowerCase();
    const password = typeof values.password === "string" ? values.password : "";
    const bootstrapToken = typeof values.bootstrapToken === "string" ? values.bootstrapToken : "";

    if (!fullName || !email || !emailPattern.test(email) || password.length < 12 || password.length > 128 || !bootstrapToken) {
      return errorResponse("Use a valid email, a password of at least 12 characters, and the setup token.");
    }

    const database = await getDatabase();
    if (await adminCount(database)) return errorResponse("The first administrator has already been configured.", 409);

    const expectedToken = await getBootstrapToken();
    if (!expectedToken || !timingSafeEqual(stringToBytes(bootstrapToken), stringToBytes(expectedToken))) {
      return errorResponse("Invalid setup token.", 401);
    }
    if (await findAdminByEmail(database, email)) return errorResponse("An administrator with this email already exists.", 409);

    const admin = { id: crypto.randomUUID(), email, fullName, role: "owner" as const };
    const passwordRecord = await createPasswordRecord(password);
    await database.prepare(
      `INSERT INTO admin_users (id, email, full_name, role, password_hash, password_salt)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).bind(admin.id, admin.email, admin.fullName, admin.role, passwordRecord.passwordHash, passwordRecord.passwordSalt).run();

    const response = NextResponse.json({ admin }, { status: 201 });
    response.headers.append("Set-Cookie", adminSessionCookie(await createAdminSession(database, admin.id), request));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
