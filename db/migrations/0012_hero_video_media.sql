-- Allow the shared media library to distinguish videos from still images.
ALTER TABLE media_assets
ADD COLUMN media_kind TEXT NOT NULL DEFAULT 'image'
CHECK (media_kind IN ('image', 'video'));

-- Keep the original hero image in the library while selecting the launch video.
INSERT OR IGNORE INTO media_assets (
  id, name, alt_text, source_type, image_url, media_kind
) VALUES (
  'media-default-hero-video',
  'Homepage hero video',
  'A cinematic view of hand-knotted rugs',
  'url',
  '/videos/hero-rug-making.mp4',
  'video'
);

UPDATE site_media_slots
SET media_asset_id = 'media-default-hero-video',
    description = 'The full-screen image, video, or colour behind the homepage introduction.',
    updated_at = CURRENT_TIMESTAMP
WHERE slot_key = 'hero';
