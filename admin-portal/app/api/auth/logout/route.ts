import { NextResponse } from "next/server";

import { deleteCurrentAdminSession, expiredAdminSessionCookie } from "@/lib/server/auth";
import { getDatabase } from "@/lib/server/database";
import { databaseErrorResponse } from "@/lib/server/http";

export async function POST(request: Request) {
  try {
    await deleteCurrentAdminSession(request, await getDatabase());
    const response = NextResponse.json({ loggedOut: true });
    response.headers.append("Set-Cookie", expiredAdminSessionCookie(request));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
