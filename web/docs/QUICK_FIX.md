# 🚀 QUICK FIX - Admin CRM không hiển thị users

## Vấn đề
CRM page trống vì thiếu cột `is_admin` trong database.

## Giải pháp (2 phút) ⏱️

### Bước 1: Mở Supabase SQL Editor

Click link này:
```
https://supabase.com/dashboard/project/usujonswoxboxlysakcm/sql/new
```

### Bước 2: Copy & Paste SQL này vào editor

```sql
-- Fix CRM: Add is_admin column to profiles
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

-- 5. Verify (optional - check kết quả)
SELECT email, is_admin, subscription_tier
FROM profiles
ORDER BY is_admin DESC, created_at
LIMIT 15;
```

### Bước 3: Click "Run" (hoặc Ctrl+Enter)

Nếu thành công, bạn sẽ thấy query cuối trả về danh sách users với cột `is_admin = true` cho các admin.

### Bước 4: Refresh trang CRM

```
https://tinnimate.vuinghe.com/admin/users
```

**Hoặc nếu đang chạy local:**
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) hoặc `Cmd+Shift+R` (Mac)

---

## ✅ Done!

Bây giờ bạn sẽ thấy:
- Danh sách users hiển thị
- Admin badge bên cạnh admin users
- Stats cards (Total, Free, Premium, Pro, Ultra, Active 7d)
- Shield icon để toggle admin status

---

## Troubleshooting

**❌ "permission denied for table profiles"**
- Bạn cần đăng nhập vào Supabase Dashboard với account owner/admin

**❌ "column already exists"**
- OK! Migration đã chạy rồi. Chỉ cần refresh trang CRM

**❌ CRM vẫn trống**
- Check browser console (F12) xem có lỗi gì
- Kiểm tra Network tab → `/api/admin/users` response
- Restart Next.js server: `npm run dev`
