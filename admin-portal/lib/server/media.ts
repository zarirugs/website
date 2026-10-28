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
  delete(key: string): Promise<void>;
}

interface ImageTransformResult {
  response(): Promise<Response>;
}

interface ImageTransformHandle {
  transform(options: { width: number; height: number; fit: "scale-down" }): ImageTransformHandle;
  output(options: { format: "image/webp"; quality: number; anim: true }): ImageTransformResult;
}

interface ImagesBinding {
  input(image: ReadableStream): ImageTransformHandle;
}

type RuntimeEnvironment = { ZARI_MEDIA?: R2Bucket; IMAGES?: ImagesBinding };

export async function getMediaBucket() {
  const { env } = await getCloudflareContext({ async: true });
  const bucket = (env as RuntimeEnvironment).ZARI_MEDIA;
  if (!bucket) throw new Error("ZARI_MEDIA is not configured for the admin Worker.");
  return bucket;
}

export async function compressUploadedImage(file: File) {
  const { env } = await getCloudflareContext({ async: true });
  const images = (env as RuntimeEnvironment).IMAGES;
  if (!images) throw new Error("IMAGES is not configured for the admin Worker.");

  const response = await (await images.input(file.stream())
    .transform({ width: 2400, height: 2400, fit: "scale-down" })
    .output({ format: "image/webp", quality: 82, anim: true })).response();
  if (!response.ok || !response.body) throw new Error("The uploaded image could not be compressed.");

  return response.arrayBuffer();
}

export function publicMediaPath(id: string, sourceType: MediaSourceType, imageUrl: string | null) {
  if (sourceType === "upload") return `/api/media/${encodeURIComponent(id)}`;
  if (sourceType !== "url" || !imageUrl) return null;
  // The curated launch images already live in the public storefront's asset bundle.
  // Resolve their relative URLs to that site so they can also be previewed by the
  // separate admin Worker, whose own asset bundle does not contain these files.
  return imageUrl.startsWith("/") ? `https://zarirugs.com${imageUrl}` : imageUrl;
}

export function validColor(value: unknown) {
  if (typeof value !== "string") return null;
  const color = value.trim();
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(color) ? color : null;
}
