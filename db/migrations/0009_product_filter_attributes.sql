-- Verified product details for shop filters. Unknown details stay empty;
-- no specifications or prices are inferred from collection photographs.
CREATE TABLE IF NOT EXISTS product_attributes (
  sku TEXT PRIMARY KEY NOT NULL REFERENCES product_catalog(sku) ON DELETE CASCADE,
  sizes TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(sizes) AND json_type(sizes) = 'array'),
  colors TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(colors) AND json_type(colors) = 'array'),
  materials TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(materials) AND json_type(materials) = 'array'),
  weave TEXT
);
