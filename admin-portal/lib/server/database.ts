import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database } from "@/lib/server/d1";

type RuntimeEnvironment = {
  ZARI_DB?: D1Database;
  ADMIN_BOOTSTRAP_TOKEN?: string;
};

export async function getDatabase(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true });
  const database = (env as RuntimeEnvironment).ZARI_DB;
  if (!database) {
    throw new Error("ZARI_DB is not configured for the admin Worker.");
  }
  return database;
}

export async function getBootstrapToken() {
  const { env } = await getCloudflareContext({ async: true });
  return (env as RuntimeEnvironment).ADMIN_BOOTSTRAP_TOKEN ?? process.env.ADMIN_BOOTSTRAP_TOKEN;
}
