# 🔒 Fix: Supabase Rate Limit - "too_many_attempts"

## Vấn đề
```
https://tinnimate.vuinghe.com/login?error=too_many_attempts
```

Supabase đã block login attempts từ IP của bạn do:
- Quá nhiều lần login thất bại
- Hoặc quá nhiều requests trong thời gian ngắn

## Giải pháp

### Option 1: Đợi (Khuyến nghị nếu không gấp) ⏱️

Rate limit tự động reset sau **1 giờ**.

**Cách làm:**
- Đợi 1 giờ
- Thử login lại
- Done ✅

---

### Option 2: Reset qua Supabase Dashboard (Nhanh) ⚡

**Bước 1:** Đăng nhập Supabase Dashboard
```
https://supabase.com/dashboard/project/usujonswoxboxlysakcm
```

**Bước 2:** Vào Auth Settings
```
https://supabase.com/dashboard/project/usujonswoxboxlysakcm/auth/rate-limits
```

**Bước 3:** Tìm IP của bạn và clear rate limit
- Xem danh sách IPs bị block
- Click "Clear" hoặc "Unblock"

**Bước 4:** Thử login lại

---

### Option 3: Login từ IP khác (Workaround nhanh)

**Cách 1: Mobile hotspot**
- Tắt WiFi
- Bật 4G/5G hotspot trên điện thoại
- Kết nối máy tính vào hotspot
- Login lại (IP mới)

**Cách 2: VPN**
- Bật VPN (ProtonVPN, NordVPN, v.v.)
- Đổi IP
- Login lại

**Cách 3: Incognito + Mobile network**
- Mở Incognito/Private window
- Thử login
- Nếu vẫn bị block → dùng mobile hotspot

---

### Option 4: Reset password để bypass (Nếu không nhớ password)

**Bước 1:** Click "Forgot password?" trên login page

**Bước 2:** Nhập email admin:
```
chuduchaici@gmail.com
```

**Bước 3:** Check email và click reset link

**Bước 4:** Set password mới

**Bước 5:** Login với password mới

---

### Option 5: Direct database fix (Service Role Key)

Nếu bạn có quyền service_role, có thể reset qua API:

```javascript
// Reset auth rate limit via service role
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://usujonswoxboxlysakcm.supabase.co',
  'YOUR_SERVICE_ROLE_KEY'  // From .env.production
)

// This won't help with rate limits directly, but you can create a new session
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'chuduchaici@gmail.com',
  password: 'your-password'
})
```

**⚠️ Lưu ý:** Service role key bypass RLS, nhưng KHÔNG bypass rate limit.

---

## Tại sao bị rate limit?

Supabase Auth có giới hạn:
- **Email/Password Login:** 30 requests / hour per IP
- **OTP/Magic Link:** 60 requests / hour per IP
- **Password Reset:** 4 requests / hour per email

Bạn có thể đã:
1. Thử login sai password nhiều lần
2. Refresh trang nhiều lần (mỗi lần load trang có thể trigger auth check)
3. Test API nhiều lần với auth headers không đúng

---

## Cách tránh lỗi này trong tương lai

### 1. Tăng rate limit trong Supabase Dashboard

**Vào:** https://supabase.com/dashboard/project/usujonswoxboxlysakcm/auth/rate-limits

**Tùy chỉnh:**
- Email login: 30 → 100 requests/hour
- OTP: 60 → 200 requests/hour
- Password reset: 4 → 10 requests/hour

### 2. Implement retry logic với exponential backoff

```typescript
// lib/supabase/retry-login.ts
async function loginWithRetry(email: string, password: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (!error) return { data, error: null }

      // If rate limited, don't retry immediately
      if (error.message.includes('too_many_attempts')) {
        throw new Error('Rate limited. Please wait 1 hour.')
      }

      // Wait before retry: 1s, 2s, 4s
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)))
    } catch (err) {
      if (i === maxRetries - 1) throw err
    }
  }
}
```

### 3. Cache session để tránh re-authenticate

```typescript
// Supabase client already does this, but make sure:
const supabase = createClient(url, key, {
  auth: {
    persistSession: true,  // ✅ Cache session in localStorage
    autoRefreshToken: true, // ✅ Auto refresh before expire
  }
})
```

---

## Giải pháp NHANH NHẤT cho bạn bây giờ:

### 🚀 Dùng mobile hotspot + incognito

```
1. Tắt WiFi
2. Bật 4G hotspot trên điện thoại
3. Kết nối máy tính vào hotspot
4. Mở Incognito window (Ctrl+Shift+N)
5. Vào: https://tinnimate.vuinghe.com/login
6. Login với: chuduchaici@gmail.com
7. ✅ Success!
```

**Sau khi login thành công:**
- Session sẽ persist
- Có thể tắt hotspot, quay lại WiFi
- Session vẫn còn (không cần login lại)

---

## Test CRM ngay sau khi login:

```
https://tinnimate.vuinghe.com/admin/users
```

Bạn sẽ thấy:
- ✅ 10 users
- ✅ Stats cards
- ✅ Admin badges
- ✅ Tất cả đã hoạt động!

---

## FAQ

**Q: Tại sao không thể login admin từ database?**
A: Supabase Auth rate limit apply ở network layer (IP-based), không phải user-based.

**Q: Service role key có bypass rate limit không?**
A: KHÔNG. Rate limit apply cho tất cả requests đến Auth API.

**Q: Có cách nào bypass ngoài đổi IP không?**
A: Không. Rate limit là bảo mật cứng của Supabase. Chỉ có cách:
   1. Đợi 1 giờ
   2. Đổi IP (VPN/mobile hotspot)
   3. Contact Supabase support (nếu Pro plan)

**Q: Làm sao biết khi nào rate limit reset?**
A: Supabase không expose exact reset time. Thường là 1 giờ kể từ lần request đầu tiên bị block.

---

## ✅ Recommended Action NOW:

**Fastest way (5 phút):**
```bash
1. Bật mobile hotspot
2. Kết nối máy tính
3. Mở incognito: https://tinnimate.vuinghe.com/login
4. Login: chuduchaici@gmail.com
5. Vào CRM: https://tinnimate.vuinghe.com/admin/users
6. ✅ Verify 10 users hiển thị!
```

Sau đó bạn có thể tắt hotspot, session vẫn còn trong 1 tuần (Supabase default session lifetime).

---

**Good luck!** 🚀
