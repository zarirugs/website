-- A shared media library for the storefront and the private admin portal.
-- Files live in the bound R2 bucket; D1 stores their metadata and placement.

CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  alt_text TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('upload', 'url', 'color')),
  image_url TEXT,
  object_key TEXT UNIQUE,
  background_color TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    (source_type = 'upload' AND object_key IS NOT NULL) OR
    (source_type = 'url' AND image_url IS NOT NULL) OR
    (source_type = 'color' AND background_color IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS site_media_slots (
  slot_key TEXT PRIMARY KEY NOT NULL,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  media_asset_id TEXT REFERENCES media_assets(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE categories ADD COLUMN media_asset_id TEXT REFERENCES media_assets(id);
ALTER TABLE product_catalog ADD COLUMN media_asset_id TEXT REFERENCES media_assets(id);

CREATE INDEX IF NOT EXISTS idx_media_assets_updated ON media_assets(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_media_asset ON categories(media_asset_id);
CREATE INDEX IF NOT EXISTS idx_product_catalog_media_asset ON product_catalog(media_asset_id);

INSERT OR IGNORE INTO media_assets (id, name, alt_text, source_type, image_url) VALUES
  ('media-default-hero', 'Homepage hero', 'A woman seated on a hand-knotted rug', 'url', '/images/hero.webp'),
  ('media-default-atelier', 'Atelier craftsmanship image', 'Artisans weaving by hand at a loom', 'url', '/images/atelier-weaving.jpg'),
  ('media-default-heritage', 'Heritage collection image', 'Heritage hand-knotted rug', 'url', '/images/collection-1.jpg'),
  ('media-default-contemporary', 'Contemporary collection image', 'Contemporary rug in a serene interior', 'url', '/images/collection-2.png'),
  ('media-default-bespoke', 'Bespoke collection image', 'Artisan weaving a bespoke rug', 'url', '/images/collection-3.jpg');

INSERT OR IGNORE INTO site_media_slots (slot_key, label, description, media_asset_id) VALUES
  ('hero', 'Homepage hero', 'The full-screen image behind the homepage introduction.', 'media-default-hero'),
  ('atelier', 'Atelier craftsmanship image', 'The full-screen image shown after Signature Collections.', 'media-default-atelier');

UPDATE categories
SET media_asset_id = CASE slug
  WHEN 'heritage' THEN 'media-default-heritage'
  WHEN 'contemporary' THEN 'media-default-contemporary'
  WHEN 'bespoke' THEN 'media-default-bespoke'
  ELSE media_asset_id
END
WHERE media_asset_id IS NULL;

UPDATE product_catalog
SET media_asset_id = CASE category_id
  WHEN 'category-heritage' THEN 'media-default-heritage'
  WHEN 'category-contemporary' THEN 'media-default-contemporary'
  WHEN 'category-bespoke' THEN 'media-default-bespoke'
  ELSE media_asset_id
END
WHERE media_asset_id IS NULL;
