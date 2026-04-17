# ✅ Fix Session Persistence - Không phải đăng nhập lại liên tục

## 🐛 Vấn đề

Web không lưu session → Phải đăng nhập lại liên tục → Lỗi `too_many_attempts` từ Supabase rate limit

## ✅ Đã sửa (Code)

### 1. **Tạo middleware.ts ở root** ✅

**File:** `web/middleware.ts` (MỚI TẠO)

```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Tác dụng:**
- Middleware chạy trên **mọi request**
- Tự động refresh Supabase session trước khi expire
- Ngăn session bị mất

---

### 2. **Cấu hình cookie options** ✅

**File:** `web/lib/supabase/middleware.ts` + `web/lib/supabase/server.ts`

**Thay đổi:**
```typescript
supabaseResponse.cookies.set(name, value, {
  ...options,
  httpOnly: true,                          // Bảo mật
  secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
  sameSite: 'lax',                        // Cho phép cross-site
  maxAge: 60 * 60 * 24 * 7,              // 7 ngày
})
```

**Tác dụng:**
- Cookie được lưu **7 ngày** thay vì session-only
- Bảo mật với `httpOnly` và `secure`
- Tương thích cross-origin với `sameSite: 'lax'`

---

## 🔧 Cần làm thêm trên Supabase Dashboard

### **Tăng Session Lifetime trên Supabase**

1. Vào [Supabase Dashboard](https://app.supabase.com/project/usujonswoxboxlysakcm/settings/auth)
2. Chọn **Authentication** → **Settings**
3. Tìm section **Sessions**
4. Cấu hình:

```
JWT Expiry: 604800 (7 days in seconds)
Refresh Token Expiry: 2592000 (30 days in seconds)
```

5. **Save**

---

### **Tăng Rate Limit (tránh too_many_attempts)**

1. Vào **Authentication** → **Rate Limits**
2. Điều chỉnh:

```
Email login attempts: 100/hour (thay vì mặc định 10/hour)
Password reset: 50/hour
```

3. **Save**

---

## 🧪 Test

### **1. Test session persistence:**

1. Đăng nhập vào web
2. Đóng tab
3. Mở lại sau 1 giờ
4. ✅ Vẫn còn đăng nhập (không cần login lại)

### **2. Test middleware:**

```bash
# Check middleware hoạt động
curl -I https://tinnimate.vuinghe.com/chat
# Should see Set-Cookie headers with max-age=604800
```

### **3. Check cookies trong browser:**

1. Mở DevTools → Application → Cookies
2. Tìm cookies có prefix `sb-usujonswoxboxlysakcm`
3. Kiểm tra:
   - ✅ `Max-Age: 604800` (7 days)
   - ✅ `HttpOnly: true`
   - ✅ `Secure: true` (production)
   - ✅ `SameSite: Lax`

---

## 📊 Kết quả mong đợi

**Trước:**
- ❌ Đăng nhập lại sau vài phút/giờ
- ❌ Lỗi `too_many_attempts` do login quá nhiều
- ❌ Session cookies expire ngay khi đóng browser

**Sau:**
- ✅ Session lưu **7 ngày**
- ✅ Tự động refresh token trước khi expire
- ✅ Không phải đăng nhập lại liên tục
- ✅ Rate limit đủ cao cho sử dụng bình thường

---

## 🚀 Deploy

```bash
cd /home/haichu/tinnimate/web
npm run build
pm2 restart tinnimate
```

**QUAN TRỌNG:** Nhớ cấu hình Supabase Dashboard như hướng dẫn ở trên!
