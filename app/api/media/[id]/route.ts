import { NextResponse } from "next/server";

import { getDatabase } from "@/lib/server/database";
import { getMediaBucket, type MediaAssetRow } from "@/lib/server/media";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const database = await getDatabase();
    const asset = await database.prepare(
      "SELECT id, name, alt_text, source_type, image_url, object_key, background_color FROM media_assets WHERE id = ?",
    ).bind(id).first<MediaAssetRow>();
    if (!asset || asset.source_type !== "upload" || !asset.object_key) {
      return NextResponse.json({ error: "Media not found." }, { status: 404 });
    }

    const object = await (await getMediaBucket()).get(asset.object_key);
    if (!object) return NextResponse.json({ error: "Media not found." }, { status: 404 });

    const headers = new Headers({
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: object.httpEtag,
    });
    object.writeHttpMetadata(headers);
    return new Response(object.body, { headers });
  } catch {
    return NextResponse.json({ error: "Media is unavailable." }, { status: 503 });
  }
}
