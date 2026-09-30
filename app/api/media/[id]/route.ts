import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

import { getDatabase } from "@/lib/server/database";
import { getMediaBucket, type MediaAssetRow, type R2Range } from "@/lib/server/media";

function resolveRange(range: R2Range, totalSize: number) {
  if ("suffix" in range) {
    const length = Math.min(range.suffix, totalSize);
    return { offset: totalSize - length, length };
  }

  const offset = range.offset ?? 0;
  return { offset, length: range.length ?? totalSize - offset };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const requestedRange = request.headers.get("range");
    const cache = requestedRange ? null : await caches.open("zari-media-v2");
    const cached = cache ? await cache.match(request.url) : null;
    if (cached) return cached;

    const { ctx, env } = await getCloudflareContext({ async: true });

    const { id } = await params;
    const database = await getDatabase();
    const asset = await database.prepare(
      "SELECT id, name, alt_text, source_type, image_url, object_key, background_color, media_kind FROM media_assets WHERE id = ?",
    ).bind(id).first<MediaAssetRow>();
    if (!asset || asset.source_type !== "upload" || !asset.object_key) {
      return NextResponse.json({ error: "Media not found." }, { status: 404 });
    }

    const object = await (await getMediaBucket()).get(
      asset.object_key,
      requestedRange ? { range: request.headers } : undefined,
    );
    if (!object) return NextResponse.json({ error: "Media not found." }, { status: 404 });

    const requestedWidth = Number(new URL(request.url).searchParams.get("w"));
    const imageWidths = [640, 750, 828, 1080, 1200, 1920];
    const imageWidth = imageWidths.includes(requestedWidth) ? requestedWidth : null;
    if (!requestedRange && cache && asset.media_kind === "image" && imageWidth && env.IMAGES) {
      const transformed = await env.IMAGES.input(object.body)
        .transform({ width: imageWidth, fit: "scale-down" })
        .output({ format: "image/webp", quality: 80 });
      const response = transformed.response({
        headers: {
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
        },
      });
      ctx.waitUntil(cache.put(request.url, response.clone()).catch(() => undefined));
      return response;
    }

    const headers = new Headers({
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: object.httpEtag,
      "Accept-Ranges": "bytes",
      "X-Content-Type-Options": "nosniff",
    });
    object.writeHttpMetadata(headers);
    let status = 200;
    if (requestedRange && object.range) {
      const range = resolveRange(object.range, object.size);
      headers.set("Content-Length", range.length.toString());
      headers.set("Content-Range", `bytes ${range.offset}-${range.offset + range.length - 1}/${object.size}`);
      status = 206;
    } else {
      headers.set("Content-Length", object.size.toString());
    }

    const response = new Response(object.body, { status, headers });
    if (cache) {
      ctx.waitUntil(cache.put(request.url, response.clone()).catch(() => undefined));
    }
    return response;
  } catch (error) {
    console.error("Media delivery failed.", error);
    return NextResponse.json({ error: "Media is unavailable." }, { status: 503 });
  }
}
