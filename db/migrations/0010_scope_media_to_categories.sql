-- Category images are private to the category that owns them. Global website
-- media remains unscoped, while an image uploaded for Heritage, for example,
-- is unavailable to Contemporary or Bespoke.

ALTER TABLE media_assets ADD COLUMN category_id TEXT REFERENCES categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_media_assets_category ON media_assets(category_id, updated_at DESC);

-- Retain the existing category covers and mark each as belonging to the
-- category it already serves. Product visuals stay independent.
UPDATE media_assets
SET category_id = (
  SELECT categories.id
  FROM categories
  WHERE categories.media_asset_id = media_assets.id
  LIMIT 1
)
WHERE category_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM categories
    WHERE categories.media_asset_id = media_assets.id
  );
