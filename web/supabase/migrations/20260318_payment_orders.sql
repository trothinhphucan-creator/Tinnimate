-- payment_orders table for VNPay/MoMo order tracking
CREATE TABLE IF NOT EXISTS payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  tier text NOT NULL DEFAULT 'premium',
  yearly boolean NOT NULL DEFAULT false,
  amount bigint NOT NULL,
  provider text NOT NULL DEFAULT 'vnpay',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_order ON payment_orders(order_id);

-- Add payment_provider and period columns to subscriptions if missing
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_provider text DEFAULT 'stripe';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_ref text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS period text DEFAULT 'monthly';
