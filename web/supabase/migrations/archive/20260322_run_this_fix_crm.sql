-- Fix CRM: Add is_admin column to profiles
-- Copy ONLY this SQL (not the markdown) into Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/usujonswoxboxlysakcm/sql/new

-- 1. Add is_admin column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 2. Set admins (update emails as needed)
UPDATE profiles SET is_admin = true
WHERE email IN (
  'chuduchaici@gmail.com',
  'duchaisea@gmail.com',
  'office.phucan@gmail.com',
  'trothinh.phucan@gmail.com'
);

-- 3. Add admin_notes column (needed by CRM PUT API)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_notes text;

-- 4. Add ultra tier support
DO $$
BEGIN
  BEGIN
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
    ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_tier_check
      CHECK (subscription_tier IN ('free', 'premium', 'pro', 'ultra'));
  EXCEPTION WHEN others THEN
    NULL;
  END;
END $$;

-- 5. Verify (check result)
SELECT email, is_admin, subscription_tier
FROM profiles
ORDER BY is_admin DESC, created_at
LIMIT 15;
