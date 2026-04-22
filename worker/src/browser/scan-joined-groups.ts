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

    // ── CRITICAL: Switch to Page context first ───────────────────────────────
    // Facebook shows a "Chuyển sang Trang" (Switch to Page) button when viewing
    // the page as an admin. We must click it to act AS the page.
    log.info('Switching to Page context via Chuyển button')
    await pw.goto(fbPageUrl, { waitUntil: 'domcontentloaded', timeout: 25_000 })
    await pw.waitForTimeout(2500)

    // Look for the "Chuyển" sidebar button to open switch modal
    const switchSelectors = [
      'div[role="button"]:has-text("Chuyển ngay")',
      'div[role="button"]:has-text("Chuyển")',
      'button:has-text("Chuyển ngay")',
      'button:has-text("Chuyển")',
    ]

    let switched = false
    for (const sel of switchSelectors) {
      try {
        const btn = pw.locator(sel).first()
        if (await btn.count() > 0) {
          log.info({ sel }, 'Clicking Switch button — opening modal')
          await btn.click()
          await pw.waitForTimeout(1500)

          // A modal appears with another blue "Chuyển" button — click it
          // The modal has a blue confirm button (role=button or button with text Chuyển)
          const modalConfirm = pw.locator('[role="dialog"] div[role="button"]:has-text("Chuyển"), [role="dialog"] button:has-text("Chuyển")').first()
          if (await modalConfirm.count() > 0) {
            log.info('Clicking modal confirm Chuyển button')
            await modalConfirm.click()
            await pw.waitForTimeout(2500) // Wait for context switch to complete
            switched = true
            log.info({ currentUrl: pw.url() }, 'Switched to Page context')
            break
          } else {
            // No modal found — might have switched directly
            switched = true
            break
          }
        }
      } catch { /* continue */ }
    }

    if (!switched) {
      log.info('No Switch button found — may already be acting as Page')
    }

    log.info({ currentUrl: pw.url() }, 'After switch — navigating to Page groups feed')

    // ── Navigate to Page Groups Feed ─────────────────────────────────────────
    // When acting as a Page, facebook.com/groups/feed/ shows groups the Page joined
    const groupsFeedUrl = 'https://www.facebook.com/groups/feed/'
    log.info({ groupsFeedUrl }, 'Navigating to groups feed as Page')

    await pw.goto(groupsFeedUrl, { waitUntil: 'domcontentloaded', timeout: 25_000 })
    await pw.waitForTimeout(3000)

    const finalUrl = pw.url()
    log.info({ finalUrl }, 'Final URL after navigation')

    // Scroll to load groups
    for (let i = 0; i < 6; i++) {
      await pw.evaluate(() => window.scrollBy(0, window.innerHeight))
      await pw.waitForTimeout(800)
    }

    // Take screenshot for debugging
    log.info({ url: pw.url() }, 'Extracting groups from page')

    // Extract groups — filter out notification noise
    const SKIP = ['feed', 'create', 'discover', 'joined', 'joins', 'manage', 'you_admin', 'invites', 'search', 'explore']
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
        if (!rawName || rawName.length < 4) continue
        if (args.noise.some(n => rawName.includes(n))) continue
        if (rawName.length > 120) continue // Too long = likely notification text
        // Skip pure timestamp names like '1 ngày', '2 giờ', etc.
        if (/^\d+\s*(ngày|giờ|phút|tuần|tháng|năm)/.test(rawName)) continue
        // Skip navigation link text
        if (['Bảng feed của bạn', 'Xem tất cả', 'Tất cả'].includes(rawName)) continue

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
