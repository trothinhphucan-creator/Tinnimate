-- mobile_sessions: track app usage per user/device
CREATE TABLE IF NOT EXISTS mobile_sessions (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_start timestamptz DEFAULT now(),
  session_end   timestamptz,
  duration_secs int,
  platform      text CHECK (platform IN ('ios', 'android')),
  app_version   text,
  screens       text[],           -- list of screens visited e.g. ['player','journal']
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mobile_sessions_user_idx ON mobile_sessions(user_id, session_start DESC);
CREATE INDEX IF NOT EXISTS mobile_sessions_start_idx ON mobile_sessions(session_start DESC);

ALTER TABLE mobile_sessions ENABLE ROW LEVEL SECURITY;

-- Users can insert/update their own sessions
CREATE POLICY "mobile_sessions_own_write"
  ON mobile_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mobile_sessions_own_update"
  ON mobile_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Service role can read all (for admin analytics)
CREATE POLICY "mobile_sessions_service_read"
  ON mobile_sessions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- screen_views: track individual screen visits
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
CREATE POLICY "screen_views_own_write" ON screen_views FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "screen_views_service_all" ON screen_views FOR ALL TO service_role USING (true) WITH CHECK (true);
