# Changelog — TinniMate

## [2026-04-17] — Sprint 1-4 Complete + Production Deploy

### Security (HIGH)
- **fix(save-assessment):** Map `total_score→score`, `severity→interpretation` khớp với DB schema. Backward compat: accept cả 2 tên field.
- **fix(chat/suggestions):** Xóa trust vào `X-User-ID` header. Luôn xác minh qua `supabase.auth.getUser()`.
- **fix(chat):** IDOR prevention — kiểm tra `conversations.user_id === user.id` trước khi insert message.
- **fix(chat):** Guest rate limit chuyển từ client-side header (`X-Guest-Count`) sang IP-based server-side.

### Infrastructure
- **feat(rate-limit):** Tạo `lib/rate-limit.ts` — Upstash Redis khi có env, in-memory fallback khi không có.
- **feat(stripe):** Idempotency guard via bảng `stripe_events` (PK = event.id). Duplicate events → HTTP 200 skip.
- **chore:** Migration `20260417_stripe_idempotency.sql` — cần apply lên production DB.

### Auth & Middleware
- **fix(middleware):** Đổi route-group `/(app)` (broken) sang explicit route list trong `lib/supabase/middleware.ts`.
- **fix(middleware):** Thêm `sitemap.xml`, `robots.txt` vào exclusion list của middleware matcher.

### UX & Chat
- **fix(chat):** `.single()` → `.maybeSingle()` trong suggestions — tránh 500 error khi 0 rows.
- **fix(chat):** UTC+7 timezone cho daily checkin query.
- **fix(chat):** SSE parser: `TextDecoder({stream:true})` + buffer accumulator — fix JSON chunk split.
- **fix(chat):** Xóa `addMessage` thừa trong `handleToolResult` — fix duplicate messages.
- **fix(chat):** Hydration: thay timeout 500ms bằng store state check — fix UI flicker.

### Features
- **feat(mixer):** +3 sounds: River 🏞️, Wind 💨, Singing Bowl 🎶 (tổng 11 sounds, AudioBuffer synthesized).
- **feat(mixer):** Tier gating — Free: max 1 layer, Premium/Pro/Ultra: max 4 layers + lock badge.

### Mobile
- **refactor(mobile):** Consolidate store — xóa toàn bộ import từ `userStore.ts` (legacy). 0 remaining.
  - Migrated: `_layout.tsx`, `journal.tsx`, `cbti.tsx`, `usePushNotifications.ts`, `useSessionTracker.ts`

### SEO
- **feat(seo):** Tạo `app/sitemap.ts` và `app/robots.ts` (Next.js 15+ format).
- `robots.txt` hoạt động (HTTP 200). `sitemap.xml` pending fix (Next.js 16 middleware issue).

### Deploy
- Docker build + `docker compose up` thành công.
- Git push: `0b3ceaec`, `27117efb` → `origin/master`.
- Production: **https://tinnimate.vuinghe.com** — ✅ Online.

---

## [2026-04-16] — Landing Page + Video Templates

### Added
- **feat(landing):** 3D Brain Hero Banner — knowledge graph visualization với animated SVG edges + neuron nodes
- **feat(videos):** 50 TikTok video HTML templates + batch generation pipeline (Remotion)

---

## [2026-04-15] — Mobile App Full Refactor

### Added
- **feat(mobile):** Full refactor tabs, screens, chat components, audio engine
- **feat(mobile):** Push notifications, session tracker, CRM analytics

---

## [Earlier] — Initial Build

### Added
- Web app: Next.js 16 + Supabase + Gemini AI
- Mobile: Expo SDK 54 + React Native
- Sound therapy, assessments, journal, CBT-i modules
- Admin dashboard, Stripe subscriptions
