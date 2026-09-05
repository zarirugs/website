-- Customer accounts and persistent shopping carts.
-- Password hashes are created with Web Crypto PBKDF2 in lib/server/auth.ts.

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  sku TEXT NOT NULL REFERENCES inventory_items(sku),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (customer_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_customer_sessions_token ON customer_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_customer_sessions_expiry ON customer_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_cart_items_customer ON cart_items(customer_id);
