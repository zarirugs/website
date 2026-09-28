import { getDatabase } from "@/lib/server/database";
import { publicMediaUrl, type MediaAssetRow } from "@/lib/server/media";

type SlotRow = MediaAssetRow & { slot_key: string; label: string; description: string };

export type SiteMedia = {
  id: string;
  name: string;
  alt: string;
  imageUrl: string | null;
  backgroundColor: string | null;
  mediaKind: "image" | "video";
  sourceType: MediaAssetRow["source_type"];
};

export async function getSiteMedia() {
  const database = await getDatabase();
  const result = await database.prepare(
    `SELECT site_media_slots.slot_key, site_media_slots.label, site_media_slots.description,
      media_assets.id, media_assets.name, media_assets.alt_text, media_assets.source_type,
      media_assets.image_url, media_assets.object_key, media_assets.background_color,
      media_assets.media_kind
     FROM site_media_slots LEFT JOIN media_assets ON media_assets.id = site_media_slots.media_asset_id
     ORDER BY site_media_slots.slot_key ASC`,
  ).all<SlotRow>();

  return Object.fromEntries(result.results.filter((slot) => slot.id).map((slot) => [slot.slot_key, {
    id: slot.id,
    name: slot.name,
    alt: slot.alt_text ?? slot.label,
    imageUrl: publicMediaUrl(slot),
    backgroundColor: slot.background_color,
    mediaKind: slot.media_kind,
    sourceType: slot.source_type,
  }])) as Record<string, SiteMedia>;
}
