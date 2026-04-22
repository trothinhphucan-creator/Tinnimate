-- ============================================================
-- Catchup migration: combines all pending migrations from
-- 20260318_payment_orders through 20260417 (archived originals)
-- plus new CRM tables: promotions, admin_audit_log
-- ============================================================

-- ── payment_orders (from 20260318_payment_orders) ───────────
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
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_provider text DEFAULT 'stripe';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_ref text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS period text DEFAULT 'monthly';

-- ── profiles: add columns (from 20260321_fix_is_admin / 20260322) ─
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_notes text;

UPDATE profiles SET is_admin = true
WHERE email IN (
  'chuduchaici@gmail.com',
  'duchaisea@gmail.com',
  'office.phucan@gmail.com',
  'trothinh.phucan@gmail.com'
);

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'premium', 'pro', 'ultra'));

-- ── journal_entries (from 20260321_journal_entries) ─────────
CREATE TABLE IF NOT EXISTS journal_entries (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mood           int CHECK (mood BETWEEN 1 AND 5) NOT NULL,
  tinnitus_level int CHECK (tinnitus_level BETWEEN 1 AND 10),
  text           text NOT NULL,
  created_at     timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS journal_entries_user_idx ON journal_entries(user_id, created_at DESC);
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='journal_entries' AND policyname='journal_own_all') THEN
    CREATE POLICY "journal_own_all" ON journal_entries FOR ALL TO authenticated
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── mobile_config (from 20260321_mobile_config) ─────────────
CREATE TABLE IF NOT EXISTS mobile_config (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key         text UNIQUE NOT NULL,
  value       jsonb NOT NULL,
  description text,
  updated_at  timestamptz DEFAULT now()
);
INSERT INTO mobile_config (key, value, description) VALUES
  ('features', '{"zentitone":true,"notch_therapy":true,"breathing":true,"cbti":false,"journal":false,"sleep":false}', 'Feature flags'),
  ('maintenance', '{"active":false,"message":"Tinnimate đang bảo trì, vui lòng thử lại sau."}', 'Maintenance mode')
ON CONFLICT (key) DO NOTHING;
ALTER TABLE mobile_config ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='mobile_config' AND policyname='mobile_config_public_read') THEN
    CREATE POLICY "mobile_config_public_read" ON mobile_config FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY "mobile_config_service_write" ON mobile_config FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── mobile_sessions + screen_views (from 20260321_mobile_sessions) ─
CREATE TABLE IF NOT EXISTS mobile_sessions (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_start timestamptz DEFAULT now(),
  session_end   timestamptz,
  duration_secs int,
  platform      text CHECK (platform IN ('ios', 'android')),
  app_version   text,
  screens       text[],
  created_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mobile_sessions_user_idx ON mobile_sessions(user_id, session_start DESC);
CREATE INDEX IF NOT EXISTS mobile_sessions_start_idx ON mobile_sessions(session_start DESC);
ALTER TABLE mobile_sessions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='mobile_sessions' AND policyname='mobile_sessions_own_write') THEN
    CREATE POLICY "mobile_sessions_own_write" ON mobile_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "mobile_sessions_own_update" ON mobile_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "mobile_sessions_service_read" ON mobile_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS screen_views (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id  uuid REFERENCES mobile_sessions(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  screen      text NOT NULL,
  duration_ms int,
  viewed_at   timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS screen_views_screen_idx ON screen_views(screen, viewed_at DESC);
ALTER TABLE screen_views ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='screen_views' AND policyname='screen_views_own_write') THEN
    CREATE POLICY "screen_views_own_write" ON screen_views FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "screen_views_service_all" ON screen_views FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── push_tokens + notification_logs (from 20260321_push_notifications) ─
CREATE TABLE IF NOT EXISTS push_tokens (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  token       text NOT NULL,
  platform    text CHECK (platform IN ('ios', 'android', 'web')),
  device_name text,
  created_at  timestamptz DEFAULT now(),
  last_seen   timestamptz DEFAULT now(),
  UNIQUE (user_id, token)
);
CREATE INDEX IF NOT EXISTS push_tokens_user_idx ON push_tokens(user_id);
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='push_tokens' AND policyname='push_tokens_own_read') THEN
    CREATE POLICY "push_tokens_own_read" ON push_tokens FOR SELECT TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "push_tokens_own_write" ON push_tokens FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "push_tokens_own_update" ON push_tokens FOR UPDATE TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "push_tokens_service_all" ON push_tokens FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS notification_logs (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title      text NOT NULL,
  body       text NOT NULL,
  target     text DEFAULT 'all',
  sent_at    timestamptz DEFAULT now(),
  sent_count int DEFAULT 0,
  sent_by    uuid REFERENCES auth.users(id)
);
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notification_logs' AND policyname='notif_logs_service') THEN
    CREATE POLICY "notif_logs_service" ON notification_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
    CREATE POLICY "notif_logs_admin_read" ON notification_logs FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- ── chat_suggestions + templates (from 20260323_chat_suggestions) ─
