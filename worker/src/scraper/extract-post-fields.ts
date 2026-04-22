/**
 * DOM extractor cho Facebook post articles.
 *
 * Facebook thay đổi selector liên tục → dùng multi-fallback heuristic strategy:
 * - Mỗi field có 2-3 selector chain
 * - Post ID parse từ link (stable nhất)
 * - Content dùng innerText (ít phụ thuộc class name)
 *
 * Tất cả extraction chạy trong page.evaluate() — browser context.
 */

import type { Page } from 'playwright'
import { logger } from '../lib/pino-structured-logger.js'

export type ExtractedPost = {
  fbPostId: string
  fbPostUrl: string | null
  authorName: string | null
  authorFbId: string | null
  content: string
  imageUrls: string[]
  postedAt: Date | null
}

/**
 * Trả về link của bài viết (xử lý relative URLs + mobile FB URLs)
 */
function normalizePostUrl(href: string | null, groupUrl: string): string | null {
  if (!href) return null
  if (href.startsWith('http')) return href.replace('m.facebook.com', 'www.facebook.com')
  if (href.startsWith('/')) return `https://www.facebook.com${href}`
  return null
}

/**
 * Parse post ID từ URL.
 * Patterns:
 *   /groups/123/posts/456  → "456"
 *   /permalink/456/        → "456"
 *   /story_fbid=456&       → "456"
 *   ?fbid=456              → "456"
 */
function parsePostId(url: string | null): string | null {
  if (!url) return null
  const patterns = [
    /\/posts\/(\d+)/,
    /\/permalink\/(\d+)/,
    /story_fbid=(\d+)/,
    /[?&]fbid=(\d+)/,
    /\/(\d{15,})/,  // fallback: any 15+ digit number in path
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

/**
 * Extract tất cả posts visible trong feed của page hiện tại.
 * Chạy evaluate() để xử lý DOM trong browser context.
 */
export async function extractPostsFromPage(
  page: Page,
  sourceUrl: string,
): Promise<ExtractedPost[]> {
  const rawPosts = await page.evaluate(() => {
    const results: Array<{
      linkHrefs: string[]
      authorName: string | null
      authorHref: string | null
      content: string
      imageSrcs: string[]
      timestampTitle: string | null
    }> = []

    // Post containers — multiple fallback selectors
    const containers = Array.from(
      document.querySelectorAll<HTMLElement>(
        [
          'div[role="article"]',
          'div[data-pagelet^="FeedUnit"]',
          'div[data-testid="fbfeed_story"]',
        ].join(', '),
      ),
    )

    for (const el of containers) {
      // Bỏ qua ads
      if (el.querySelector('[data-testid="adUnit"]')) continue
      if (el.querySelector('[aria-label*="Sponsored"]')) continue

      // --- Links (để parse post ID) ---
      const linkEls = Array.from(el.querySelectorAll<HTMLAnchorElement>('a[href]'))
      const linkHrefs = linkEls
        .map((a) => a.getAttribute('href') ?? '')
        .filter((h) => h.includes('/posts/') || h.includes('/permalink/') || h.includes('story_fbid'))
        .slice(0, 5)

      // --- Author ---
      const authorEl =
        el.querySelector<HTMLElement>('h3 a') ??
        el.querySelector<HTMLElement>('h4 a') ??
        el.querySelector<HTMLElement>('strong a') ??
        el.querySelector<HTMLElement>('[data-testid="story-subtitle"] a')

      const authorName = authorEl?.innerText?.trim() ?? null
      const authorHref = authorEl?.getAttribute('href') ?? null

      // --- Content (heuristic: longest text block trong article) ---
      const textCandidates = [
        el.querySelector<HTMLElement>('[data-ad-comet-preview="message"]'),
        el.querySelector<HTMLElement>('[data-ad-preview="message"]'),
        el.querySelector<HTMLElement>('[dir="auto"]:not([role])'),
        el.querySelector<HTMLElement>('div[class*="userContent"]'),
      ].filter(Boolean) as HTMLElement[]

      // Chọn text block dài nhất
      let content = ''
      for (const candidate of textCandidates) {
        const text = candidate.innerText?.trim() ?? ''
        if (text.length > content.length) content = text
      }

      // Fallback: if specific selectors returned nothing meaningful (< 50 chars),
      // use article innerText — filters out lines < 20 chars to skip labels/timestamps.
      if (content.length < 50) {
        const fallback =
          el.innerText
            ?.split('\n')
            .filter((line) => line.trim().length > 20)
            .join('\n')
            .trim() ?? ''
        if (fallback.length > content.length) content = fallback
      }

      // --- Images ---
      const imgEls = Array.from(el.querySelectorAll<HTMLImageElement>('img[src*="scontent"]'))
      const imageSrcs = imgEls
        .filter((img) => img.naturalHeight > 80 && img.naturalWidth > 80)
        .map((img) => img.src)
        .slice(0, 5)

      // --- Timestamp ---
      const tsEl =
        el.querySelector<HTMLElement>('abbr[data-utime]') ??
        el.querySelector<HTMLElement>('abbr[title]') ??
        el.querySelector<HTMLElement>('[aria-label*="2024"], [aria-label*="2025"], [aria-label*="2026"]')

      const timestampTitle = tsEl?.getAttribute('title') ?? tsEl?.getAttribute('aria-label') ?? null

      // Require BOTH a post link AND meaningful content (≥30 chars) to avoid
      // extracting author-name-only fragments that slip through DOM selectors
      if (linkHrefs.length > 0 && content.length >= 30) {
        results.push({ linkHrefs, authorName, authorHref, content, imageSrcs, timestampTitle })
      }
    }

    return results
  })

  const posts: ExtractedPost[] = []

  for (const raw of rawPosts) {
    // Tìm URL của post
    const postHref = raw.linkHrefs[0] ?? null
    const postUrl = normalizePostUrl(postHref, sourceUrl)
    const fbPostId = parsePostId(postUrl)

    if (!fbPostId) {
      logger.debug({ linkHrefs: raw.linkHrefs }, 'Could not parse post ID, skipping')
      continue
    }

    // Parse author FB ID từ href
    let authorFbId: string | null = null
    if (raw.authorHref) {
      const m = raw.authorHref.match(/\/(?:profile\.php\?id=)?(\d{5,})/)
      if (m) authorFbId = m[1]
    }

    // Parse timestamp
    let postedAt: Date | null = null
    if (raw.timestampTitle) {
      try {
        postedAt = new Date(raw.timestampTitle)
        if (isNaN(postedAt.getTime())) postedAt = null
      } catch {
        postedAt = null
      }
    }

    posts.push({
      fbPostId,
      fbPostUrl: postUrl,
      authorName: raw.authorName,
      authorFbId,
      content: raw.content,
      imageUrls: raw.imageSrcs,
      postedAt,
    })
  }

  logger.debug({ total: rawPosts.length, parsed: posts.length }, 'Posts extracted from page')
  return posts
}

/**
 * Filter posts theo keyword list.
 * Case-insensitive, match any keyword in list.
 */
export function matchesKeywords(content: string, keywords: string[]): boolean {
  if (keywords.length === 0) return true
  const lower = content.toLowerCase()
  return keywords.some((kw) => lower.includes(kw.toLowerCase()))
}
