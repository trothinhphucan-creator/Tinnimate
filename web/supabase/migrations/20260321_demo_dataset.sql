-- Demo Dataset Migration
-- 1. Add 'ultra' to subscription_tier check constraint (if exists)
-- 2. Add admin_notes column to profiles
-- 3. Upgrade all existing users to 'ultra'
-- 4. Insert demo users with realistic data

-- Step 1: Add admin_notes if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_notes text;

-- Step 2: Drop old constraint and re-add with ultra
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'premium', 'pro', 'ultra'));

-- Step 3: Upgrade all existing real users to 'ultra'
UPDATE profiles
SET subscription_tier = 'ultra'
WHERE id IN (SELECT id FROM auth.users);

-- Step 4: Insert demo users into auth.users + profiles
-- (use fixed UUIDs for reproducibility)
DO $$
DECLARE
  demo_users JSONB := '[
    {"id":"11111111-0001-0001-0001-000000000001","email":"linh.nguyen@gmail.com","name":"Nguyễn Thị Linh","tier":"ultra","ttype":"high-pitched","freq":6000,"ear":"right","streak":42},
    {"id":"11111111-0002-0002-0002-000000000002","email":"minh.tran@yahoo.com","name":"Trần Văn Minh","tier":"pro","ttype":"pulsatile","freq":4000,"ear":"left","streak":15},
    {"id":"11111111-0003-0003-0003-000000000003","email":"hoa.le@gmail.com","name":"Lê Thị Hoa","tier":"ultra","ttype":"low-pitched","freq":500,"ear":"both","streak":88},
    {"id":"11111111-0004-0004-0004-000000000004","email":"duc.pham@hotmail.com","name":"Phạm Văn Đức","tier":"free","ttype":"high-pitched","freq":8000,"ear":"right","streak":3},
    {"id":"11111111-0005-0005-0005-000000000005","email":"mai.vu@gmail.com","name":"Vũ Thị Mai","tier":"premium","ttype":"roaring","freq":2000,"ear":"left","streak":27},
    {"id":"11111111-0006-0006-0006-000000000006","email":"tuan.hoang@gmail.com","name":"Hoàng Văn Tuấn","tier":"ultra","ttype":"clicking","freq":1000,"ear":"both","streak":56},
    {"id":"11111111-0007-0007-0007-000000000007","email":"lan.do@gmail.com","name":"Đỗ Thị Lan","tier":"free","ttype":"hissing","freq":7000,"ear":"right","streak":0},
    {"id":"11111111-0008-0008-0008-000000000008","email":"cuong.bui@gmail.com","name":"Bùi Văn Cường","tier":"pro","ttype":"buzzing","freq":3000,"ear":"left","streak":19},
    {"id":"11111111-0009-0009-0009-000000000009","email":"thu.vo@gmail.com","name":"Võ Thị Thu","tier":"ultra","ttype":"high-pitched","freq":5000,"ear":"right","streak":71},
    {"id":"11111111-0010-0010-0010-000000000010","email":"khanh.nguyen@outlook.com","name":"Nguyễn Văn Khánh","tier":"premium","ttype":"ringing","freq":4500,"ear":"both","streak":33}
  ]'::JSONB;
  u JSONB;
  uid UUID;
BEGIN
  FOR u IN SELECT * FROM jsonb_array_elements(demo_users)
  LOOP
    uid := (u->>'id')::UUID;

    -- Insert into auth.users (demo, no real auth)
    INSERT INTO auth.users (
      id, email, created_at, updated_at,
      raw_user_meta_data, email_confirmed_at,
      aud, role
    )
    VALUES (
      uid,
      u->>'email',
      NOW() - (random() * interval '180 days'),
      NOW(),
      jsonb_build_object('name', u->>'name'),
      NOW(),
      'authenticated',
      'authenticated'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Insert/update profile
    INSERT INTO profiles (
      id, email, name, subscription_tier,
      tinnitus_type, tinnitus_frequency, tinnitus_ear,
      streak_count, last_checkin_date, created_at
    )
    VALUES (
      uid,
      u->>'email',
      u->>'name',
      u->>'tier',
      u->>'ttype',
      (u->>'freq')::int,
      u->>'ear',
      (u->>'streak')::int,
      CURRENT_DATE - ((random() * 14)::int),
      NOW() - (random() * interval '180 days')
    )
    ON CONFLICT (id) DO UPDATE SET
      subscription_tier = EXCLUDED.subscription_tier,
      tinnitus_type = EXCLUDED.tinnitus_type,
      tinnitus_frequency = EXCLUDED.tinnitus_frequency,
      streak_count = EXCLUDED.streak_count,
      last_checkin_date = EXCLUDED.last_checkin_date;

  END LOOP;
END $$;

-- Verify
SELECT name, email, subscription_tier, streak_count FROM profiles ORDER BY created_at DESC LIMIT 15;
