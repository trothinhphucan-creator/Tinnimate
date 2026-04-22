# Plan: Facebook Social Listening & Auto-Reply — Tinni AI

**Created:** 2026-04-21
**Owner:** TinniMate admin dashboard
**Goal:** Tinni AI chatbot quét các nhóm/bài viết về ù tai trên Facebook, sinh trả lời bằng cách truy vấn MCP kiến thức thính học của AgentSee, hỗ trợ nhiều fanpage, người vận hành duyệt trước khi đăng.

---

## Strategic Decisions

| Quyết định | Lý do |
|---|---|
| **Semi-automation (draft → review → post)** | FB ToS cấm auto-posting thuần. Human-in-the-loop giảm rủi ro ban & tăng chất lượng thương hiệu. |
| **Playwright + stealth (không dùng Graph API cho group scan)** | Graph API không truy cập nhóm công khai bên ngoài; stealth browser bắt chước người dùng thật. |
| **Reuse AgentSee Vector MCP HTTP** (`dashboard.vuinghe.com/api/mcp/vector/*`) | Đã live, auth bằng `X-Internal-Key`. Không duplicate knowledge base. |
| **Gemini 2.5 Flash cho phân loại + sinh reply** | $0.075/1M input — rẻ nhất trong nhóm vision-capable. Chất lượng VN đủ tốt. |
| **Supabase cho state** (no Prisma) | Web TinniMate đã dùng Supabase SSR auth — giữ một DB duy nhất. |
| **Worker chạy trên MiniPC Ubuntu** | Cùng máy với AgentSee MCP → latency thấp, không tốn băng thông. |
| **Multi-fanpage qua session cookie lưu mã hóa** | Mô phỏng pattern `ZaloAccount` của AgentSee: label + sessionPath + status. |

---

## Architecture

```
┌─────────────────────────┐      ┌──────────────────────────┐
│ TinniMate Admin (web)   │ ───► │ Supabase                 │
│ /admin/social-listening │      │  fb_pages, fb_posts,     │
└─────────────────────────┘      │  fb_replies, fb_sessions │
           │                     └──────────────────────────┘
           │ REST                          ▲
           ▼                               │
┌─────────────────────────┐                │
│ Worker (MiniPC Ubuntu)  │ ───────────────┘
│  ┌──────────────────┐   │
│  │ Playwright+stealth│   │  scrape groups/posts
│  │ BullMQ + Redis   │   │  queue jobs
│  │ Gemini 2.5 Flash │   │  classify + draft reply
│  └──────────────────┘   │
└────────┬────────────────┘
         │ HTTP (X-Internal-Key)
         ▼
┌─────────────────────────┐
│ AgentSee Vector MCP     │  (LIVE)
│ search_knowledge        │
└─────────────────────────┘
```

---

## Phases

| # | Phase | Status | File |
|---|---|---|---|
| 1 | Supabase schema + MCP client + env | ✅ DONE | [phase-01-schema-mcp-client.md](phase-01-schema-mcp-client.md) |
| 2 | Playwright scraper worker (multi-fanpage) | ✅ DONE | [phase-02-scraper-worker.md](phase-02-scraper-worker.md) |
| 3 | Gemini classification + reply drafting | ✅ DONE | [phase-03-gemini-pipeline.md](phase-03-gemini-pipeline.md) |
| 4 | Admin UI — fanpages, review queue, analytics | ✅ DONE | [phase-04-admin-ui-review-queue.md](phase-04-admin-ui-review-queue.md) |
| 5 | Deploy worker + systemd + monitoring | ✅ DONE | [phase-05-minipc-deployment-monitoring.md](phase-05-minipc-deployment-monitoring.md) |

## Dependencies

- AgentSee Vector MCP HTTP server online (đã live)
- MiniPC Ubuntu host (đã chạy AgentSee + Postgres)
- Redis on MiniPC (cần cài mới nếu chưa có)
- Supabase project của TinniMate (đã live)
- Gemini API key (có trong env hiện tại)
- Facebook page accounts (người dùng tự đăng nhập qua QR/headful flow)

## Unresolved Questions

- Có chạy scrape 24/7 hay theo lịch (vd 3 lần/ngày)? → khuyến nghị lịch để giảm rủi ro flag
- Reply policy: luôn require human approval, hay auto-post với confidence ≥ 0.9?
- Có cần viết được post gốc (không chỉ comment) hay chỉ comment/reply?
- Rotate proxy VN: dùng VPS tự host hay Bright Data?
