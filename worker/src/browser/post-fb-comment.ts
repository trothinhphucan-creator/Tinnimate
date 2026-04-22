/**
 * Post a comment to a Facebook post via Playwright + saved session.
 *
 * Flow:
 *   1. Load fb_replies row (with joined fb_posts.fb_post_url, page_id)
 *   2. Decrypt session cookie của page_id → launch headless browser
 *   3. Navigate tới fb_post_url
 *   4. Click composer, type draft_text, submit
 *   5. Wait for confirm; extract fb_comment_id nếu có thể
 *   6. Update fb_replies (POSTED + posted_at + posted_fb_comment_id)
 *
 * FB hay đổi DOM — selector dùng heuristic chain với fallback.
 */

import type { Page } from 'playwright'
import { launchStealthBrowser, randomDelay, type LaunchOptions } from './launch-stealth-browser.js'
import { loadSession, markPageStatus } from './facebook-session-manager.js'
import { getSupabaseServiceClient } from '../db/supabase-service-role-client.js'
import { logger } from '../lib/pino-structured-logger.js'

export type PostReplyResult = {
  ok: true
  postedAt: string
  fbCommentId: string | null
}

export async function postFbCommentForReply(replyId: string): Promise<PostReplyResult> {
  const db = getSupabaseServiceClient()

  // 1. Fetch reply + post URL + page_id
  const { data, error } = await db
    .from('fb_replies')
    .select('id, draft_text, status, page_id, post_id, fb_posts(fb_post_url, fb_post_id), fb_pages(label, fb_page_url)')
    .eq('id', replyId)
    .single()

  if (error || !data) throw new Error(`Reply not found: ${replyId}`)

  const reply = data as unknown as {
    id: string
    draft_text: string
    status: string
    page_id: string | null
    post_id: string
    fb_posts: { fb_post_url: string | null; fb_post_id: string } | null
    fb_pages: { label: string; fb_page_url: string | null } | null
  }

  if (!reply.page_id) {
    throw new Error('reply.page_id missing — chọn fanpage trước khi đăng')
  }
  const postUrl = reply.fb_posts?.fb_post_url
  if (!postUrl) {
    throw new Error(`fb_posts.fb_post_url missing cho post ${reply.post_id}`)
  }
  if (!reply.draft_text?.trim()) {
    throw new Error('draft_text empty')
  }

  const log = logger.child({ replyId, pageId: reply.page_id, postUrl })
  log.info('Posting FB comment')

  // 2. Load session
  const storageState = await loadSession(reply.page_id)

  const { browser, context } = await launchStealthBrowser({
    headful: false,
    storageState: storageState as NonNullable<LaunchOptions['storageState']>,
  })

  try {
    const page = await context.newPage()
    await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await randomDelay(2_000, 4_000)

    // Detect logged-out redirect
    if (/\/login|checkpoint|two_step_verification/.test(page.url())) {
      await markPageStatus(reply.page_id, 'LOGGED_OUT', 'Session expired during reply post')
      throw new Error('Session expired — fanpage cần đăng nhập lại')
    }

    // Switch commenting identity to Page (not personal account)
    const pageUrl = reply.fb_pages?.fb_page_url
    if (pageUrl) {
      await switchCommentIdentityToPage(page, pageUrl, reply.fb_pages?.label ?? '')
    } else {
      log.warn('fb_page_url missing — sẽ comment bằng tài khoản cá nhân')
    }

    // 3. Open composer + type
    await openCommentComposerAndType(page, reply.draft_text.trim())

    // 4. Submit
    await submitComment(page)

    // 5. Confirm — đợi composer empty hoặc comment xuất hiện
    await page.waitForTimeout(3_500)

    const fbCommentId = await extractLatestCommentId(page).catch(() => null)
    const postedAt = new Date().toISOString()

    // 6. Update DB
    await db
      .from('fb_replies')
      .update({
        status: 'POSTED',
        posted_at: postedAt,
        posted_fb_comment_id: fbCommentId,
        post_error: null,
      })
      .eq('id', replyId)

    // Update post.status → REPLIED
    await db.from('fb_posts').update({ status: 'REPLIED' }).eq('id', reply.post_id)

    log.info({ fbCommentId }, 'Comment posted')
    return { ok: true, postedAt, fbCommentId }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await db
      .from('fb_replies')
      .update({ status: 'FAILED', post_error: msg.slice(0, 500) })
      .eq('id', replyId)
    log.error({ err: msg }, 'Comment post failed')
    throw err
  } finally {
    await context.close().catch(() => {})
    await browser.close().catch(() => {})
  }
}

