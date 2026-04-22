# Phase 04 — Admin UI: Fanpages, Review Queue, Sources, Analytics

**Priority:** P0
**Status:** ⏳ PENDING
**Estimate:** 2 days
**Depends on:** Phase 01, 03

## Goal

Trang admin `/admin/social-listening/*` để người vận hành:
1. Đăng nhập thêm fanpage Facebook (QR flow).
2. Quản lý nguồn theo dõi (nhóm/page/keyword search).
3. Review queue: duyệt/sửa/đăng hoặc bỏ qua draft reply.
4. Dashboard analytics: posts/ngày, reply rate, CTR.

## Key Insights

- Admin sidebar pattern: thêm group "Social Listening" vào `web/components/admin/AdminSidebar.tsx` với 4 items.
- Review queue phải xoay nhanh (≤ 30s/post) — ưu tiên keyboard shortcut: `A` approve, `R` reject, `E` edit.
- "Post to FB" gọi worker API (worker expose HTTP `/worker/reply/post`) chứ không direct từ web.
- Real-time: dùng Supabase Realtime subscribe `fb_replies` để new drafts hiện ngay không cần refresh.

## Related Files

**Create trong `web/`:**
- `app/(admin)/admin/social-listening/page.tsx` — dashboard overview
- `app/(admin)/admin/social-listening/pages/page.tsx` — fanpage list + add
- `app/(admin)/admin/social-listening/pages/add/page.tsx` — QR login flow
- `app/(admin)/admin/social-listening/sources/page.tsx` — target groups/keywords CRUD
- `app/(admin)/admin/social-listening/queue/page.tsx` — review queue (main UX)
- `app/(admin)/admin/social-listening/history/page.tsx` — posts đã reply/skip
- `app/api/social-listening/pages/route.ts` — list/add fanpages (proxy to worker)
- `app/api/social-listening/pages/[id]/login-start/route.ts` — trigger QR login
- `app/api/social-listening/pages/[id]/login-status/route.ts` — poll login
- `app/api/social-listening/sources/route.ts` — CRUD target sources
- `app/api/social-listening/replies/[id]/approve/route.ts` — approve + post
- `app/api/social-listening/replies/[id]/reject/route.ts` — mark rejected
- `app/api/social-listening/replies/[id]/edit/route.ts` — update draft_text
- `components/admin/social-listening/review-card.tsx` — card hiển thị post + draft
- `components/admin/social-listening/fanpage-status-badge.tsx`
- `components/admin/social-listening/mcp-sources-list.tsx` — show knowledge chunks
- `components/admin/social-listening/qr-login-modal.tsx`
- `lib/social-listening/worker-client.ts` — HTTP client gọi worker
- `lib/social-listening/use-review-queue.ts` — Zustand store + Supabase Realtime

**Modify:**
- `web/components/admin/AdminSidebar.tsx` — thêm group "Social Listening"

## UI Flows

### Add Fanpage
1. Admin bấm "Thêm Fanpage" → gọi `POST /api/social-listening/pages` với `{label}`.
2. API → worker `POST /worker/login/start` → worker mở browser headful trên MiniPC → trả QR code URL (screenshot base64).
3. Modal hiển thị QR. Poll `/api/.../login-status/[id]` mỗi 2s.
4. User quét qua FB mobile → worker detect login → save cookie → status=ONLINE.
5. Modal đóng, danh sách refresh.

**Fallback nếu không có GUI trên MiniPC:** admin login trên laptop dev qua 1 CLI tool `worker/scripts/login-helper.ts` → cookie xuất ra file → admin upload file qua UI.

### Review Queue (core UX)
- Left panel: danh sách post NEW/REPLY_DRAFTED sort by `urgency DESC, scraped_at DESC`.
- Main panel: selected post
  - Post content + ảnh + link FB gốc
  - Classification badges: topic, urgency, intent
  - Draft reply (textarea editable)
  - MCP sources collapsed: titles + score, click expand xem content
  - Chọn fanpage để đăng (dropdown `fb_pages` ONLINE)
  - Buttons: `Approve & Post` (A), `Edit & Regenerate` (E), `Reject` (R), `Skip` (S)
- Right panel: keyboard hint + stats hôm nay

### Sources Management
- Table: type, url, keywords, enabled, last_scraped_at
- Add: form nhập URL nhóm/page + keywords + label
- Toggle enable per row; delete confirm

### Dashboard
- Cards: posts scraped 24h, drafts pending, replies posted, avg confidence
- Chart: line chart posts/day 30d
- Top sources by volume
- Recent crisis flags (red badge)

## Worker HTTP API (worker expose localhost:4100)

| Method | Path | Body | Description |
|---|---|---|---|
| POST | /worker/login/start | `{label}` | Khởi QR login, trả `{loginId, qrUrl}` |
| GET | /worker/login/:id/status | — | `{status: PENDING\|ONLINE\|ERROR, pageId?}` |
| POST | /worker/reply/post | `{replyId}` | Đăng reply lên FB, cập nhật `fb_replies.status=POSTED` |
| POST | /worker/page/:id/health | — | Test session còn sống |

Auth giữa web và worker: `X-Worker-Key` shared secret trong env.

## Implementation Steps

1. Thêm sidebar group "Social Listening" với icon `Radio` hoặc `Eye`.
2. Tạo route + layout cho `/admin/social-listening`.
3. Build dashboard page (đơn giản, Supabase query).
4. Build sources CRUD (basic form + table).
5. Build review queue với Supabase Realtime subscription.
6. Build fanpage list + QR login modal.
7. Viết worker HTTP endpoints (tiếp nối Phase 02).
8. Wire keyboard shortcuts.
9. Test end-to-end: scrape → draft → approve → post.

## Success Criteria

- [ ] Admin đăng nhập 2 fanpage thành công, cookie lưu mã hóa.
- [ ] Review queue load < 1s, Realtime update khi draft mới vào.
- [ ] Approve 1 reply → comment xuất hiện trên FB dưới tên fanpage đã chọn.
- [ ] Keyboard shortcut A/R/E hoạt động.
- [ ] Crisis post hiển thị banner đỏ bên trên list.

## Risks

- **Worker không reachable từ web (firewall)** — worker chạy cùng MiniPC với Supabase-edge-function proxy, hoặc web → worker qua internal network.
- **QR code expire trong 90s** — cho phép refresh QR trong modal.
- **Admin click Approve nhưng worker không đăng được (cookie expired)** — rollback `fb_replies.status` về DRAFT + show error toast + trigger re-login.

## Next

Phase 05 deploy worker + monitoring.
