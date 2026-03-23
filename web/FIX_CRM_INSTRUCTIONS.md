# 🔧 Fix: Admin CRM không hiển thị danh sách user

## Vấn đề
Admin dashboard CRM page không hiển thị danh sách users vì:
1. Database thiếu cột `is_admin` trong bảng `profiles`
2. API route không select cột `is_admin` (đã fix ✅)

## Giải pháp

### Bước 1: Chạy migration SQL

**Cách 1: Qua Supabase Dashboard (Khuyến nghị)** 👈

1. Mở Supabase SQL Editor:
   ```
   https://supabase.com/dashboard/project/usujonswoxboxlysakcm/sql/new
   ```

2. Copy toàn bộ nội dung file này và paste vào SQL Editor:
   ```
   web/supabase/migrations/20260321_fix_is_admin.sql
   ```

3. Click nút **"Run"** (hoặc Ctrl+Enter)

4. Kiểm tra kết quả query cuối cùng (SELECT) - sẽ hiển thị:
   ```
   email                    | is_admin | subscription_tier
   -------------------------+----------+------------------
   chuduchaici@gmail.com    | true     | ...
   duchaisea@gmail.com      | true     | ...
   office.phucan@gmail.com  | true     | ...
   trothinh.phucan@gmail.com| true     | ...
   ```

**Cách 2: Qua psql CLI**

Nếu bạn có database password:

```bash
cd /home/haichu/tinnimate/web

# Get password from: https://supabase.com/dashboard/project/usujonswoxboxlysakcm/settings/database

psql 'postgresql://postgres:[YOUR-PASSWORD]@db.usujonswoxboxlysakcm.supabase.co:5432/postgres' \
  -f supabase/migrations/20260321_fix_is_admin.sql
```

---

### Bước 2: Restart Next.js server

Sau khi chạy migration thành công:

```bash
cd /home/haichu/tinnimate/web

# Nếu đang chạy dev server, restart:
# Ctrl+C để dừng
npm run dev

# Hoặc nếu chạy production:
npm run build
npm start
```

---

### Bước 3: Kiểm tra CRM page

1. Đăng nhập với admin account:
   - `chuduchaici@gmail.com`
   - `duchaisea@gmail.com`
   - `office.phucan@gmail.com`
   - `trothinh.phucan@gmail.com`

2. Vào admin dashboard:
   ```
   https://tinnimate.vuinghe.com/admin/users
   ```

3. Bạn sẽ thấy:
   - ✅ Danh sách users hiển thị
   - ✅ Admin badge hiển thị bên cạnh tên admin
   - ✅ Shield icon để toggle admin status
   - ✅ Stats cards (Total, Free, Premium, Pro, Ultra, Active 7d)

---

## Chi tiết thay đổi

### 1. Database Migration (`20260321_fix_is_admin.sql`)

```sql
-- Add is_admin column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Set existing admins
UPDATE profiles SET is_admin = true
WHERE email IN (
  'chuduchaici@gmail.com',
  'duchaisea@gmail.com',
  'office.phucan@gmail.com',
  'trothinh.phucan@gmail.com'
);

-- Add admin_notes column (for CRM notes)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_notes text;

-- Add ultra tier to subscription constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'premium', 'pro', 'ultra'));
```

### 2. API Route Fix (`app/api/admin/users/route.ts`)

**Trước:**
```typescript
.select('id, name, email, subscription_tier, ..., created_at, ...')
```

**Sau:**
```typescript
.select('id, name, email, subscription_tier, ..., is_admin, created_at, ...')
//                                                  ^^^^^^^^ Added
```

---

## Troubleshooting

### Lỗi: "column is_admin does not exist"

➡️ Migration chưa chạy. Quay lại Bước 1.

### Lỗi: "permission denied for table profiles"

➡️ Bạn đang dùng anon key thay vì service_role key. API route đã dùng đúng `createServiceClient()`.

### CRM vẫn trống sau khi chạy migration

1. Hard refresh browser: `Ctrl+Shift+R` (hoặc `Cmd+Shift+R` trên Mac)
2. Kiểm tra Console trong DevTools xem có lỗi API không
3. Kiểm tra Network tab xem response của `/api/admin/users` có data không

### Stats cards hiển thị 0

➡️ Database chưa có user nào. Đăng ký account mới hoặc import demo data.

---

## Thêm admin mới

Sau khi migration chạy xong, có 2 cách:

**Cách 1: Qua CRM UI (Khuyến nghị)** 👈

1. Đăng nhập với admin account hiện tại
2. Vào `/admin/users`
3. Click vào user muốn promote
4. Click icon Shield trống → sẽ chuyển thành Shield màu xanh (admin)

**Cách 2: Qua SQL**

```sql
UPDATE profiles SET is_admin = true
WHERE email = 'new-admin@example.com';
```

---

## Xóa quyền admin

**Cách 1: Qua CRM UI**

1. Click vào admin user
2. Click icon Shield xanh → sẽ chuyển thành Shield xám (demote)

**Cách 2: Qua SQL**

```sql
UPDATE profiles SET is_admin = false
WHERE email = 'old-admin@example.com';
```

---

## File đã sửa

- ✅ [web/app/api/admin/users/route.ts](./app/api/admin/users/route.ts) - Added `is_admin` to SELECT query
- ✅ [web/supabase/migrations/20260321_fix_is_admin.sql](./supabase/migrations/20260321_fix_is_admin.sql) - Migration file (ready to run)

---

## Liên hệ

Nếu vẫn gặp vấn đề, check:
- Supabase dashboard logs: https://supabase.com/dashboard/project/usujonswoxboxlysakcm/logs/explorer
- Next.js console logs: `npm run dev` output
- Browser DevTools Console
