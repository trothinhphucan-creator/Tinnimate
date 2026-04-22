-- ============================================================
-- Admin CRM Redesign: Promotions, Audit Log, Schema Fixes
-- ============================================================

-- Fix: add 'ultra' to subscription_tier CHECK constraint
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'premium', 'pro', 'ultra'));

-- Fix: add soft-delete support to conversations (for admin moderation)
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- ============================================================
-- PROMOTIONS / COUPONS
-- ============================================================
CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  kind text NOT NULL CHECK (kind IN ('percent', 'fixed', 'trial_extend', 'tier_grant')),
  value numeric,                        -- % discount, VND amount, or days
  tier_grant text CHECK (tier_grant IN ('premium', 'pro', 'ultra')),
  applies_to_tiers text[],              -- null = all plans
  max_uses int,                         -- null = unlimited
  used_count int NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_by uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS promotion_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id uuid NOT NULL REFERENCES promotions ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  order_id uuid REFERENCES payment_orders,
  redeemed_at timestamptz DEFAULT now(),
  UNIQUE (promotion_id, user_id)
);

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_only_promotions" ON promotions FOR ALL USING (is_admin());

ALTER TABLE promotion_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_only_redemptions" ON promotion_redemptions FOR ALL USING (is_admin());

-- ============================================================
-- ADMIN AUDIT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id bigserial PRIMARY KEY,
  admin_id uuid REFERENCES auth.users,
  action text NOT NULL,
  target_type text,
  target_id text,
  diff jsonb,
  ip text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_admin ON admin_audit_log(admin_id, created_at DESC);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_only_audit" ON admin_audit_log FOR ALL USING (is_admin());