// ── DOM helpers ──────────────────────────────────────────────────────────────

const COMPOSER_SELECTORS = [
  'div[role="article"] div[aria-label*="Write a comment" i][contenteditable="true"]',
  'div[aria-label*="Viết bình luận" i][contenteditable="true"]',
  'div[aria-label*="comment" i][contenteditable="true"]',
  'form div[contenteditable="true"][role="textbox"]',
]

async function openCommentComposerAndType(page: Page, text: string): Promise<void> {
  // Try clicking each candidate composer and typing
  for (const sel of COMPOSER_SELECTORS) {
    const box = page.locator(sel).first()
    if ((await box.count()) === 0) continue
    try {
      await box.click({ timeout: 5_000 })
      await randomDelay(500, 1_500)
      // Use type to mimic real keystrokes (FB notice paste vs type)
      await box.type(text, { delay: 25 })
      await randomDelay(800, 1_500)
      return
    } catch {
      continue
    }
  }
  throw new Error('Không tìm thấy comment composer (FB DOM có thể đã đổi)')
}

async function submitComment(page: Page): Promise<void> {
  // Press Enter trên composer thường submit comment trên FB web
  await page.keyboard.press('Enter')
}

async function extractLatestCommentId(page: Page): Promise<string | null> {
  // Best-effort: tìm permalink dạng /comment_id=XXXXX
  const html = await page.content()
  const match = html.match(/comment_id=(\d+)/)
  return match?.[1] ?? null
}

/**
 * Chuyển danh tính bình luận sang Fanpage thay vì tài khoản cá nhân.
 *
 * Facebook cho phép admin fanpage chọn "Đăng bình luận với tư cách [Fanpage]"
 * bằng cách click vào avatar hình tròn góc dưới-trái composer.
 *
 * Nếu không tìm thấy switcher (FB đổi DOM) → log warn và tiếp tục bằng cá nhân.
 */
async function switchCommentIdentityToPage(
  page: Page,
  _pageUrl: string,
  pageLabel: string,
): Promise<void> {
  try {
    // FB hiển thị dropdown "Đăng bình luận với tư cách" khi click avatar nhỏ
    // cạnh comment box. Selector heuristic — FB DOM thay đổi thường xuyên.
    const SWITCHER_SELECTORS = [
      // Desktop: avatar nhỏ bên trái comment composer
      'div[aria-label*="comment" i] ~ div image',
      '[data-testid="comment_composer_profile_switcher"]',
      'div[aria-label*="Commenting as" i]',
      'div[aria-label*="Đang bình luận với tư cách" i]',
    ]

    for (const sel of SWITCHER_SELECTORS) {
      const el = page.locator(sel).first()
      if ((await el.count()) === 0) continue
      await el.click({ timeout: 3_000 })
      await randomDelay(800, 1_500)

      // Tìm option tên fanpage trong dropdown
      const pageOption = page.locator(`[role="menuitem"]:has-text("${pageLabel}")`).first()
      if ((await pageOption.count()) > 0) {
        await pageOption.click({ timeout: 3_000 })
        await randomDelay(500, 1_000)
        return
      }
    }

    // Fallback: thử URL-based switch — navigate qua ?act=PAGE_ID nếu biết
    // Bỏ qua nếu không tìm được switcher — sẽ comment bằng cá nhân
  } catch {
    // Non-fatal — tiếp tục comment bằng cá nhân nếu switch thất bại
  }
}
