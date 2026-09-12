import { NextResponse } from "next/server";

import { authenticatedAdminContext } from "@/lib/server/guard";
import { databaseErrorResponse, errorResponse, optionalText } from "@/lib/server/http";

export async function PATCH(request: Request, { params }: { params: Promise<{ key: string }> }) {
  try {
    const context = await authenticatedAdminContext(request);
    if (!context) return errorResponse("Unauthorised.", 401);
    const { key } = await params;
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return errorResponse("Choose a media item.");
    const mediaAssetId = optionalText((body as Record<string, unknown>).mediaAssetId, 100);
    if (!mediaAssetId) return errorResponse("Choose a media item.");
    const asset = await context.database.prepare("SELECT id FROM media_assets WHERE id = ?").bind(mediaAssetId).first<{ id: string }>();
    if (!asset) return errorResponse("Media item not found.", 404);
    await context.database.prepare("UPDATE site_media_slots SET media_asset_id = ?, updated_at = CURRENT_TIMESTAMP WHERE slot_key = ?").bind(mediaAssetId, key).run();
    return NextResponse.json({ updated: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
