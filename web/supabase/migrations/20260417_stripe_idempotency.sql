-- Stripe webhook idempotency guard
-- Prevent double-processing of the same event (e.g. retries from Stripe)
CREATE TABLE IF NOT EXISTS stripe_events (
  id text PRIMARY KEY,          -- event.id from Stripe (e.g. evt_xxxxx)
  type text NOT NULL,           -- event.type
  processed_at timestamptz DEFAULT now()
);

-- Only service role (webhook) should write; no user access needed
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_only_stripe_events" ON stripe_events
  FOR ALL USING (false); -- block all anon/user access; service role bypasses RLS
