import { NextResponse } from "next/server";

import { authenticatedAdminContext } from "@/lib/server/guard";
import { databaseErrorResponse, errorResponse, optionalText, requiredText, validImageUrl } from "@/lib/server/http";
import { getMediaBucket, validColor, type MediaSourceType } from "@/lib/server/media";

type MediaRow = {
  id: string;
  name: string;
  alt_text: string | null;
  source_type: MediaSourceType;
  object_key: string | null;
  image_url: string | null;
  background_color: string | null;
};

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await authenticatedAdminContext(request);
    if (!context) return errorResponse("Unauthorised.", 401);
    const { id } = await params;
    const asset = await context.database.prepare("SELECT id, name, alt_text, source_type, object_key, image_url, background_color FROM media_assets WHERE id = ?").bind(id).first<MediaRow>();
    if (!asset || asset.source_type !== "upload" || !asset.object_key) return errorResponse("Media not found.", 404);
    const object = await (await getMediaBucket()).get(asset.object_key);
    if (!object) return errorResponse("Media not found.", 404);
    const headers = new Headers({ "Cache-Control": "private, max-age=300", ETag: object.httpEtag });
    object.writeHttpMetadata(headers);
    return new Response(object.body, { headers });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await authenticatedAdminContext(request);
    if (!context) return errorResponse("Unauthorised.", 401);
    const { id } = await params;
    const values: unknown = await request.json();
    if (!values || typeof values !== "object") return errorResponse("Enter media details.");
    const body = values as Record<string, unknown>;
    const asset = await context.database.prepare(
      "SELECT id, name, alt_text, source_type, object_key, image_url, background_color FROM media_assets WHERE id = ?",
    ).bind(id).first<MediaRow>();
    if (!asset) return errorResponse("Media not found.", 404);

    const name = body.name === undefined ? undefined : requiredText(body.name, 120);
    const altText = body.altText === undefined ? undefined : optionalText(body.altText, 250);
    const imageUrl = body.imageUrl === undefined ? undefined : validImageUrl(body.imageUrl);
    const backgroundColor = body.backgroundColor === undefined ? undefined : validColor(body.backgroundColor);
    if ((body.name !== undefined && !name) ||
      (body.altText !== undefined && typeof body.altText !== "string") ||
      (body.imageUrl !== undefined && (!imageUrl || asset.source_type !== "url")) ||
      (body.backgroundColor !== undefined && (!backgroundColor || asset.source_type !== "color"))) return errorResponse("Invalid media update.");

    await context.database.prepare(
      `UPDATE media_assets SET name = ?, alt_text = ?, image_url = ?, background_color = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    ).bind(
      name ?? asset.name,
      altText === undefined ? asset.alt_text : altText,
      imageUrl ?? asset.image_url,
      backgroundColor ?? asset.background_color,
      id,
    ).run();
    return NextResponse.json({ updated: true, id }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await authenticatedAdminContext(request);
    if (!context) return errorResponse("Unauthorised.", 401);
    const { id } = await params;
    const asset = await context.database.prepare(
      "SELECT id, name, alt_text, source_type, object_key, image_url, background_color FROM media_assets WHERE id = ?",
    ).bind(id).first<MediaRow>();
    if (!asset) return errorResponse("Media not found.", 404);

    const usage = await context.database.prepare(
      `SELECT
        (SELECT COUNT(*) FROM site_media_slots WHERE media_asset_id = ?) +
        (SELECT COUNT(*) FROM categories WHERE media_asset_id = ?) +
        (SELECT COUNT(*) FROM product_catalog WHERE media_asset_id = ?) AS count`,
    ).bind(id, id, id).first<{ count: number }>();
    if ((usage?.count ?? 0) > 0) return errorResponse("Replace this image everywhere it is used before removing it.", 409);

    await context.database.prepare("DELETE FROM media_assets WHERE id = ?").bind(id).run();
    if (asset.source_type === "upload" && asset.object_key) {
      await (await getMediaBucket()).delete(asset.object_key).catch(() => undefined);
    }
    return NextResponse.json({ deleted: true, id }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
