import type { D1Database } from "@/lib/server/d1";

declare global {
  interface CloudflareEnv {
    /** The operational database configured in wrangler.jsonc. */
    ZARI_DB?: D1Database;
    /** Set with `wrangler secret put ADMIN_TOKEN`; never expose this to the client. */
    ADMIN_TOKEN?: string;
  }
}

export {};
