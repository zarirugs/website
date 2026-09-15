-- Correct the homepage media placements after the default R2 media migration.
-- This migration runs once; future admin-selected assignments remain unchanged.
UPDATE site_media_slots
SET media_asset_id = CASE slot_key
      WHEN 'hero' THEN 'media-default-hero'
      WHEN 'atelier' THEN 'media-default-atelier'
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE slot_key IN ('hero', 'atelier');
