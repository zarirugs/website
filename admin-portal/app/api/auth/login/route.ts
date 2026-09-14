import { NextResponse } from "next/server";

import { adminSessionCookie, createAdminSession, findAdminByEmail, passwordMatches } from "@/lib/server/auth";
import { getDatabase } from "@/lib/server/database";
import { databaseErrorResponse, errorResponse, requiredText } from "@/lib/server/http";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return errorResponse("Enter your email and password.");
    const values = body as Record<string, unknown>;
    const email = requiredText(values.email, 254)?.toLowerCase();
    const password = typeof values.password === "string" ? values.password : "";
    if (!email || !password) return errorResponse("Enter your email and password.");

    const database = await getDatabase();
    const admin = await findAdminByEmail(database, email);
    if (!admin || !(await passwordMatches(password, admin.password_hash, admin.password_salt))) {
      return errorResponse("Incorrect email or password.", 401);
    }

    const response = NextResponse.json({ admin: { id: admin.id, email: admin.email, fullName: admin.full_name, role: admin.role } });
    response.headers.append("Set-Cookie", adminSessionCookie(await createAdminSession(database, admin.id), request));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
