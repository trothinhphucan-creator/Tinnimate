/**
 * scan-joined-groups.ts
 * Dùng Playwright session hiện tại để scrape danh sách nhóm FB mà account đã tham gia.
 * Kết quả: [{ name, url, memberCount? }]
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

export async function scanJoinedGroups(pageId: string): Promise<FbGroupInfo[]> {
  const log = logger.child({ pageId, fn: 'scanJoinedGroups' })

  const storageState = await loadSession(pageId)
  if (!storageState) throw new Error('No session found — login first')

  chromium.use(StealthPlugin())
  const browser = await chromium.launch({
    headless: false,
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
    const page = await context.newPage()

    log.info('Navigating to /groups/feed')
    await page.goto('https://www.facebook.com/groups/feed/', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    })

    // Check still logged in
    if (page.url().includes('/login')) {
      throw new Error('Session expired')
    }

    // Scroll to load more groups in sidebar
    await page.waitForTimeout(2000)
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, 600))
      await page.waitForTimeout(800)
    }

    // Click "Xem tất cả" / "See all" if present
    const seeAll = page.locator('a:has-text("Xem tất cả nhóm"), a:has-text("See all groups"), span:has-text("Xem tất cả")').first()
    if (await seeAll.count() > 0) {
      await seeAll.click().catch(() => {})
      await page.waitForTimeout(1500)
    }

    // Navigate directly to groups you joined
    await page.goto('https://www.facebook.com/groups/?category=joined', {
      waitUntil: 'domcontentloaded',
      timeout: 20_000,
    })
    await page.waitForTimeout(2000)

    // Scroll to load more
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, 800))
      await page.waitForTimeout(600)
    }

    // Extract group links
    const groups = await page.evaluate((): FbGroupInfo[] => {
      const results: FbGroupInfo[] = []
      const seen = new Set<string>()

      // Find all group links
      const links = Array.from(document.querySelectorAll('a[href*="/groups/"]'))
      for (const a of links) {
        const href = (a as HTMLAnchorElement).href
        const match = href.match(/facebook\.com\/groups\/([^/?#]+)/)
        if (!match) continue
        const groupId = match[1]
        if (groupId === 'feed' || groupId === 'create' || seen.has(groupId)) continue
        seen.add(groupId)

        // Try to get name from aria-label or text content
        const name = a.getAttribute('aria-label') || a.textContent?.trim() || groupId

        // Try to find member count near the link
        const parent = a.closest('[role="listitem"]') ?? a.parentElement
        const memberText = parent?.querySelector('[data-testid*="member"], span')?.textContent ?? null

        results.push({
          name: name.slice(0, 100),
          url: `https://www.facebook.com/groups/${groupId}`,
          memberCount: memberText?.includes('thành viên') || memberText?.includes('member')
            ? memberText.trim().slice(0, 50)
            : null,
        })
      }
      return results.slice(0, 100) // cap at 100
    })

    log.info({ count: groups.length }, 'Groups scanned')
    await context.close()
    return groups
  } finally {
    await browser.close().catch(() => {})
  }
}
