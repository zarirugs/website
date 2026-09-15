import { getCloudflareContext } from "@opennextjs/cloudflare";

export type MediaAssetSource = "upload" | "url" | "color";

export type MediaAssetRow = {
  id: string;
  name: string;
  alt_text: string | null;
  source_type: MediaAssetSource;
  image_url: string | null;
  object_key: string | null;
  background_color: string | null;
};

export type R2ObjectBody = {
  body: ReadableStream;
  httpEtag: string;
  writeHttpMetadata(headers: Headers): void;
};

export interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
}

type RuntimeEnvironment = { ZARI_MEDIA?: R2Bucket };

export function publicMediaUrl(asset: Pick<MediaAssetRow, "id" | "source_type" | "image_url">) {
  if (asset.source_type === "upload") return `/api/media/${encodeURIComponent(asset.id)}`;
  return asset.source_type === "url" ? asset.image_url : null;
}

export async function getMediaBucket(): Promise<R2Bucket> {
  const { env } = await getCloudflareContext({ async: true });
  const bucket = (env as RuntimeEnvironment).ZARI_MEDIA;
  if (!bucket) throw new Error("ZARI_MEDIA is not configured.");
  return bucket;
}