CREATE TABLE IF NOT EXISTS chat_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  text text NOT NULL,
  category text NOT NULL CHECK (category IN ('assessment','therapy','checkin','progress','education','support')),
  context jsonb DEFAULT '{}'::jsonb,
  priority int DEFAULT 0,
  show_after_messages int DEFAULT 0,
  show_if_no_checkin_today boolean DEFAULT false,
  show_if_thi_score_high boolean DEFAULT false,
  show_if_new_user boolean DEFAULT false,
  shown_count int DEFAULT 0,
  clicked_count int DEFAULT 0,
  dismissed_count int DEFAULT 0,
  last_shown_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_suggestions_user_id ON chat_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_suggestions_active ON chat_suggestions(is_active) WHERE is_active = true;

CREATE TABLE IF NOT EXISTS suggestion_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  text_vi text NOT NULL,
  text_en text NOT NULL,
  conditions jsonb DEFAULT '{}'::jsonb,
  priority int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_suggestion_templates_active ON suggestion_templates(is_active) WHERE is_active = true;

ALTER TABLE chat_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestion_templates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='chat_suggestions' AND policyname='Users can view own chat suggestions') THEN
    CREATE POLICY "Users can view own chat suggestions" ON chat_suggestions FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
    CREATE POLICY "Users can insert own chat suggestions" ON chat_suggestions FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
    CREATE POLICY "Users can update own chat suggestions" ON chat_suggestions FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Anyone can view suggestion templates" ON suggestion_templates FOR SELECT USING (true);
    CREATE POLICY "Admins can manage suggestion templates" ON suggestion_templates FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
  END IF;
END $$;

-- ── stripe_events (from 20260417_stripe_idempotency) ────────
CREATE TABLE IF NOT EXISTS stripe_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  processed_at timestamptz DEFAULT now()
);
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='stripe_events' AND policyname='service_only_stripe_events') THEN
    CREATE POLICY "service_only_stripe_events" ON stripe_events FOR ALL USING (false);
  END IF;
END $$;

-- ── conversations: soft-delete support ──────────────────────
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- ── promotions + promotion_redemptions (NEW) ─────────────────
CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  kind text NOT NULL CHECK (kind IN ('percent','fixed','trial_extend','tier_grant')),
  value numeric,
  tier_grant text CHECK (tier_grant IN ('premium','pro','ultra')),
  applies_to_tiers text[],
  max_uses int,
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
ALTER TABLE promotion_redemptions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='promotions' AND policyname='admin_only_promotions') THEN
    CREATE POLICY "admin_only_promotions" ON promotions FOR ALL USING (is_admin());
    CREATE POLICY "admin_only_redemptions" ON promotion_redemptions FOR ALL USING (is_admin());
  END IF;
END $$;

-- ── admin_audit_log (NEW) ────────────────────────────────────
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
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='admin_audit_log' AND policyname='admin_only_audit') THEN
    CREATE POLICY "admin_only_audit" ON admin_audit_log FOR ALL USING (is_admin());
  END IF;
END $$;
