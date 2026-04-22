# Phase 02 — Playwright Scraper Worker (Multi-Fanpage)

**Priority:** P0
**Status:** ✅ DONE — 2026-04-21
**Estimate:** 2 days
**Depends on:** Phase 01

## Goal

Worker Node.js trên MiniPC:
1. Đọc danh sách `fb_pages` (fanpage đang online) từ Supabase.
2. Cho mỗi `fb_target_sources` enabled → queue scrape job với BullMQ.
3. Worker consume job → mở Playwright + stealth → load session cookie của page → scrape posts/comments → upsert vào `fb_posts`.
4. Rotate page accounts để phân tải + giảm rủi ro rate-limit.

## Key Insights

- **Headful login, headless scrape**: FB login bằng QR/headful 1 lần → lưu cookie → scrape về sau headless.
- **Stealth plugin**: `playwright-extra` + `puppeteer-extra-plugin-stealth` che WebDriver signals.
- **Rate limiting**: tối đa 5 req/phút/page + random delay 3-8s giữa scroll, nghỉ 30-60s mỗi 20 posts.
- **Session rotation**: xoay vòng `fb_pages` ONLINE theo round-robin.
- **Không dùng Graph API** cho group scan (Graph API không trả bài viết nhóm bên ngoài).

## Related Files

**Create trong `worker/`:**
- `src/browser/launch-stealth-browser.ts` — khởi tạo browser với stealth
- `src/browser/facebook-login-qr.ts` — login QR flow cho lần đầu (expose qua HTTP cho admin UI gọi)
- `src/browser/facebook-session-manager.ts` — load/save cookie, check expiry
- `src/scraper/scrape-group-posts.ts` — scroll group, extract posts
- `src/scraper/scrape-keyword-search.ts` — tìm "ù tai" trong search
- `src/scraper/extract-post-fields.ts` — parse DOM → {author, content, images, ts}
- `src/queue/bullmq-config.ts` — Redis connection + queue names
- `src/queue/scrape-producer.ts` — cron đẩy job mỗi N phút
- `src/queue/scrape-consumer.ts` — worker consume + execute
- `src/db/supabase-worker-client.ts` — service_role client
- `src/db/fb-posts-upsert.ts` — dedupe theo fb_post_id
- `src/index.ts` — entrypoint khởi chạy producer + consumer
- `systemd/tinnimate-fb-worker.service` — systemd unit

**Modify:** none (worker tự chứa)

## Implementation Steps

1. **Login flow**:
   - Admin UI gọi `POST /worker/login/start` → worker mở Chromium headful → đi tới facebook.com/login.
   - User quét QR hoặc nhập credentials. Worker poll cho đến khi URL đổi sang feed.
   - Lưu cookie qua `context.storageState()` → mã hóa → upsert vào `fb_pages.session_cookie_enc`.

2. **Session manager**:
   - Mỗi scrape job nhận `pageId`, load cookie từ DB, decrypt, tạo `context` với `storageState`.
   - Check session validity: vào facebook.com, nếu redirect về login → mark `LOGGED_OUT`, gửi webhook admin.

3. **Scrape group**:
   ```ts
   async function scrapeGroup(url: string, keywords: string[]) {
     await page.goto(url);
     await page.waitForSelector('[role="feed"]');
     const seen = new Set<string>();
     let scrolls = 0;
     while (scrolls < 15 && seen.size < 50) {
       const posts = await extractPostsOnPage(page);
       for (const p of posts) if (matchesKeywords(p.content, keywords)) seen.add(p);
       await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.8));
       await page.waitForTimeout(3000 + Math.random() * 5000);
       scrolls++;
     }
     return [...seen];
   }
   ```

4. **DOM extraction** (FB thay selector liên tục, dùng heuristic):
   - Post container: `div[role="article"]`
   - Author: `h3 a, strong a` trong article
   - Content: `div[data-ad-preview="message"], div[data-ad-comet-preview="message"]`
   - Image: `img[src*="scontent"]` có `height > 100`
   - Post ID: parse từ href `/permalink/ID` hoặc `/posts/ID`

5. **BullMQ setup**:
   - Queue name: `fb-scrape`
   - Job data: `{ sourceId, pageId }`
   - Producer cron: `*/30 * * * *` (30 phút 1 lần, configurable)
   - Concurrency: 1 (FB không thích parallel)
   - Backoff: exponential on failure

6. **Dedupe**: upsert `fb_posts` dùng `ON CONFLICT (fb_post_id) DO NOTHING`.

7. **systemd service**: auto-restart, journal logs, env file loading.

## Success Criteria

- [ ] Login headful trên MiniPC qua VNC/x11 forwarding OK, cookie lưu mã hóa.
- [ ] Scrape 1 nhóm test trả về ≥ 5 posts mới.
- [ ] BullMQ job retry 3 lần khi fail, log vào `fb_scrape_jobs`.
- [ ] Không trigger captcha hay ban trong 24h vận hành.
- [ ] Memory worker < 500MB sau 1 ngày (no leak).

## Risks

- **FB captcha/ban** — mitigation: delay randomize, ≤ 3 page accounts, không scrape > 100 posts/page/ngày.
- **DOM selectors đổi** — mitigation: 2 fallback selector chains cho mỗi trường; health check chạy selector vs trang thật mỗi tuần.
- **MiniPC không có GUI cho login headful** — fallback: SSH tunnel `-X` hoặc chạy login tạm trên laptop dev, copy cookie vào prod.

## Next

Phase 03 tiêu thụ `fb_posts` → gọi Gemini + MCP → tạo draft.
