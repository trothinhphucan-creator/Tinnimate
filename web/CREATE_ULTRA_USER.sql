-- Create Ultra user for testing
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/usujonswoxboxlysakcm/sql/new

-- Option 1: Promote existing user to Ultra
-- (Thay 'email@example.com' bằng email thực tế)
UPDATE profiles
SET subscription_tier = 'ultra'
WHERE email = 'testuser2@tinnitest.com';

-- Option 2: Promote admin to Ultra (để test)
UPDATE profiles
SET subscription_tier = 'ultra'
WHERE email = 'chuduchaici@gmail.com';

-- Option 3: Create new Ultra user (nếu cần)
-- Bước 1: User phải đăng ký account trước qua web
-- Bước 2: Sau đó chạy query này với email của user:
-- UPDATE profiles SET subscription_tier = 'ultra' WHERE email = 'new-user@example.com';

-- Verify
SELECT email, subscription_tier, is_admin
FROM profiles
WHERE subscription_tier = 'ultra';
