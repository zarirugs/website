import { getAuthenticatedAdmin, type AuthenticatedAdmin } from "@/lib/server/auth";
import { getDatabase } from "@/lib/server/database";
import type { D1Database } from "@/lib/server/d1";

export type AdminRequestContext = { database: D1Database; admin: AuthenticatedAdmin };

export async function authenticatedAdminContext(request: Request): Promise<AdminRequestContext | null> {
  const database = await getDatabase();
  const admin = await getAuthenticatedAdmin(request, database);
  return admin ? { database, admin } : null;
}
