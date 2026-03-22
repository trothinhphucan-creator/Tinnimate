-- ✨ UPGRADE ALL EXISTING USERS TO ULTRA TIER ✨
-- This allows everyone to test Zentones feature
-- Run this script in Supabase SQL Editor

-- 1. Update all existing users to Ultra tier
UPDATE profiles
SET subscription_tier = 'ultra'
WHERE subscription_tier IN ('free', 'premium', 'pro');

-- 2. Verify the update
SELECT
  subscription_tier,
  COUNT(*) as user_count
FROM profiles
GROUP BY subscription_tier
ORDER BY subscription_tier;

-- 3. Show sample of upgraded users
SELECT
  id,
  email,
  name,
  subscription_tier,
  created_at
FROM profiles
WHERE subscription_tier = 'ultra'
ORDER BY created_at DESC
LIMIT 10;
