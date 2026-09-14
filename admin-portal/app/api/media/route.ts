import { NextResponse } from "next/server";

import { authenticatedAdminContext } from "@/lib/server/guard";
import { databaseErrorResponse, errorResponse, optionalText, requiredText, validImageUrl } from "@/lib/server/http";
import { getMediaBucket, publicMediaPath, validColor, type MediaSourceType } from "@/lib/server/media";

type MediaRow = {
  id: string;
  name: string;
  alt_text: string | null;
  source_type: MediaSourceType;
  image_url: string | null;
  background_color: string | null;
  created_at: string;
  updated_at: string;
};
type SlotRow = { slot_key: string; label: string; description: string; media_asset_id: string | null };

function mediaResponse(asset: MediaRow) {
  return {
    id: asset.id, name: asset.name, altText: asset.alt_text, sourceType: asset.source_type,
    imageUrl: asset.image_url, backgroundColor: asset.background_color,
    previewUrl: publicMediaPath(asset.id, asset.source_type, asset.image_url),
    createdAt: asset.created_at, updatedAt: asset.updated_at,
  };
}

export async function GET(request: Request) {
  try {
    const context = await authenticatedAdminContext(request);
    if (!context) return errorResponse("Unauthorised.", 401);
    const [assets, slots] = await context.database.batch([
      context.database.prepare("SELECT id, name, alt_text, source_type, image_url, background_color, created_at, updated_at FROM media_assets ORDER BY updated_at DESC, name ASC"),
      context.database.prepare("SELECT slot_key, label, description, media_asset_id FROM site_media_slots ORDER BY slot_key ASC"),
    ]);
    return NextResponse.json({ media: assets.results.map((asset) => mediaResponse(asset as MediaRow)), slots: slots.results as SlotRow[] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await authenticatedAdminContext(request);
    if (!context) return errorResponse("Unauthorised.", 401);
    const form = await request.formData();
    const name = requiredText(form.get("name"), 120);
    const altText = optionalText(form.get("altText"), 250);
    const sourceType = form.get("sourceType");
    if (!name || (sourceType !== "upload" && sourceType !== "url" && sourceType !== "color")) {
      return errorResponse("Enter a name and choose an image source.");
    }

    const id = crypto.randomUUID();
    let imageUrl: string | null = null;
    let backgroundColor: string | null = null;
    let objectKey: string | null = null;

    if (sourceType === "upload") {
      const file = form.get("file");
      const accepted = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
      if (!(file instanceof File) || !accepted.has(file.type) || file.size < 1 || file.size > 10 * 1024 * 1024) {
        return errorResponse("Upload a JPG, PNG, WebP, AVIF, or GIF no larger than 10 MB.");
      }
      const extension = file.type.split("/")[1] ?? "image";
      objectKey = `media/${id}.${extension}`;
      await (await getMediaBucket()).put(objectKey, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" },
      });
    } else if (sourceType === "url") {
      imageUrl = validImageUrl(form.get("imageUrl"));
      if (!imageUrl) return errorResponse("Enter a valid image URL beginning with http:// or https://.");
    } else {
      backgroundColor = validColor(form.get("backgroundColor"));
      if (!backgroundColor) return errorResponse("Enter a valid hex colour, for example #A67C52.");
    }

    await context.database.prepare(
      `INSERT INTO media_assets (id, name, alt_text, source_type, image_url, object_key, background_color)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).bind(id, name, altText, sourceType, imageUrl, objectKey, backgroundColor).run();
    return NextResponse.json({ created: true, id }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
