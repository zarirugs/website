import { NextResponse } from "next/server";

import { deleteCurrentSession, expiredSessionCookie } from "@/lib/server/auth";
import { getDatabase } from "@/lib/server/database";
import { databaseErrorResponse } from "@/lib/server/http";

export async function POST(request: Request) {
  try {
    await deleteCurrentSession(request, await getDatabase());
    const response = new NextResponse(null, { status: 204 });
    response.headers.append("Set-Cookie", expiredSessionCookie(request));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
