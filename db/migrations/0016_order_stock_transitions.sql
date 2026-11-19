-- Each successful status transition owns its stock effects within one D1 batch.
ALTER TABLE orders ADD COLUMN stock_transition_token TEXT;
