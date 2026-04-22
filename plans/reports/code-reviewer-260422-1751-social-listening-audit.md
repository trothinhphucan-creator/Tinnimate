# Social Listening Audit — 2026-04-22

## Critical Issues (blocking)

### C1. `login-status` route — no auth guard
**File:** `web/app/api/social-listening/pages/[id]/login-status/route.ts:5`
**Issue:** `GET /api/social-listening/pages/[id]/login-status` has NO `requireAdmin()` call. Any unauthenticated request can poll login sessions. The login session object contains FB credentials metadata, logs, and real-time instruction strings.
**Fix:** Add `const guard = await requireAdmin(); if (guard) return guard` before the `loginId` check.

### C2. `login-screenshot` route — no auth guard
**File:** `web/app/api/social-listening/pages/[id]/login-screenshot/route.ts:8`
**Issue:** `GET /api/social-listening/pages/[id]/login-screenshot` has NO `requireAdmin()` call. Any unauthenticated request can retrieve live PNG screenshots of the Facebook login browser, potentially exposing credentials being typed.
**Fix:** Add `requireAdmin()` guard. This is a critical data leak vector.

### C3. Double-post race condition on approve
**File:** `web/app/api/social-listening/replies/[id]/approve/route.ts:26-51`
**Issue:** The route optimistically locks via `status = DRAFT → APPROVED`, then calls `workerClient.postReply(id)`, then sets `status = POSTED`. However, `workerClient.postReply()` also calls `db.from('fb_replies').update({ status: 'POSTED' })` internally (`post-fb-comment.ts:126`). On success there are two DB writes to POSTED. More critically: if the web route rollbacks to DRAFT on failure (`line 46`), but the worker already posted and set POSTED, the rollback overwrites POSTED with DRAFT, creating a false "needs review again" state. The DB state is inconsistent.
**Fix:** Remove the redundant `update({ status: 'POSTED' })` in the web approve route — trust the worker's own status update. The rollback-to-DRAFT on worker failure is the correct path; the success path should NOT re-update status.

### C4. Graceful shutdown doesn't drain queues
**File:** `worker/src/index.ts:234-239`
**Issue:** SIGTERM/SIGINT handler calls `process.exit(0)` immediately. BullMQ workers may have in-flight scrape/analyze jobs that are mid-Playwright session. Abrupt exit leaves `fb_scrape_jobs` rows with `status='RUNNING'` forever (stuck jobs), and can corrupt Playwright browser temp directories.
**Fix:**
```typescript
const shutdown = async (signal: string) => {
  logger.info({ signal }, 'Graceful shutdown initiated')
  await Promise.all([scrapeWorker.close(), analyzeWorker.close(), commentWorker.close()])
  process.exit(0)
}
```
Store worker references and close them before exit.

---

## High Issues (fix soon)

