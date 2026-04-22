/**
 * scan-joined-groups.ts
 *
 * Quét nhóm mà FANPAGE đã tham gia.
 *
 * Strategy lấy Page numeric ID (theo thứ tự ưu tiên):
 *   1. URL /profile.php?id=XXXXXXX → extract trực tiếp
 *   2. Playwright navigate tới Page URL → tìm ID trong HTML/meta
 *   3. Dùng facebook.com/pg/<name>/about → extract từ URL redirect
 */

import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { loadSession } from './facebook-session-manager.js'
import { logger } from '../lib/pino-structured-logger.js'

export interface FbGroupInfo {
  name: string
  url: string
  memberCount: string | null
}

function extractIdFromUrl(url: string): string | null {
  // profile.php?id=123456
  const m = url.match(/[?&]id=(\d{5,})/)
  return m?.[1] ?? null
}

async function getPageNumericId(
  page: import('playwright').Page,
  pageUrl: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log: any,
): Promise<string | null> {

  // Case 1: URL directly contains numeric ID
  const fromUrl = extractIdFromUrl(pageUrl)
  if (fromUrl) {
    log.info({ numericId: fromUrl, src: 'url-param' }, 'Page ID from URL')
    return fromUrl
  }

  try {
    // Navigate to page
    const resp = await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 25_000 })
    await page.waitForTimeout(2000)

    // Case 2: Redirected to numeric URL
    const finalUrl = page.url()
    const fromFinalUrl = extractIdFromUrl(finalUrl)
    if (fromFinalUrl) {
      log.info({ numericId: fromFinalUrl, src: 'redirect-url' }, 'Page ID from redirect URL')
      return fromFinalUrl
    }

    // Case 3: Look for page ID in various HTML patterns
    const pageId = await page.evaluate((): string | null => {
      const html = document.documentElement.innerHTML

      // Try multiple regex patterns used by different FB versions
      const patterns = [
        /"pageID"\s*:\s*"(\d+)"/,
        /"page_id"\s*:\s*"(\d+)"/,
        /"entity_id"\s*:\s*"(\d+)"/,
        /content_id\s*=\s*"(\d+)"/,
        /"ownerID"\s*:\s*"(\d+)"/,
        /"userID"\s*:\s*"(\d+)"/,
        /"actorID"\s*:\s*"(\d+)"/,
        /pages\/(\d{5,})\//,
        /\/"(\d{10,})"\//,
      ]
      for (const p of patterns) {
        const m = html.match(p)
        if (m?.[1] && m[1].length >= 5) return m[1]
      }

      // Try meta tags
      const ogUrl = document.querySelector('meta[property="og:url"]')?.getAttribute('content')
      if (ogUrl) {
        const mUrl = ogUrl.match(/\/(\d{5,})\/?$/)
        if (mUrl) return mUrl[1]
      }

      // Try link canonical
      const canon = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href
      if (canon) {
        const mCanon = canon.match(/\/(\d{5,})\/?$/)
        if (mCanon) return mCanon[1]
      }

      return null
    })

    if (pageId) {
      log.info({ numericId: pageId, src: 'html-parse' }, 'Page ID from HTML')
      return pageId
    }

    // Case 4: Navigate to /about and look for numeric in URL
    await page.goto(pageUrl.replace(/\/$/, '') + '/about', {
      waitUntil: 'domcontentloaded',
      timeout: 15_000,
    }).catch(() => {})
    await page.waitForTimeout(1500)

    const aboutId = await page.evaluate((): string | null => {
      const html = document.documentElement.innerHTML
      const patterns = [/"pageID"\s*:\s*"(\d+)"/, /"page_id"\s*:\s*"(\d+)"/, /pages\/(\d{5,})\//]
      for (const p of patterns) {
        const m = html.match(p)
        if (m?.[1]) return m[1]
      }
      return null
    })

    if (aboutId) {
      log.info({ numericId: aboutId, src: 'about-page' }, 'Page ID from /about')
      return aboutId
    }

    log.warn({ pageUrl, finalUrl, respStatus: resp?.status() }, 'Could not extract Page numeric ID')
    return null

  } catch (err) {
    log.warn({ err: (err as Error).message }, 'Error getting Page ID')
    return null
  }
}

export async function scanJoinedGroups(pageId: string, fbPageUrl?: string | null): Promise<FbGroupInfo[]> {
  const log = logger.child({ pageId, fn: 'scanJoinedGroups' })

  if (!fbPageUrl) {
    throw new Error('Chưa có Facebook Page URL — vào Chỉnh sửa fanpage và nhập URL trước khi quét nhóm.')
  }

  const storageState = await loadSession(pageId)
  if (!storageState) throw new Error('No session found — login first')

  chromium.use(StealthPlugin())
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  })

  try {
    const context = await browser.newContext({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      storageState: storageState as any,
      locale: 'vi-VN',
      timezoneId: 'Asia/Ho_Chi_Minh',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    })
    const pw = await context.newPage()

    // Check session valid
    await pw.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 20_000 })
    if (pw.url().includes('/login')) throw new Error('Session expired — cần đăng nhập lại')

    log.info({ fbPageUrl }, 'Getting Page numeric ID')
    const numericId = await getPageNumericId(pw, fbPageUrl, log)

    if (!numericId) {
      throw new Error(
        `Không tìm được Page numeric ID từ URL: ${fbPageUrl}. ` +
        'Thử dùng URL dạng: https://www.facebook.com/profile.php?id=XXXXXXXX'
      )
    }

    log.info({ numericId }, 'Switching to Page context')
    const actParam = `&act=${numericId}`

    // Navigate to groups with Page context
    const groupsUrl = `https://www.facebook.com/groups/?category=joined${actParam}`
    log.info({ groupsUrl }, 'Navigating to groups page')
    await pw.goto(groupsUrl, { waitUntil: 'domcontentloaded', timeout: 25_000 })
    await pw.waitForTimeout(3000)

    // Scroll to load more
    for (let i = 0; i < 6; i++) {
      await pw.evaluate(() => window.scrollBy(0, 800))
      await pw.waitForTimeout(700)
    }

    // Extract group links
    const groups = await pw.evaluate((): FbGroupInfo[] => {
      const results: FbGroupInfo[] = []
      const seen = new Set<string>()
      const SKIP = new Set(['feed', 'create', 'discover', 'joined', 'manage', 'you_admin', 'invites'])

      for (const a of Array.from(document.querySelectorAll('a[href*="/groups/"]'))) {
        const href = (a as HTMLAnchorElement).href
        const match = href.match(/facebook\.com\/groups\/([^/?#]+)/)
        if (!match) continue
        const slug = match[1]
        if (SKIP.has(slug) || seen.has(slug)) continue
        seen.add(slug)

        const name = a.getAttribute('aria-label') || a.textContent?.trim() || slug
        if (!name || name.length < 2) continue

        const parent = a.closest('[role="listitem"]') ?? a.closest('li') ?? a.parentElement
        const memberText = Array.from(parent?.querySelectorAll('span') ?? [])
          .map(s => s.textContent?.trim())
          .find(t => t && (t.includes('thành viên') || t.includes('member'))) ?? null

        results.push({
          name: name.slice(0, 100),
          url: `https://www.facebook.com/groups/${slug}`,
          memberCount: memberText?.slice(0, 60) ?? null,
        })
      }
      return results.slice(0, 150)
    })

    log.info({ count: groups.length, numericId }, 'Groups scanned as Page')
    await context.close()
    return groups

  } finally {
    await browser?.close().catch(() => {})
  }
}
