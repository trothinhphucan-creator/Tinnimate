# Phase 01 — Supabase Schema + AgentSee MCP Client + Env

**Priority:** P0 (blocks all downstream phases)
**Status:** ⏳ PENDING
**Estimate:** 0.5 day

## Goal

Tạo schema lưu fanpage/post/reply, client gọi MCP vector của AgentSee, và nạp env cần thiết. Đây là nền tảng cho scraper và admin UI.

## Key Insights

- AgentSee MCP đã lộ HTTP endpoint với auth `X-Internal-Key` (xem `/home/haichu/projects/AgentSee/src/mcp/vector-http-server.ts:46-55`).
- Pattern `ZaloAccount` (schema.prisma:352) = template cho `fb_pages`: label + sessionPath + status enum.
- TinniMate dùng Supabase (không Prisma) → viết migration SQL trực tiếp.
- Session cookie FB phải mã hóa tại rest (AES-256 với key từ env).

## Supabase Tables

### `fb_pages` — fanpage/account Facebook đang đăng nhập
| column | type | note |
|---|---|---|
| id | uuid PK | |
| label | text | tên nhận biết, vd "PA Hearing Main" |
| fb_user_id | text | FB user ID sau login |
| session_cookie_enc | bytea | cookie mã hóa AES-256 |
| status | text | IDLE \| ONLINE \| ERROR \| LOGGED_OUT |
| last_active_at | timestamptz | |
| created_at / updated_at | timestamptz | |

### `fb_target_sources` — nhóm/page theo dõi
| column | type | note |
|---|---|---|
| id | uuid PK | |
| type | text | GROUP \| PAGE \| KEYWORD_SEARCH |
| fb_url | text | https://facebook.com/groups/... |
| label | text | "Nhóm ù tai VN" |
| keywords | text[] | filter: ù tai, tinnitus, ve kêu |
| enabled | bool | default true |
| last_scraped_at | timestamptz | |

### `fb_posts` — bài viết thu thập
| column | type | note |
|---|---|---|
| id | uuid PK | |
| source_id | uuid FK | → fb_target_sources |
| fb_post_id | text unique | FB's own ID |
| author_name | text | |
| content | text | |
| image_urls | text[] | cho vision |
| posted_at | timestamptz | |
| relevance_score | float | Gemini 0.0-1.0 |
| classification | jsonb | {topic, urgency, intent} |
| status | text | NEW \| ANALYZED \| REPLY_DRAFTED \| REPLIED \| SKIPPED |
| scraped_at | timestamptz | |

### `fb_replies` — bản nháp trả lời
| column | type | note |
|---|---|---|
| id | uuid PK | |
| post_id | uuid FK | → fb_posts |
| page_id | uuid FK | → fb_pages (reply từ fanpage nào) |
| draft_text | text | |
| mcp_sources | jsonb | [{title, score, source}] từ MCP |
| status | text | DRAFT \| APPROVED \| POSTED \| REJECTED |
| reviewer_id | uuid | → auth.users |
| reviewed_at | timestamptz | |
| posted_fb_comment_id | text | ID comment trên FB sau khi đăng |

### `fb_scrape_jobs` — audit/log jobs
| column | type | note |
|---|---|---|
| id | uuid PK | |
| source_id | uuid FK | |
| page_id | uuid FK | scrape dưới danh nghĩa page nào |
| status | text | QUEUED \| RUNNING \| DONE \| FAILED |
| posts_found | int | |
| error | text | |
| started_at / finished_at | timestamptz | |

RLS: chỉ role `service_role` & admin user (check qua `auth.users` metadata `role=admin`) được read/write.

## Related Files

**Create:**
- `web/lib/db/migrations/20260421_fb_scraper.sql` — Supabase migration
- `web/lib/agentsee-mcp-client.ts` — fetch wrapper quanh AgentSee vector MCP
- `worker/` — new top-level folder trong monorepo cho scraper worker
- `worker/package.json` — deps: playwright, playwright-extra, puppeteer-extra-plugin-stealth, bullmq, ioredis, @google/generative-ai, @supabase/supabase-js
- `worker/src/config/env.ts` — zod env schema

**Modify:**
- Root `.env.example` — thêm vars mới
- `web/.env.local` — AGENTSEE_MCP_URL, AGENTSEE_INTERNAL_KEY, FB_SESSION_ENC_KEY

## Env Variables

```
AGENTSEE_MCP_URL=https://dashboard.vuinghe.com
AGENTSEE_INTERNAL_KEY=<từ AgentSee .env>
FB_SESSION_ENC_KEY=<openssl rand -hex 32>
GEMINI_API_KEY=<existing>
REDIS_URL=redis://localhost:6379
WORKER_SUPABASE_URL=<existing>
WORKER_SUPABASE_SERVICE_KEY=<service_role key, server-only>
```

## Implementation Steps

1. Viết SQL migration cho 5 bảng trên + RLS policies.
2. Apply migration qua Supabase SQL editor hoặc `supabase db push` nếu có CLI.
3. Viết `web/lib/agentsee-mcp-client.ts`:
   ```ts
   export async function searchKnowledge(query: string, topK = 5) {
     const res = await fetch(`${process.env.AGENTSEE_MCP_URL}/api/mcp/vector/search_knowledge`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json', 'X-Internal-Key': process.env.AGENTSEE_INTERNAL_KEY! },
       body: JSON.stringify({ query, top_k: topK }),
     })
     if (!res.ok) throw new Error(`MCP ${res.status}`)
     return res.json() as Promise<{ results: Array<{ title: string; content: string; score: number; source: string }> }>
   }
   ```
4. Init worker workspace: `worker/package.json`, tsconfig, src/ folder.
5. Viết `worker/src/lib/crypto.ts`: AES-256-GCM encrypt/decrypt cho session cookie.
6. Smoke test: chạy script gọi `searchKnowledge("ù tai điều trị")` → xác minh trả về kết quả.

## Success Criteria

- [ ] 5 bảng tồn tại trong Supabase với RLS policies hoạt động.
- [ ] `web/lib/agentsee-mcp-client.ts` gọi MCP thành công (test script trả JSON results).
- [ ] Worker project build không lỗi (`npm run typecheck`).
- [ ] Session encryption/decryption round-trip hoạt động.

## Risks

- **AgentSee MCP ko accessible từ ngoài MiniPC** → fallback: worker chạy trên MiniPC gọi `http://localhost:<port>` trực tiếp, bypass Caddy.
- **Supabase RLS chặn worker** → worker dùng `service_role` key (bypass RLS). Không expose key ra client.

## Next

Phase 02 dùng schema này để queue scrape jobs.
