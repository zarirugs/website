-- Shared by the storefront and the separate zari-admin Worker.
-- Apply to production before deploying the portal:
-- npx wrangler d1 migrations apply zari-orders --remote --config admin-portal/wrangler.jsonc

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('owner', 'manager')),
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  admin_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expiry ON admin_sessions(expires_at);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_catalog (
  sku TEXT PRIMARY KEY NOT NULL REFERENCES inventory_items(sku) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id),
  description TEXT,
  image_url TEXT,
  price_paise INTEGER CHECK (price_paise IS NULL OR price_paise >= 0),
  is_visible INTEGER NOT NULL DEFAULT 1 CHECK (is_visible IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_active_sort ON categories(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_catalog_category ON product_catalog(category_id, is_visible, sort_order);

-- Retain the original orders.status column for backwards compatibility with
-- the storefront; the admin portal owns this more detailed workflow stage.
ALTER TABLE orders ADD COLUMN workflow_status TEXT;
UPDATE orders
SET workflow_status = CASE status
  WHEN 'confirmed' THEN 'paid'
  WHEN 'in_production' THEN 'in_production'
  WHEN 'ready' THEN 'shipped'
  WHEN 'fulfilled' THEN 'delivered'
  WHEN 'cancelled' THEN 'cancelled'
  ELSE 'new'
END
WHERE workflow_status IS NULL;
CREATE INDEX IF NOT EXISTS idx_orders_workflow_status ON orders(workflow_status);

-- Bring the existing showroom data into the editable catalog.
INSERT OR IGNORE INTO categories (id, name, slug, description, image_url, sort_order) VALUES
  ('category-heritage', 'Heritage', 'heritage', 'Timeless Persian-inspired hand-knotted masterpieces.', '/images/collection-1.jpg', 10),
  ('category-contemporary', 'Contemporary', 'contemporary', 'Modern minimalism woven by master artisans.', '/images/collection-2.png', 20),
  ('category-bespoke', 'Bespoke', 'bespoke', 'Custom rugs created exclusively for luxury interiors.', '/images/collection-3.jpg', 30);

INSERT OR IGNORE INTO product_catalog (sku, category_id, description, image_url, is_visible, sort_order) VALUES
  ('ZAR-HER-001', 'category-heritage', 'A hand-knotted Heritage rug.', '/images/collection-1.jpg', 1, 10),
  ('ZAR-CON-001', 'category-contemporary', 'A hand-knotted Contemporary rug.', '/images/collection-2.png', 1, 20),
  ('ZAR-BES-001', 'category-bespoke', 'A bespoke consultation rug.', '/images/collection-3.jpg', 1, 30);
