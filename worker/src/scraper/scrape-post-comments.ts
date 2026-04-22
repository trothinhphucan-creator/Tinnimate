/**
 * Scrape comments from a Facebook post URL.
 *
 * Strategy:
 * 1. Navigate to post URL (in existing authenticated context)
 * 2. Click "View all comments" if present
 * 3. Expand nested replies lightly
 * 4. Extract comments: fbCommentId, author, content, postedAt, parentId
 * 5. Upsert into fb_comments
 * 6. Return list of NEW comment IDs → enqueue classify jobs
 *
 * FB DOM notes (2025):
 * - Top-level comments: [data-testid="UFI2Comment/root_depth_0"] or aria-label "Comment"
 * - Each comment has a permalinked timestamp <a> with href containing /comment/
 * - comment_id extracted from that URL
 */

import type { BrowserContext } from 'playwright'
import { logger } from '../lib/pino-structured-logger.js'

export type ScrapedComment = {
  fbCommentId: string
  parentFbId: string | null
  authorName: string | null
  authorFbId: string | null
  content: string
  commentUrl: string | null
  postedAt: Date | null
}

export type ScrapeCommentsResult = {
  comments: ScrapedComment[]
  errorsEncountered: number
}

/**
 * Main function: scrape comments for a single post.
 * Context must already have valid FB session loaded.
 */
export async function scrapePostComments(
  context: BrowserContext,
  postUrl: string,
  opts: { maxComments?: number; sessionId?: string } = {},
): Promise<ScrapeCommentsResult> {
  const { maxComments = 100, sessionId = 'unknown' } = opts
  const log = logger.child({ fn: 'scrapePostComments', sessionId, postUrl: postUrl.slice(0, 80) })

  const page = await context.newPage()
  const errors: number[] = []

  try {
    log.info('Navigating to post for comment scraping')
    await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 40_000 })
    await page.waitForTimeout(3000)

    // Dismiss popups (cookies, notifications)
    for (const sel of [
      '[data-testid="cookie-policy-manage-dialog"] button',
      '[aria-label="Allow all cookies"]',
      '[aria-label="Decline optional cookies"]',
      '[aria-label="Đóng"]',
    ]) {
      try {
        const btn = page.locator(sel).first()
        if (await btn.count() > 0) { await btn.click(); await page.waitForTimeout(500) }
      } catch { /* ignore */ }
    }

    // ── Click "View all comments" to expand ──────────────────────────────────
    for (const sel of [
      'div[role="button"]:has-text("Xem tất cả")',
      'div[role="button"]:has-text("View all")',
      'div[role="button"]:has-text("comments")',
    ]) {
      try {
        const btn = page.locator(sel).first()
        if (await btn.count() > 0) {
          await btn.click()
          await page.waitForTimeout(2000)
          log.debug('Expanded all comments')
          break
        }
      } catch { /* ignore */ }
    }

    // ── Scroll to load more comments ─────────────────────────────────────────
    for (let i = 0; i < 8; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.7))
      await page.waitForTimeout(800)

      // Click "Xem thêm bình luận" / "Load more comments"
      try {
        const more = page.locator('div[role="button"]:has-text("Xem thêm bình luận"), div[role="button"]:has-text("Load more comments")').first()
        if (await more.count() > 0) { await more.click(); await page.waitForTimeout(1500) }
      } catch { /* ignore */ }
    }

    // ── Extract comments ──────────────────────────────────────────────────────
    const comments = await page.evaluate((max: number) => {
      const results: Array<{
        fbCommentId: string
        parentFbId: string | null
        authorName: string | null
        authorFbId: string | null
        content: string
        commentUrl: string | null
        postedAtStr: string | null
        isReply: boolean
      }> = []
      const seen = new Set<string>()

      // Find all comment containers using multiple selectors
      const commentEls = Array.from(document.querySelectorAll(
        '[data-testid*="Comment"], [aria-label*="bình luận"], [aria-label*="comment"],' +
        'div[role="article"]'
      ))

      for (const el of commentEls) {
        if (results.length >= max) break

        // Extract permalink timestamp <a> → contains comment ID
        const permalinkA = el.querySelector('a[href*="/comment/"], a[href*="comment_id="]')
        if (!permalinkA) continue

        const href = (permalinkA as HTMLAnchorElement).href

        // Extract comment ID from URL
        let fbCommentId: string | null = null
        const m1 = href.match(/\/comment\/(\d+)/)
        const m2 = href.match(/comment_id=(\d+)/)
        const m3 = href.match(/\?p=(\d+)/)  // some mobile URLs
        fbCommentId = m1?.[1] ?? m2?.[1] ?? m3?.[1] ?? null

        if (!fbCommentId || seen.has(fbCommentId)) continue
        seen.add(fbCommentId)

        // Extract author
        const authorA = el.querySelector('a[href*="/user/"], a[role="link"]') as HTMLAnchorElement | null
        const authorName = authorA?.textContent?.trim() ?? null
        const authorUrl = authorA?.href ?? ''
        const authorFbId = authorUrl.match(/\/(\d+)\/?($|\?)/)?.[1]
          ?? authorUrl.split('/').filter(Boolean).pop()
          ?? null

        // Extract content — look for text container
        const textEl = el.querySelector('[data-ad-comet-preview="message"], [data-testid="comment_text"], div[dir="auto"]')
        const content = textEl?.textContent?.trim() ?? el.textContent?.trim() ?? ''

        if (!content || content.length < 2) continue

        // Posted at from datetime attr
        const timeEl = el.querySelector('abbr[data-utime], time[datetime]')
        const postedAtStr = timeEl?.getAttribute('data-utime')
          ? new Date(Number(timeEl.getAttribute('data-utime')) * 1000).toISOString()
          : timeEl?.getAttribute('datetime') ?? null

        // Is this a reply (nested)? Check DOM depth
        const isReply = !!el.closest('[data-testid*="depth_1"], [data-testid*="depth_2"]')
          || el.querySelectorAll('[data-testid*="Comment"]').length > 0

        results.push({
          fbCommentId,
          parentFbId: null, // will be set in post-processing for replies
          authorName,
          authorFbId,
          content: content.slice(0, 2000),
          commentUrl: href,
          postedAtStr,
          isReply,
        })
      }

      return results
    }, maxComments)

    log.info({ count: comments.length }, 'Comments extracted from post')

    // Convert to typed output
    const typed: ScrapedComment[] = comments.map(c => ({
      fbCommentId: c.fbCommentId,
      parentFbId: c.parentFbId,
      authorName: c.authorName,
      authorFbId: c.authorFbId,
      content: c.content,
      commentUrl: c.commentUrl,
      postedAt: c.postedAtStr ? new Date(c.postedAtStr) : null,
    }))

    return { comments: typed, errorsEncountered: errors.length }

  } catch (err) {
    log.error({ err: (err as Error).message }, 'Error scraping comments')
    return { comments: [], errorsEncountered: 1 }
  } finally {
    await page.close().catch(() => {})
  }
}
