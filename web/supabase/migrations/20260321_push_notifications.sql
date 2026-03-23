-- push_tokens: stores Expo push tokens for each device/user
-- Admin uses this to send targeted or broadcast notifications

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

-- RLS
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own tokens
CREATE POLICY "push_tokens_own_read"
  ON push_tokens FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "push_tokens_own_write"
  ON push_tokens FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_tokens_own_update"
  ON push_tokens FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can read all (for sending notifications)
CREATE POLICY "push_tokens_service_all"
  ON push_tokens FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- notification_logs: track sent notifications
CREATE TABLE IF NOT EXISTS notification_logs (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title       text NOT NULL,
  body        text NOT NULL,
  target      text DEFAULT 'all',  -- 'all' | user_id
  sent_at     timestamptz DEFAULT now(),
  sent_count  int DEFAULT 0,
  sent_by     uuid REFERENCES auth.users(id)
);

ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_logs_service" ON notification_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "notif_logs_admin_read" ON notification_logs FOR SELECT TO authenticated USING (true);
