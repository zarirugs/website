import { getCloudflareContext } from "@opennextjs/cloudflare";

export type MediaSourceType = "upload" | "url" | "color";

export type R2ObjectBody = {
  body: ReadableStream;
  httpEtag: string;
  writeHttpMetadata(headers: Headers): void;
};

export interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
  put(key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType?: string; cacheControl?: string } }): Promise<unknown>;
}

type RuntimeEnvironment = { ZARI_MEDIA?: R2Bucket };

export async function getMediaBucket() {
  const { env } = await getCloudflareContext({ async: true });
  const bucket = (env as RuntimeEnvironment).ZARI_MEDIA;
  if (!bucket) throw new Error("ZARI_MEDIA is not configured for the admin Worker.");
  return bucket;
}

export function publicMediaPath(id: string, sourceType: MediaSourceType, imageUrl: string | null) {
  if (sourceType === "upload") return `/api/media/${encodeURIComponent(id)}`;
  return sourceType === "url" ? imageUrl : null;
}

export function validColor(value: unknown) {
  if (typeof value !== "string") return null;
  const color = value.trim();
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(color) ? color : null;
}
