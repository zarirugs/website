-- Customer account dashboard: orders, delivery addresses, and saved pieces.
-- Apply through Wrangler migrations before deploying this storefront release.

ALTER TABLE orders ADD COLUMN customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL;

-- Existing requests made with a customer account's email appear in that account.
UPDATE orders
SET customer_id = (
  SELECT customers.id
  FROM customers
  WHERE customers.email = orders.customer_email COLLATE NOCASE
)
WHERE customer_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_customer_created ON orders(customer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS customer_addresses (
  id TEXT PRIMARY KEY NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  phone TEXT,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT,
  country TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer ON customer_addresses(customer_id, is_default DESC, updated_at DESC);

CREATE TABLE IF NOT EXISTS customer_wishlist (
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  sku TEXT NOT NULL REFERENCES inventory_items(sku) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (customer_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_customer_wishlist_customer ON customer_wishlist(customer_id, created_at DESC);
