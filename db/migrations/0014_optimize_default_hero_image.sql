-- Replace the mislabeled 3.5 MB PNG with the optimized WebP stored in R2.
UPDATE media_assets
SET object_key = 'site/defaults/hero-optimized-v1.webp',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'media-default-hero'
  AND source_type = 'upload';
