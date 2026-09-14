-- Category covers belong to category cards on the public website. They must
-- never also become a product's visual simply because that product is in the
-- category. Preserve independently assigned product media and clear only the
-- legacy assignments that exactly match the category cover.

UPDATE product_catalog
SET media_asset_id = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE EXISTS (
  SELECT 1
  FROM categories
  WHERE categories.id = product_catalog.category_id
    AND product_catalog.media_asset_id = categories.media_asset_id
);

UPDATE product_catalog
SET image_url = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE EXISTS (
  SELECT 1
  FROM categories
  WHERE categories.id = product_catalog.category_id
    AND product_catalog.image_url = categories.image_url
);
