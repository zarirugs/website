import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

import { getDatabase } from "@/lib/server/database";
import { getMediaBucket, type MediaAssetRow } from "@/lib/server/media";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cache = await caches.open("zari-media-v1");
    const cached = await cache.match(request.url);
    if (cached) return cached;

    const { id } = await params;
    const database = await getDatabase();
    const asset = await database.prepare(
      "SELECT id, name, alt_text, source_type, image_url, object_key, background_color, media_kind FROM media_assets WHERE id = ?",
    ).bind(id).first<MediaAssetRow>();
    if (!asset || asset.source_type !== "upload" || !asset.object_key) {
      return NextResponse.json({ error: "Media not found." }, { status: 404 });
    }

    const object = await (await getMediaBucket()).get(asset.object_key);
    if (!object) return NextResponse.json({ error: "Media not found." }, { status: 404 });

    const headers = new Headers({
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": object.size.toString(),
      ETag: object.httpEtag,
      "Accept-Ranges": "bytes",
      "X-Content-Type-Options": "nosniff",
    });
    object.writeHttpMetadata(headers);
    const response = new Response(object.body, { headers });
    const { ctx } = await getCloudflareContext({ async: true });
    ctx.waitUntil(cache.put(request.url, response.clone()).catch(() => undefined));
    return response;
  } catch (error) {
    console.error("Media delivery failed.", error);
    return NextResponse.json({ error: "Media is unavailable." }, { status: 503 });
  }
}
