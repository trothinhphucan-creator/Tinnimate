# Audit Report - 2026-03-27

## Summary
- 🔴 Critical Issues: 2
- 🟡 Warnings: 1
- 🟢 Suggestions: 2

## 🔴 Critical Issues (Phải sửa ngay)

1. **Unoptimized Images leading to poor LCP (Web Frontend)**
   - File: `web/app/page.tsx`, `web/app/(admin)/admin/video-creator/page.tsx`
   - Nguy hiểm: Trang landing page dùng thẻ HTML `<img src="..."/>` tiêu chuẩn cho ảnh tĩnh (testimonial avatars, feature mockups) thay vì component `<Image>` của Next.js. Điều này làm trang tải chậm hơn, không nén được ảnh sang WebP/AVIF, và không có lazy loading, làm tụt điểm Lighthouse (SEO) và gây tốn 3G/4G của người dùng.
   - Cách sửa: Import `import Image from 'next/image'` và thay thế tất cả thẻ `<img ... />` bằng `<Image ... width={...} height={...} />`.

2. **React Native FlatList Memory Leak (Mobile Frontend)**
   - File: `mobile/app/(tabs)/chat.tsx` (dòng 298)
   - Nguy hiểm: Danh sách tin nhắn `FlatList` chưa được tối ưu `initialNumToRender`, `maxToRenderPerBatch`, `windowSize`, và truyền thẳng inline arrow function vào `renderItem`. Khi người dùng nhắn quá 50-100 tin, app sẽ bị giật lag nghiêm trọng, hao pin và có thể crash do tràn RAM (component re-render toàn bộ list liên tục).
   - Cách sửa: Thêm các props tối ưu bộ nhớ (`initialNumToRender={15}`, v.v.) và bọc `renderItem` lại bằng `useCallback`. Bọc `<MessageBubble />` bằng `React.memo`.

## 🟡 Warnings (Nên sửa)

1. **Over-fetching Data "Select *" (Backend / Supabase)**
   - File: `web/app/api/chat/suggestions/route.ts` (dòng 41), `web/test-crm-api.mjs`
   - Vấn đề: Truy vấn dùng `.select('*')` trên bảng `profiles`.
   - Nguy hiểm: Việc lấy "tất cả các cột" từ database khi chỉ cần 1-2 trường (như `subscription_tier`) làm chậm tốc độ phản hồi API, phí băng thông server và rò rỉ các thông tin không cần thiết nếu vô tình trả thẳng về frontend.
   - Cách sửa: Đổi thành `.select('id, subscription_tier, name')` hoặc các cột cụ thể cần thiết. Mọi lượt query `.select('*', { count: 'exact' })` chỉ để lấy tổng số đếm cũng nên đổi thành `.select('id', { count: 'exact', head: true })`.

## 🟢 Suggestions (Tùy chọn)

1. **Component Lazy Loading (Web)**: Có thể code split phần Testimonial Bento Grid hoặc các thẻ ẩn ở dưới màn hình đầu (below the fold) bằng `next/dynamic` để load JS nhanh hơn.
2. **Missing Index Check (Database)**: Hãy chắc chắn `subscription_tier` và `created_at` trên bảng `profiles` và `daily_checkins` đã được đánh index trên Supabase b-tree để truy vấn analytics dashboard siêu tốc.

## Next Steps
- Cập nhật các component ảnh (Web).
- Thêm `useCallback` & Props cho FlatList (Mobile).
- Refactor Supabase queries (API).
