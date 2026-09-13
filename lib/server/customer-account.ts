import { getAuthenticatedCustomer } from "@/lib/server/auth";
import { getDatabase } from "@/lib/server/database";

/** Resolves the signed-in customer once per account API request. */
export async function getCurrentCustomer(request: Request) {
  const database = await getDatabase();
  const customer = await getAuthenticatedCustomer(request, database);
  return { database, customer };
}
