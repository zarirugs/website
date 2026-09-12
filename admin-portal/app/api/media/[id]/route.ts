import { NextResponse } from "next/server";

import { authenticatedAdminContext } from "@/lib/server/guard";
import { databaseErrorResponse, errorResponse, optionalText, requiredText, validImageUrl } from "@/lib/server/http";
import { getMediaBucket, validColor, type MediaSourceType } from "@/lib/server/media";

type MediaRow = { id: string; source_type: MediaSourceType; object_key: string | null };

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await authenticatedAdminContext(request);
    if (!context) return errorResponse("Unauthorised.", 401);
    const { id } = await params;
    const asset = await context.database.prepare("SELECT id, source_type, object_key FROM media_assets WHERE id = ?").bind(id).first<MediaRow>();
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
    const name = body.name === undefined ? undefined : requiredText(body.name, 120);
    const altText = body.altText === undefined ? undefined : optionalText(body.altText, 250);
    const imageUrl = body.imageUrl === undefined ? undefined : validImageUrl(body.imageUrl);
    const backgroundColor = body.backgroundColor === undefined ? undefined : validColor(body.backgroundColor);
    if ((body.name !== undefined && !name) || (body.imageUrl !== undefined && !imageUrl) || (body.backgroundColor !== undefined && !backgroundColor)) return errorResponse("Invalid media update.");
    const result = await context.database.prepare(
      `UPDATE media_assets SET name = COALESCE(?, name), alt_text = COALESCE(?, alt_text),
        image_url = COALESCE(?, image_url), background_color = COALESCE(?, background_color), updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    ).bind(name ?? null, altText ?? null, imageUrl ?? null, backgroundColor ?? null, id).run();
    if (!result) return errorResponse("Media not found.", 404);
    return NextResponse.json({ updated: true, id }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
