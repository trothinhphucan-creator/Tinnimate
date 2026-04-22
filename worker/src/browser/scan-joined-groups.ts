/**
 * scan-joined-groups.ts
 *
 * Quét nhóm mà FANPAGE đã tham gia (không phải tài khoản cá nhân).
 *
 * Facebook dùng tham số ?act=<PAGE_NUMERIC_ID> để switch context sang Page.
 * Flow:
 *   1. Load session cá nhân (admin fanpage)
 *   2. Navigate tới fb_page_url → lấy Page numeric ID
 *   3. Switch context: facebook.com/groups/?act=<PAGE_ID>&category=joined
 *   4. Scrape danh sách nhóm
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

async function getPageNumericId(page: import('playwright').Page, pageUrl: string): Promise<string | null> {
  try {
    await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 20_000 })
    await page.waitForTimeout(2000)

    // Tìm page ID từ meta tags, data attributes hoặc URL
    const pageId = await page.evaluate((): string | null => {
      // Cách 1: entity_id trong HTML
      const match1 = document.documentElement.innerHTML.match(/"entity_id":"(\d+)"/)
      if (match1) return match1[1]

      // Cách 2: pageID
      const match2 = document.documentElement.innerHTML.match(/"pageID":"(\d+)"/)
      if (match2) return match2[1]

      // Cách 3: page_id
      const match3 = document.documentElement.innerHTML.match(/"page_id":"(\d+)"/)
      if (match3) return match3[1]

      // Cách 4: data-pageid attribute
      const el = document.querySelector('[data-pageid]')
      if (el) return el.getAttribute('data-pageid')

      // Cách 5: từ URL redirect (numeric page)
      const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href
      const matchUrl = canonical?.match(/\/(\d+)$/)
      if (matchUrl) return matchUrl[1]

      return null
    })

    return pageId
  } catch {
    return null
  }
}

export async function scanJoinedGroups(pageId: string, fbPageUrl?: string | null): Promise<FbGroupInfo[]> {
  const log = logger.child({ pageId, fn: 'scanJoinedGroups' })

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
    if (pw.url().includes('/login')) {
      throw new Error('Session expired — cần đăng nhập lại')
    }

    let actParam = ''

    // Lấy Page numeric ID nếu có fb_page_url
    if (fbPageUrl) {
      log.info({ fbPageUrl }, 'Getting Page numeric ID')
      const numericId = await getPageNumericId(pw, fbPageUrl)
      if (numericId) {
        log.info({ numericId }, 'Found Page numeric ID → will scan as Page')
        actParam = `&act=${numericId}`
      } else {
        throw new Error('Không tìm được Page numeric ID từ URL: ' + fbPageUrl + '. Hãy kiểm tra lại Facebook Page URL trong mục Chỉnh sửa.')
      }
    } else {
      throw new Error('Chưa có Facebook Page URL — vào Chỉnh sửa fanpage và nhập URL trước khi quét nhóm.')
    }

    // Navigate to groups với context của Page (nếu có act param)
    const groupsUrl = `https://www.facebook.com/groups/?category=joined${actParam}`
    log.info({ groupsUrl }, 'Navigating to groups page')
    await pw.goto(groupsUrl, { waitUntil: 'domcontentloaded', timeout: 25_000 })
    await pw.waitForTimeout(2500)

    // Scroll để load thêm nhóm
    for (let i = 0; i < 6; i++) {
      await pw.evaluate(() => window.scrollBy(0, 800))
      await pw.waitForTimeout(700)
    }

    // Click "Xem tất cả" nếu có
    const seeAll = pw.locator('a:has-text("Xem tất cả"), span:has-text("See all")').first()
    if (await seeAll.count() > 0) {
      await seeAll.click().catch(() => {})
      await pw.waitForTimeout(1500)
    }

    // Extract group links
    const groups = await pw.evaluate((): FbGroupInfo[] => {
      const results: FbGroupInfo[] = []
      const seen = new Set<string>()
      const links = Array.from(document.querySelectorAll('a[href*="/groups/"]'))

      for (const a of links) {
        const href = (a as HTMLAnchorElement).href
        const match = href.match(/facebook\.com\/groups\/([^/?#]+)/)
        if (!match) continue
        const groupSlug = match[1]
        if (['feed', 'create', 'discover', 'joined', 'manage'].includes(groupSlug)) continue
        if (seen.has(groupSlug)) continue
        seen.add(groupSlug)

        const name = a.getAttribute('aria-label') || a.textContent?.trim() || groupSlug
        if (!name || name.length < 2) continue

        const parent = a.closest('[role="listitem"]') ?? a.closest('li') ?? a.parentElement
        const memberText = Array.from(parent?.querySelectorAll('span') ?? [])
          .map(s => s.textContent?.trim())
          .find(t => t && (t.includes('thành viên') || t.includes('member') || t.includes('·'))) ?? null

        results.push({
          name: name.slice(0, 100),
          url: `https://www.facebook.com/groups/${groupSlug}`,
          memberCount: memberText?.slice(0, 60) ?? null,
        })
      }
      return results.slice(0, 150)
    })

    log.info({ count: groups.length, usingPageContext: !!actParam }, 'Groups scanned')
    await context.close()
    return groups
  } finally {
    await browser.close().catch(() => {})
  }
}
