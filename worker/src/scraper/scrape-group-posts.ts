/**
 * Scrape Facebook Group — scroll qua feed, extract posts matching keywords.
 *
 * Strategy:
 * - Max 15 scrolls hoặc đến khi ≥ maxPosts được collect
 * - Random delay 3-8s giữa mỗi scroll
 * - Nghỉ 30-60s sau mỗi 20 posts (simulate human reading)
 * - Dedupe bằng fbPostId trong session (tránh insert lại post đã có)
 */

import type { Page, BrowserContext } from 'playwright'
import { extractPostsFromPage, matchesKeywords, type ExtractedPost } from './extract-post-fields.js'
import { randomDelay } from '../browser/launch-stealth-browser.js'
import { logger } from '../lib/pino-structured-logger.js'
import { env } from '../config/environment-schema.js'

export type ScrapeGroupOptions = {
  url: string
  keywords: string[]
  maxPosts?: number
  maxScrolls?: number
  sessionId?: string  // for logging
}

export type ScrapeResult = {
  posts: ExtractedPost[]
  scrollsDone: number
  pagesVisited: number
  errorsEncountered: number
}

/**
 * Main: scrape một Facebook Group URL.
 * Context phải đã load session cookie hợp lệ.
 */
export async function scrapeGroupPosts(
  context: BrowserContext,
  opts: ScrapeGroupOptions,
): Promise<ScrapeResult> {
  const { url, keywords, maxPosts, maxScrolls = 15, sessionId = 'unknown' } = opts
  const limit = maxPosts ?? env.SCRAPE_MAX_POSTS_PER_SOURCE

  const page = await context.newPage()
  const seen = new Map<string, ExtractedPost>()
  let scrollsDone = 0
  let errors = 0

  const log = logger.child({ sessionId, url: url.slice(0, 60), keywords })
  log.info('Starting group scrape')

  try {
    // Navigate với timeout rộng hơn cho group feed
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await page.waitForTimeout(3000)

    // Xử lý popup (cookies, notifications)
    await dismissPopups(page)

    // Wait for feed container
    const feedSelector = '[role="feed"], [data-pagelet^="FeedUnit"], [data-testid="fbfeed_story"]'
    const feedFound = await page
      .waitForSelector(feedSelector, { timeout: 20_000 })
      .then(() => true)
      .catch(() => false)

    if (!feedFound) {
      log.warn('Feed selector not found — may be redirected or layout changed')
      errors++
    }

    // Scroll loop
    while (scrollsDone < maxScrolls && seen.size < limit) {
      // Extract current viewport
      const newPosts = await extractPostsFromPage(page, url)

      for (const post of newPosts) {
        if (!seen.has(post.fbPostId) && matchesKeywords(post.content, keywords)) {
          seen.set(post.fbPostId, post)
        }
      }

      log.debug({ scrollsDone, collected: seen.size, newOnPage: newPosts.length }, 'Scroll step')

      if (seen.size >= limit) break

      // Scroll down
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.8))
      scrollsDone++

      // Random delay giữa các scroll
      await randomDelay()

      // Nghỉ dài sau 20 posts để tránh rate-limit
      if (seen.size > 0 && seen.size % 20 === 0) {
        const restMs = 30_000 + Math.random() * 30_000
        log.debug({ restMs: Math.round(restMs) }, 'Taking a longer rest')
        await page.waitForTimeout(restMs)
      }

      // Check nếu bị redirect về login (session expired giữa chừng)
      const currentUrl = page.url()
      if (currentUrl.includes('/login') || currentUrl.includes('checkpoint')) {
        log.warn({ currentUrl }, 'Redirected to login during scrape — session expired')
        break
      }
    }

    const result: ScrapeResult = {
      posts: [...seen.values()],
      scrollsDone,
      pagesVisited: 1,
      errorsEncountered: errors,
    }

    log.info({ collected: result.posts.length, scrollsDone }, 'Group scrape complete')
    return result
  } catch (err) {
    log.error({ err: (err as Error).message }, 'Group scrape failed')
    errors++
    return { posts: [...seen.values()], scrollsDone, pagesVisited: 1, errorsEncountered: errors }
  } finally {
    await page.close().catch(() => {})
  }
}

/**
 * Scrape Facebook search results cho keyword.
 * URL pattern: https://www.facebook.com/search/posts/?q=ù+tai
 */
export async function scrapeKeywordSearch(
  context: BrowserContext,
  keyword: string,
  opts: Omit<ScrapeGroupOptions, 'url' | 'keywords'> = {},
): Promise<ScrapeResult> {
  const encodedQ = encodeURIComponent(keyword)
  const searchUrl = `https://www.facebook.com/search/posts/?q=${encodedQ}&filters=eyJyZWNlbnRseVBvc3RlZCI6IntcInN0YXJ0X3llYXJcIjpcIjIwMjRcIixcImVuZF95ZWFyXCI6XCIyMDI2XCJ9In0%3D`
  // filters = recently posted (2024-2026)

  return scrapeGroupPosts(context, {
    ...opts,
    url: searchUrl,
    keywords: [keyword],
    sessionId: `search:${keyword}`,
  })
}

/**
 * Dismiss common FB popups (cookie consent, notification permission, etc.)
 */
async function dismissPopups(page: Page): Promise<void> {
  const popupSelectors = [
    // Cookie consent
    '[aria-label="Allow all cookies"]',
    '[data-testid="cookie-policy-manage-dialog-accept-button"]',
    // Notification popup
    '[aria-label="Not Now"]',
    '[aria-label="Không phải bây giờ"]',
    // Login nag
    'div[role="dialog"] [aria-label="Close"]',
    'div[role="dialog"] [aria-label="Đóng"]',
  ]

  for (const sel of popupSelectors) {
    try {
      const el = await page.$(sel)
      if (el) {
        await el.click()
        await page.waitForTimeout(500)
        logger.debug({ selector: sel }, 'Dismissed popup')
      }
    } catch {
      // Ignore — popup may not exist
    }
  }
}
