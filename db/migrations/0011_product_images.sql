-- Ordered product photography. Category covers remain independent.
CREATE TABLE IF NOT EXISTS product_images (
  sku TEXT NOT NULL REFERENCES product_catalog(sku) ON DELETE CASCADE,
  media_asset_id TEXT NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 0 AND sort_order < 12),
  PRIMARY KEY (sku, media_asset_id),
  UNIQUE (sku, sort_order)
);
INSERT OR IGNORE INTO product_images (sku, media_asset_id, sort_order)
SELECT sku, media_asset_id, 0 FROM product_catalog
WHERE media_asset_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM media_assets WHERE id = product_catalog.media_asset_id AND source_type IN ('upload', 'url'));
CREATE INDEX IF NOT EXISTS idx_product_images_media ON product_images(media_asset_id);
