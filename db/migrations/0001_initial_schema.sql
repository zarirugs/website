-- Apply locally:  npx wrangler d1 execute zari-orders --local --file=db/migrations/0001_initial_schema.sql
-- Apply remote:   npx wrangler d1 execute zari-orders --remote --file=db/migrations/0001_initial_schema.sql

CREATE TABLE IF NOT EXISTS inventory_items (
  sku TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  collection TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  reorder_level INTEGER NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  delivery_address TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'in_production', 'ready', 'fulfilled', 'cancelled')),
  source TEXT NOT NULL DEFAULT 'website',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sku TEXT NOT NULL REFERENCES inventory_items(sku),
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0)
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT NOT NULL REFERENCES inventory_items(sku),
  quantity_delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_sku ON stock_movements(sku, created_at DESC);

-- Initial storefront catalogue. Add, edit, deactivate, and count stock from /admin.
INSERT OR IGNORE INTO inventory_items (sku, name, collection, stock, reorder_level) VALUES
  ('ZAR-HER-001', 'Heritage — hand-knotted rug', 'Heritage', 8, 2),
  ('ZAR-CON-001', 'Contemporary — hand-knotted rug', 'Contemporary', 12, 3),
  ('ZAR-BES-001', 'Bespoke — consultation order', 'Bespoke', 4, 1);
