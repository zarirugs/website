-- An email address alone does not prove ownership of an earlier order.
-- Migration 0004 linked historical guest orders by email, and those links
-- cannot be distinguished reliably from historical signed-in requests.
-- Preserve every order for the concierge, but require explicit session-based
-- provenance before showing it in the customer account dashboard.
ALTER TABLE orders ADD COLUMN customer_link_source TEXT NOT NULL DEFAULT 'legacy'
  CHECK (customer_link_source IN ('legacy', 'guest', 'authenticated'));
