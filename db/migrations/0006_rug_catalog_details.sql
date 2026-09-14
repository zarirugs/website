-- Product details used by the private catalog desk. Tags are stored as a JSON
-- array so they remain flexible while the common rug specifications are
-- directly searchable and simple to maintain.

ALTER TABLE product_catalog ADD COLUMN tags TEXT NOT NULL DEFAULT '[]';
ALTER TABLE product_catalog ADD COLUMN dimensions TEXT;
ALTER TABLE product_catalog ADD COLUMN material TEXT;
ALTER TABLE product_catalog ADD COLUMN weave TEXT;
ALTER TABLE product_catalog ADD COLUMN colour TEXT;
ALTER TABLE product_catalog ADD COLUMN pile_height TEXT;
ALTER TABLE product_catalog ADD COLUMN origin TEXT;

CREATE INDEX IF NOT EXISTS idx_product_catalog_material ON product_catalog(material);
CREATE INDEX IF NOT EXISTS idx_product_catalog_dimensions ON product_catalog(dimensions);
