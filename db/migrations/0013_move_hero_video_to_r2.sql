-- Serve the default hero video from the shared R2 media bucket instead of Git.
UPDATE media_assets
SET source_type = 'upload',
    image_url = NULL,
    object_key = 'site/defaults/hero-rug-making.mp4',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'media-default-hero-video';
