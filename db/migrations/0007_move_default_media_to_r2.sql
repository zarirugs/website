-- Move the launch images from deployed static assets into the shared R2 library.
-- The deploy workflow uploads these keys before this migration is applied.
UPDATE media_assets
SET source_type = 'upload',
    image_url = NULL,
    object_key = CASE id
      WHEN 'media-default-hero' THEN 'site/defaults/hero.webp'
      WHEN 'media-default-atelier' THEN 'site/defaults/atelier-weaving.jpg'
      WHEN 'media-default-heritage' THEN 'site/defaults/collection-1.jpg'
      WHEN 'media-default-contemporary' THEN 'site/defaults/collection-2.png'
      WHEN 'media-default-bespoke' THEN 'site/defaults/collection-3.jpg'
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE (id = 'media-default-hero' AND source_type = 'url' AND image_url = '/images/hero.webp')
   OR (id = 'media-default-atelier' AND source_type = 'url' AND image_url = '/images/atelier-weaving.jpg')
   OR (id = 'media-default-heritage' AND source_type = 'url' AND image_url = '/images/collection-1.jpg')
   OR (id = 'media-default-contemporary' AND source_type = 'url' AND image_url = '/images/collection-2.png')
   OR (id = 'media-default-bespoke' AND source_type = 'url' AND image_url = '/images/collection-3.jpg');