### H1. Telegram env vars read at module load from `process.env` — bypass schema validation
**File:** `worker/src/monitoring/alert-webhook.ts:14-15`
**Issue:** `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are read directly from `process.env` at module-load time, bypassing the Zod schema in `environment-schema.ts`. These are also defined in the schema as optional (`ALERT_TELEGRAM_BOT_TOKEN` / `ALERT_TELEGRAM_CHAT_ID`) but the webhook reads different names (`TELEGRAM_BOT_TOKEN` vs `ALERT_TELEGRAM_BOT_TOKEN`). Config is split — two sources of truth.
**Fix:** Replace `process.env.TELEGRAM_BOT_TOKEN` with `env.ALERT_TELEGRAM_BOT_TOKEN`, same for chat ID.

### H2. `scan-joined-groups.ts` applies StealthPlugin again after it was already applied globally
**File:** `worker/src/browser/scan-joined-groups.ts:53`
**Issue:** `chromium.use(StealthPlugin())` is called inside `scanJoinedGroups()` on every call. The stealth plugin is already applied once in `launch-stealth-browser.ts:17` at module load. Calling `.use()` multiple times registers duplicate plugins.
**Fix:** Remove `chromium.use(StealthPlugin())` from `scan-joined-groups.ts`. Use `launchStealthBrowser()` instead of launching a raw `chromium` directly, which also ensures consistent UA/geolocation/locale settings.

### H3. `scan-joined-groups.ts` hardcodes `headless: false` in production
**File:** `worker/src/browser/scan-joined-groups.ts:55`
**Issue:** `headless: false` is hardcoded. On a headless server without `DISPLAY`, this will crash. The comment says "Show browser so user can see it working" — this is debug/dev intent left in production code.
**Fix:** Use `headful: !!process.env.DISPLAY` or respect an env variable, consistent with `launch-stealth-browser.ts`.

### H4. Periodic monitor sends repeated LOGGED_OUT alerts every 5 minutes
**File:** `worker/src/monitoring/alert-webhook.ts:91-104`
**Issue:** Every 5-minute check queries ALL `status='LOGGED_OUT'` pages and fires a Telegram alert for each. No deduplication / throttle — if a page stays LOGGED_OUT for hours, it fires 12+ alerts/hour per page. Telegram rate limit will be hit.
**Fix:** Track last-alerted timestamp per pageId in memory. Only re-alert after ≥1 hour since last alert for that page.

### H5. `fb-replies` insert in `classify-comment-job.ts` uses wrong field name `source_id`
**File:** `worker/src/pipeline/classify-comment-job.ts:163`
**Issue:** The `fb_replies` insert includes `source_id: sourceId` but `FbReplyRow` type definition (and likely the DB schema) has no `source_id` column — the column is `post_id` and `page_id`. Checking `analyze-post-job.ts:173` (the reference insert), there is no `source_id` either. This will silently fail insert or generate a PostgREST error if the column doesn't exist.
**Fix:** Remove `source_id: sourceId` from the insert in `classify-comment-job.ts:163`. The `page_id` is the correct foreign key.

### H6. `requireAdmin` uses ANON key + reads `user_metadata.role` — writable by users
**File:** `web/lib/social-listening/require-admin.ts:23-29`
**Issue:** Checks `user.user_metadata?.role` first, falling back to `app_metadata.role`. `user_metadata` is user-writable in Supabase by default, meaning a normal user can set their own `user_metadata.role = "admin"` via the Supabase client SDK and bypass the guard.
**Fix:** Only check `app_metadata.role` (server-set, not user-writable): `const role = user.app_metadata?.role as string | undefined`. Remove the `user_metadata` fallback.

### H7. Worker HTTP server `page/:id/health` — no auth + `id` not validated
**File:** `worker/src/index.ts:176-186`
**Issue:** While all `/worker/*` routes are protected by `X-Worker-Key`, the code at line 176 doesn't validate `id` format before querying the database with it. An injected non-UUID string could cause DB errors. Minor since auth protects this, but defensive coding requires validation.
**Fix:** Add UUID validation before DB query.

### H8. `post-fb-comment.ts` — `submitComment` uses `keyboard.press('Enter')` with no confirmation wait
**File:** `worker/src/browser/post-fb-comment.ts:228-230`
**Issue:** `submitComment()` just presses Enter. On FB, Enter behavior varies — in some contexts it's a line break, not submit. Then `waitForTimeout(3500)` is used as confirmation (line 117). If the comment was not actually posted, the code still marks `status='POSTED'` in DB. No verification that comment appeared.
**Severity:** Data integrity — false positive POSTED status.
**Fix:** Add a check that the composer cleared (becomes empty) or that a new comment appears after submission. Fallback: try clicking the submit/post button via selector chain.

### H9. `classifyPostRelevance` — image URLs passed but never used
**File:** `worker/src/ai/classify-post-relevance.ts:26`
**Issue:** `imageUrls: string[] = []` parameter is accepted but never passed to Gemini (only `content` is sent). The parameter is misleading and suggests vision analysis was intended but not wired.
**Severity:** Functionality gap — audiogram context not factored into relevance classification.
**Fix:** Either wire images into the Gemini call (inline data) or remove the `imageUrls` parameter to avoid false API contract.

---

## Medium Issues (tech debt)

### M1. Duplicate keyword list in `mcp-query-builder.ts`
**File:** `worker/src/pipeline/mcp-query-builder.ts:16`
**Issue:** `'ù tai'` appears twice in `TINNITUS_KEYWORDS` array (indices 0 and 1). Harmless but sloppy.
**Fix:** Remove duplicate.

### M2. `scrape-consumer.ts` — `scrapeCommentsForNewPosts` uses status='NEW' filter but posts may have been updated to 'ANALYZED' between upsert and comment scrape
**File:** `worker/src/queue/scrape-consumer.ts:180`
**Issue:** After `upsertFbPosts`, the consumer immediately queries `status='NEW'` posts for comment scraping. But `enqueueAnalyzeForNewPosts` (step 4) also queries `status='NEW'`. The analyze jobs run in parallel (concurrency=3) and may flip statuses before comment scrape. Posts could be missed.
**Severity:** Medium — comment scraping may silently skip posts.
**Fix:** Query by `source_id + scraped_at ≥ [job start time]` instead of relying on status.

### M3. `scan-joined-groups.ts` duplicates SKIP/NOISE constants already defined at module level
**File:** `worker/src/browser/scan-joined-groups.ts:144-146`
**Issue:** `SKIP`, `NOISE`, `SKIP_TEXT` are redefined as inline arrays inside the function, duplicating the `SKIP_SLUGS` and `NOTIFICATION_PATTERNS` constants at module level (lines 21-37). Same data defined twice.
**Fix:** Remove inline duplicates, pass module-level constants.

### M4. `queue/page.tsx` — keyboard shortcut handler uses stale closure on `replies`/`activeId`
**File:** `web/app/(admin)/admin/social-listening/queue/page.tsx:287-300`
**Issue:** The keyboard event handler is registered in the `useEffect` with `[loadReplies, replies, activeId, supabase]` deps, but the element IDs `btn-approve-${activeId}` / `btn-reject-${activeId}` don't exist in the DOM (no matching `id=` attributes on the buttons). The keyboard shortcut handler will silently fail.
**Fix:** Use `handleAction(activeId, 'approve')` directly instead of `document.getElementById()?.click()`.

### M5. `queue/page.tsx` + `comments/page.tsx` — approve flow calls `/reject` endpoint to save edits
**File:** `web/app/(admin)/admin/social-listening/queue/page.tsx:80-85` and `314-320`
**Issue:** When approving with an edit, the code calls `PATCH /api/social-listening/replies/${id}/reject` to save the draft text. Using the "reject" route to save edits is a semantic anti-pattern — if the PATCH call fails silently (no error check in `ReviewCard.handleAction`), the old draft is posted.
**Fix:** Add a dedicated `PATCH /api/social-listening/replies/[id]/edit` endpoint (or reuse the existing PATCH handler in `reject/route.ts`) and reference it clearly.

### M6. `sources/route.ts` PATCH — `id` not validated as UUID
**File:** `web/app/api/social-listening/sources/route.ts:61`
**Issue:** PATCH reads `id` from request body with no UUID validation. Malformed IDs pass through to the DB.
**Fix:** Add `isValidUUID(id)` check.

### M7. `sources/route.ts` DELETE — `id` from query param not validated as UUID
**File:** `web/app/api/social-listening/sources/route.ts:81`
**Issue:** `id` from `searchParams.get('id')` is not validated as UUID.
**Fix:** Add `isValidUUID(id)` check.

### M8. `scan-joined-groups.ts` — no timeout guard on browser launch/scan
**File:** `worker/src/browser/scan-joined-groups.ts:54-207`
**Issue:** The entire scan operation (18 scroll passes × 600ms + page navigations + 2 switch waits) can take 15-30+ seconds with no overall timeout. The HTTP endpoint at `GET /worker/groups/scan` will hold open the connection. Admin UI may hang indefinitely if the browser crashes or stalls.
**Fix:** Wrap the scan in `Promise.race([scanOperation(), timeout(120_000)])`.

### M9. `post-fb-comment.ts` — `switchCommentIdentityToPage` silently continues on failure
**File:** `worker/src/browser/post-fb-comment.ts:247-283`
**Issue:** If identity switching to fanpage fails, the code silently falls back to posting as personal account. This means comments may be posted from a personal FB account rather than the fanpage — a significant brand/compliance issue — with only a `warn` log.
**Severity:** Business logic flaw, not just tech debt.
**Fix:** At minimum, expose `postedAsPage: boolean` in the result, and surface this in the DB (`fb_replies.posted_as_page`). Consider blocking the post if page identity can't be confirmed.

### M10. `gemini-client.ts` — token cost calculation accumulates in process memory, resets on restart
**File:** `worker/src/ai/gemini-client.ts:27`
**Issue:** `geminiUsage` counter is in-process memory only. Worker restarts (deploys, crashes) reset the counter. The `/health` and `/metrics` endpoints expose stale zeros after restart. For cost tracking, this is unreliable.
**Fix:** Persist counters to Redis (incr) or Supabase (daily aggregate row).

### M11. `classify-post-relevance.ts` — `imageUrls` parameter silently ignored (see H9)
Already noted in H9.

### M12. `history/route.ts` — hardcoded `.neq('status', 'DRAFT')` for 'ALL' filter
**File:** `web/app/api/social-listening/history/route.ts:34`
**Issue:** "ALL" filter excludes DRAFT items (by design per comment). But the `ReplyHistory` type in the UI includes `DRAFT` as a valid status. Users cannot see DRAFT items in history even with "ALL" selected. This may be intentional (separate review queue), but is undocumented and confusing.
**Severity:** Low-medium UX gap. Document or add a DRAFT filter option.

---

## Low / Informational

### L1. `worker/src/index.ts:60` — duplicate comment label `// 4.`
Two consecutive sections are labeled `// 4.` (periodic monitor and HTTP server).

### L2. `fb-replies` approve route — inline UUID regex duplicates `validate-id.ts`
**File:** `web/app/api/social-listening/replies/[id]/approve/route.ts:19`
Inline `UUID_RE` rather than importing from `validate-id.ts`.
**Fix:** `import { isValidUUID, invalidId } from '@/lib/social-listening/validate-id'`.

### L3. `worker-client.ts` — `loginScreenshotUrl()` returns a worker URL that includes the Worker Key in the caller's context
**File:** `web/lib/social-listening/worker-client.ts:57-58`
**Issue:** This helper is documented "Returns absolute URL — admin UI sẽ proxy qua /api" but the URL it returns goes directly to the worker (bypassing auth proxy). If the returned URL is ever used directly in browser `<img src>`, it will fail because the browser can't send the `X-Worker-Key` header.
**Severity:** Already using the proxy correctly in the UI, but the helper method is misleading. Remove or clearly mark as internal only.

### L4. `social-listening/page.tsx` dashboard — directly creates Supabase client with SERVICE_ROLE_KEY
**File:** `web/app/(admin)/admin/social-listening/page.tsx:11`
**Issue:** Uses `SUPABASE_SERVICE_ROLE_KEY` directly in a server component. This is fine as it's server-side only. However, it bypasses the admin middleware chain (`requireAdmin`) and relies solely on the `(admin)` route group layout for protection. If the layout middleware is ever loosened, this page leaks aggregate data.
**Recommendation:** Use `requireAdmin()` at the top of `getStats()` for defense-in-depth.

### L5. `scan-joined-groups.ts:53` — `executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH` may be undefined
Not validated in env schema. If set to a non-existent path, Playwright throws a cryptic error. Add to env schema or remove the option.

### L6. `fb-comments-upsert.ts` — stagger delay is `Math.random() * 5000` (up to 5s per comment job batch)
Minor: the random stagger only applies per classify-job enqueue, not per-comment-scrape delay. This is fine but the 5s max may cause unnecessary BullMQ queue latency spikes with large comment batches.

### L7. `extractPostsFromPage` timestamp `aria-label` selector hardcodes years 2024-2026
**File:** `worker/src/scraper/extract-post-fields.ts:146`
`[aria-label*="2024"], [aria-label*="2025"], [aria-label*="2026"]` — will silently stop matching in 2027.
**Fix:** Use a broader pattern or use `data-utime` + `title` attributes exclusively.

### L8. `classify-comment-job.ts` — `syntheticClassification.topic` hardcoded to `'tinnitus_symptom'`
**File:** `worker/src/pipeline/classify-comment-job.ts:141`
All comment replies will use `tinnitus_symptom` topic regardless of actual intent. This affects MCP query and reply prompt context.

### L9. Keyboard shortcut hints in queue UI reference button IDs that don't exist
Already noted in M4 — duplicate for emphasis.

### L10. `sources/page.tsx` — `toggleEnabled` and `handleDelete` don't check response status
**File:** `web/app/(admin)/admin/social-listening/sources/page.tsx:80-92`
Failed API calls are silently ignored, UI refreshes as if operation succeeded.
**Fix:** Add `if (!r.ok)` checks with user feedback.

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 4 |
| High | 9 |
| Medium | 12 |
| Low | 10 |
| **Total** | **35** |

**Scope:** 31 files reviewed across worker (22) and web (9 API routes + 9 UI pages + 4 lib files). ~2,400 LOC worker, ~1,800 LOC web.

**Most urgent fixes (in order):**
1. Add auth guards to `login-status` and `login-screenshot` routes (C1, C2) — potential credential exposure
2. Fix `requireAdmin` to use only `app_metadata.role` (H6) — admin bypass via user_metadata
3. Fix graceful shutdown to drain queues (C4) — stuck scrape jobs in production
4. Fix double-post race / status inconsistency on approve (C3) — data integrity
5. Fix Telegram env var mismatch (H1) — alerts silently never fire
6. Remove `headless: false` hardcode from scan-joined-groups (H3) — production crash risk

**Positive observations:**
- Env schema validation with Zod is thorough and well-structured
- AES-256-GCM session cookie encryption with proper IV/tag handling
- BullMQ job deduplication via stable `jobId` patterns
- Crisis detection with keyword matching + fixed empathetic reply is well-designed
- `requireAdmin` pattern is consistently applied to most routes
- Realtime Supabase subscriptions in UI pages are properly cleaned up
- Optimistic lock on approve (`eq('status', 'DRAFT')`) prevents double-approvals
- Screenshot polling with cancel-on-unmount avoids memory leaks in LoginModal
- Worker client properly proxies screenshots through Next.js (avoids CORS/key exposure)

---

## Unresolved Questions

1. Does `fb_replies` table have a `source_id` column? (H5 depends on this)
2. Is `FbJobStatus` missing `'SKIPPED'`? The UI references `SKIPPED` status but `supabase-service-role-client.ts:31` only defines `QUEUED | RUNNING | DONE | FAILED`.
3. What is the intended behavior when `page_id` is null on a reply draft? Currently `postFbCommentForReply` throws — but `insertReplyDraft` in `analyze-post-job.ts` can insert a null `page_id`. Is manual page assignment in the UI the expected flow?
4. Is there any rate-limiting on the worker HTTP API beyond the shared secret? If the secret leaks, all endpoints are exposed with no per-IP or per-minute limits.
5. `classifyPostRelevance` receives `imageUrls` but doesn't use them — was vision-assisted classification planned but deferred?
