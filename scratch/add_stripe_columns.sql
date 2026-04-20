
-- ADD Stripe columns to users and orders
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
