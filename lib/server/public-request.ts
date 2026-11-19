import type { D1Database } from "./d1";
import { sha256 } from "./crypto";
export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}
export async function allowPublicRequest(database: D1Database, request: Request, scope: string, maximum: number) {
  const now = Math.floor(Date.now() / 1000);
  const window = Math.floor(now / 60);
  const key = await sha256(`${scope}:${window}:${request.headers.get("cf-connecting-ip") ?? "local-or-unknown"}`);
  const results = await database.batch([
    database.prepare("DELETE FROM public_request_limits WHERE expires_at < ?").bind(now),
    database.prepare(`INSERT INTO public_request_limits (request_key, hits, expires_at) VALUES (?, 1, ?)
      ON CONFLICT(request_key) DO UPDATE SET hits = hits + 1 RETURNING hits`).bind(key, (window + 1) * 60),
  ]);
  return Number((results[1].results[0] as { hits: number }).hits) <= maximum;
}
