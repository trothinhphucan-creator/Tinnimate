/**
 * scan-joined-groups.ts
 *
 * Quét nhóm mà FANPAGE đã tham gia.
 *
 * Strategy: Navigate tới <pageUrl>/groups/ (tab Nhóm của Page)
 * Sau đó extract tất cả nhóm từ danh sách.
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

const SKIP_SLUGS = new Set([
  'feed', 'create', 'discover', 'joined', 'manage',
  'you_admin', 'invites', 'search', 'explore',
])

// Notification text patterns — remove these false positives
const NOTIFICATION_PATTERNS = [
  /Chưa đọc/,
  /bài viết mới/,
  /ảnh mới/,
  /giờ·/,
  /phút·/,
  /tuần trước/,
  /ngày trước/,
  /Lần hoạt động/,
  /^Nhóm của bạn$/,
]

function isNotificationText(name: string): boolean {
  return NOTIFICATION_PATTERNS.some(p => p.test(name))
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
    headless: false, // Show browser so user can see it working
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH,
    args: [
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1280,900',
      '--window-position=100,100',
    ],
  })

  try {
    const context = await browser.newContext({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      storageState: storageState as any,
      locale: 'vi-VN',
      timezoneId: 'Asia/Ho_Chi_Minh',
      viewport: { width: 1280, height: 900 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    })
    const pw = await context.newPage()

    // Verify session
    await pw.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 20_000 })
    if (pw.url().includes('/login')) throw new Error('Session expired — cần đăng nhập lại')

    // ── Navigate to Page Groups URL ──────────────────────────────────────────
    const baseUrl = fbPageUrl.replace(/\/$/, '')

    // Try /groups/ suffix first (works for Pages that have joined groups)
    const pageGroupsUrl = `${baseUrl}/groups/`
    log.info({ pageGroupsUrl }, 'Navigating to Page groups URL')

    await pw.goto(pageGroupsUrl, { waitUntil: 'domcontentloaded', timeout: 25_000 })
    await pw.waitForTimeout(3000)

    // Check if we're still on the page (not redirected to login or generic groups)
    const finalUrl = pw.url()
    log.info({ finalUrl }, 'Final URL after navigation')

    // If redirected away from the Page groups, try sk=groups param
    if (!finalUrl.includes(baseUrl.split('/').pop()!) && !finalUrl.includes('groups')) {
      const skUrl = `${baseUrl}?sk=groups`
      log.info({ skUrl }, 'Fallback to sk=groups param')
      await pw.goto(skUrl, { waitUntil: 'domcontentloaded', timeout: 20_000 })
      await pw.waitForTimeout(2000)
    }

    // Scroll to load groups
    for (let i = 0; i < 6; i++) {
      await pw.evaluate(() => window.scrollBy(0, window.innerHeight))
      await pw.waitForTimeout(800)
    }

    // Take screenshot for debugging
    log.info({ url: pw.url() }, 'Extracting groups from page')

    // Extract groups — filter out notification noise
    const SKIP = ['feed', 'create', 'discover', 'joined', 'manage', 'you_admin', 'invites', 'search', 'explore']
    const NOISE = ['Chưa đọc', 'bài viết mới', 'ảnh mới', 'giờ·', 'phút·', 'tuần trước', 'ngày trước', 'Lần hoạt động', 'Nhóm của bạn']

    const allGroups: FbGroupInfo[] = await pw.evaluate((args: { skip: string[]; noise: string[] }) => {
      const results: Array<{ name: string; url: string; memberCount: string | null }> = []
      const seen = new Set<string>()

      // Get all group links
      for (const a of Array.from(document.querySelectorAll('a[href*="/groups/"]'))) {
        const href = (a as HTMLAnchorElement).href
        const match = href.match(/facebook\.com\/groups\/([^/?#]+)/)
        if (!match) continue
        const slug = match[1]
        if (args.skip.includes(slug) || seen.has(slug)) continue

        // Get name from aria-label or text content
        const rawName = a.getAttribute('aria-label') || a.textContent?.trim() || slug

        // Filter out notification-style text (contains noise patterns)
        if (!rawName || rawName.length < 2) continue
        if (args.noise.some(n => rawName.includes(n))) continue
        if (rawName.length > 120) continue // Too long = likely notification text

        seen.add(slug)

        // Look for member count in parent container
        const parent = a.closest('[role="listitem"]') ?? a.closest('li') ?? a.parentElement?.parentElement
        const memberText = Array.from(parent?.querySelectorAll('span') ?? [])
          .map(s => s.textContent?.trim() ?? '')
          .find(t => t && (t.includes('thành viên') || t.includes('member') || /^\d+[\.,]?\d*\s*(K|M)?\s*(thành|mem)/i.test(t))) ?? null

        results.push({
          name: rawName.slice(0, 100).trim(),
          url: `https://www.facebook.com/groups/${slug}`,
          memberCount: memberText?.slice(0, 60) ?? null,
        })
      }
      return results.slice(0, 150)
    }, { skip: SKIP, noise: NOISE })


    // Post-filter: remove any remaining noise
    const groups = allGroups.filter(g => !isNotificationText(g.name))

    log.info({ count: groups.length, finalUrl: pw.url() }, 'Groups scanned from Page')
    await context.close()
    return groups

  } finally {
    await browser?.close().catch(() => {})
  }
}
