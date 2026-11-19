CREATE TABLE newsletter_subscribers (
  email TEXT PRIMARY KEY NOT NULL COLLATE NOCASE,
  consent_version TEXT NOT NULL,
  subscribed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE storefront_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_name TEXT NOT NULL CHECK (event_name IN ('product_view', 'add_to_bag', 'enquiry_started', 'enquiry_submitted', 'order_confirmed')),
  sku TEXT REFERENCES inventory_items(sku) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_storefront_events_created ON storefront_events(created_at, event_name);
-- Short-lived hashed network keys protect public writes; raw IPs are not stored.
CREATE TABLE public_request_limits (
  request_key TEXT PRIMARY KEY NOT NULL,
  hits INTEGER NOT NULL DEFAULT 1,
  expires_at INTEGER NOT NULL
);
CREATE INDEX idx_public_request_limits_expiry ON public_request_limits(expires_at);
