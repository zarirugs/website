import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database } from "@/lib/server/d1";

type RuntimeEnvironment = {
  ZARI_DB?: D1Database;
  ADMIN_TOKEN?: string;
};

/** Returns the Cloudflare D1 binding, with a clear setup error when missing. */
export async function getDatabase(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true });
  const database = (env as RuntimeEnvironment).ZARI_DB;

  if (!database) {
    throw new Error(
      "ZARI_DB is not configured. Create the D1 database, apply db/migrations/0001_initial_schema.sql, and add the binding in wrangler.jsonc.",
    );
  }

  return database;
}

/**
 * Admin routes accept a bearer token. The token belongs in a Cloudflare secret,
 * not in NEXT_PUBLIC_* or client-side code.
 */
export async function isAdminRequest(request: Request): Promise<boolean> {
  const authorization = request.headers.get("authorization");
  const suppliedToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : undefined;

  if (!suppliedToken) return false;

  const { env } = await getCloudflareContext({ async: true });
  const expectedToken = (env as RuntimeEnvironment).ADMIN_TOKEN ?? process.env.ADMIN_TOKEN;

  return Boolean(expectedToken && suppliedToken === expectedToken);
}
