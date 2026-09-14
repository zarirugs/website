import { NextResponse } from "next/server";

import { getAuthenticatedAdmin } from "@/lib/server/auth";
import { getDatabase } from "@/lib/server/database";
import { databaseErrorResponse, errorResponse } from "@/lib/server/http";

export async function GET(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin(request, await getDatabase());
    if (!admin) return errorResponse("Unauthorised.", 401);
    return NextResponse.json({ admin }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
