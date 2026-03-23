# 🔍 DEBUG: CRM vẫn trống sau khi refresh

## Bước 1: Check Browser Console (F12)

1. Mở CRM page: `https://tinnimate.vuinghe.com/admin/users`
2. Bấm `F12` để mở DevTools
3. Vào tab **Console**
4. Có lỗi màu đỏ không?

**Possible errors:**
```
❌ Failed to fetch
❌ 403 Forbidden
❌ 401 Unauthorized
❌ Column does not exist
❌ TypeError: Cannot read property...
```

**Nếu có lỗi → chụp screen và gửi cho tôi**

---

## Bước 2: Check Network Tab

1. Vẫn trong DevTools (F12)
2. Vào tab **Network**
3. Reload trang (`Ctrl+R`)
4. Tìm request: `/api/admin/users`
5. Click vào request đó
6. Xem tab **Response**

**Kiểm tra:**

### A. Status Code là gì?
- ✅ **200 OK** → Good, check response data
- ❌ **401 Unauthorized** → Chưa login hoặc session expired
- ❌ **403 Forbidden** → Không phải admin
- ❌ **500 Internal Server Error** → Lỗi server

### B. Response data (nếu 200 OK)

**Good response:**
```json
{
  "users": [
    { "id": "xxx", "email": "test@example.com", "is_admin": false, ... },
    { "id": "yyy", "email": "admin@example.com", "is_admin": true, ... }
  ],
  "total": 10,
  "stats": { "total": 10, "free": 10, ... }
}
```

**Bad response (empty):**
```json
{
  "users": [],
  "total": 0,
  "stats": { "total": 0, ... }
}
```

**Error response:**
```json
{
  "error": "Forbidden"
}
```

---

## Bước 3: Verify đã login với admin account

1. Vào tab **Application** (hoặc **Storage**)
2. Expand **Local Storage**
3. Click vào domain: `https://tinnimate.vuinghe.com`
4. Tìm key: `sb-usujonswoxboxlysakcm-auth-token`
5. Click vào → xem **Value**

**Kiểm tra:**
- Value có dài không? (JWT token)
- Có chứa email không?

**Decode JWT token:**
1. Copy value
2. Vào: https://jwt.io
3. Paste vào "Encoded"
4. Xem phần "Payload":
   ```json
   {
     "email": "chuduchaici@gmail.com",  // ← Phải là admin email
     "role": "authenticated",
     ...
   }
   ```

---

## Bước 4: Test API trực tiếp với curl

Mở terminal và chạy:

```bash
# Get session token from browser (F12 → Application → Local Storage)
# Copy giá trị của key: sb-usujonswoxboxlysakcm-auth-token
# Nó sẽ có dạng: {"access_token":"eyJhbG...","refresh_token":"..."}

# Test API:
curl -H "Cookie: sb-access-token=YOUR_ACCESS_TOKEN_HERE" \
  https://tinnimate.vuinghe.com/api/admin/users
```

**Hoặc đơn giản hơn - dùng browser:**
1. Vào: `https://tinnimate.vuinghe.com/api/admin/users`
2. Xem response trực tiếp

**Expected result:**
```json
{"users":[...],"total":10,"stats":{...}}
```

---

## Bước 5: Check server logs (nếu chạy local)

Nếu bạn đang chạy `npm run dev`:

1. Xem terminal output
2. Có lỗi nào in ra không?
3. Khi load `/admin/users`, có log gì không?

**Common errors:**
```
❌ Error: column profiles.tinnitus_type does not exist
❌ Error: Could not find the 'is_admin' column
❌ TypeError: Cannot read property 'map' of undefined
```

---

## Bước 6: Verify code đã deploy lên production

**Nếu đang test trên `https://tinnimate.vuinghe.com`:**

Có thể server vẫn chạy code CŨ (chưa deploy code mới).

**Check:**
1. Server deploy lần cuối khi nào?
2. Code trong server có include fix chưa?

**Deploy code mới:**
```bash
cd /home/haichu/tinnimate/web

# Build
npm run build

# Restart server (tùy hosting platform)
# Vercel: git push → auto deploy
# PM2: pm2 restart all
# Docker: docker restart <container>
```

---

## Bước 7: Clear cache + hard refresh

1. Mở DevTools (F12)
2. **Right-click** vào nút Refresh (⟳)
3. Chọn **"Empty Cache and Hard Reload"**

**Hoặc:**
1. Vào tab **Application**
2. **Storage** → **Clear site data**
3. Reload trang

---

## Debug Script - Chạy ngay để test

Tôi đã tạo script test API. Chạy lệnh này:

```bash
cd /home/haichu/tinnimate/web
node test-crm-api.mjs
```

**Kết quả mong đợi:**
```
✅ Found 10 total profiles
✅ Found 10 users
✅ 4 admins with is_admin = true
```

**Nếu lỗi → gửi lỗi cho tôi**

---

## Quick Diagnostic Checklist

Hãy check từng mục và reply cho tôi:

- [ ] **Đã login thành công?** (có JWT token trong localStorage?)
- [ ] **Email đang login là gì?** (admin email hay user thường?)
- [ ] **F12 Console có lỗi không?** (chụp screen)
- [ ] **Network tab → `/api/admin/users` status code?** (200/401/403/500?)
- [ ] **Response data có users array không?** (empty [] hay có data?)
- [ ] **`node test-crm-api.mjs` trả về gì?** (copy output)
- [ ] **Server đang chạy local hay production?** (localhost:3000 hay tinnimate.vuinghe.com?)
- [ ] **Nếu production: đã deploy code mới chưa?** (git push?)

---

## Nếu tất cả pass nhưng vẫn trống:

Có thể do React component không re-render. Try:

```typescript
// Trong page.tsx, force reload:
useEffect(() => {
  fetchUsers()
}, [])

// Nếu vẫn không work, add console.log:
console.log('Users loaded:', users)
console.log('Stats:', stats)
```

---

## Giải pháp nhanh nhất:

**Gửi cho tôi 3 thông tin này:**

1. **Screenshot Console (F12 → Console tab)**
2. **Screenshot Network (F12 → Network → /api/admin/users → Response)**
3. **Output của `node test-crm-api.mjs`**

Với 3 thông tin này, tôi sẽ biết chính xác vấn đề ở đâu và fix ngay! 🚀
