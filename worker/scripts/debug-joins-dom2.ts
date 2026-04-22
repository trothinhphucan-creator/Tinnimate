import 'dotenv/config'
import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { loadSession } from '../src/browser/facebook-session-manager.js'

const pageId = 'b994e12a-d681-4c68-8ab4-f56ccb45da97'

async function main() {
  const ss = await loadSession(pageId)
  chromium.use(StealthPlugin())
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH, args: ['--no-sandbox'] })
  const ctx = await browser.newContext({ storageState: ss as any, locale: 'vi-VN', viewport: { width: 1280, height: 900 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36' })
  const pw = await ctx.newPage()

  await pw.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 20000 })
  await pw.goto('https://www.facebook.com/TinniAI/', { waitUntil: 'domcontentloaded', timeout: 25000 })
  await pw.waitForTimeout(2000)
  const btn = pw.locator('div[role="button"]:has-text("Chuyển ngay")').first()
  if (await btn.count() > 0) { await btn.click(); await pw.waitForTimeout(1500) }

  await pw.goto('https://www.facebook.com/groups/joins/?nav_source=tab', { waitUntil: 'domcontentloaded', timeout: 25000 })
  await pw.waitForTimeout(3000)
  // Scroll more to load all groups
  for (let i=0;i<8;i++) { await pw.evaluate(()=>window.scrollBy(0,600)); await pw.waitForTimeout(700) }

  // Find group cards that have a real group URL (not nav links)
  const groups = await pw.evaluate(() => {
    const SKIP_SLUGS = new Set(['feed','discover','joins','create','you_admin','invites','search','explore'])
    const SKIP_TEXT = new Set(['Bảng feed của bạn','Khám phá','Nhóm của bạn','Tạo nhóm mới','Xem tất cả'])
    const seen = new Set<string>()
    const results: Array<{name:string;url:string;slug:string}> = []

    for (const a of Array.from(document.querySelectorAll('a[href*="/groups/"]'))) {
      const href = (a as HTMLAnchorElement).href
      const m = href.match(/facebook\.com\/groups\/([^/?#]+)/)
      if (!m) continue
      const slug = m[1]
      if (SKIP_SLUGS.has(slug) || seen.has(slug)) continue

      const text = a.textContent?.trim() ?? ''
      if (SKIP_TEXT.has(text)) continue

      // Walk up to find group card container, look for the group name in a span
      let container = a.parentElement
      for (let i=0;i<5;i++) {
        if (!container) break
        if (container.getAttribute('role') === 'listitem') break
        container = container.parentElement
      }

      // Find the group name — look for span with real text (not just the slug/id)
      const spans = Array.from(container?.querySelectorAll('span[dir], span') ?? [])
      const nameSpan = spans.find(s => {
        const t = s.textContent?.trim() ?? ''
        return t.length > 4 && !SKIP_TEXT.has(t) && !/^\d+$/.test(t) && !/^(Nhóm|Tham|Đã tham|Bài viết|thành viên|member)/.test(t)
      })

      const name = nameSpan?.textContent?.trim() || text || slug
      if (!name || name.length < 3) continue

      seen.add(slug)
      results.push({ name, url: `https://www.facebook.com/groups/${slug}`, slug })
    }
    return results
  })

  console.log(`Total real groups: ${groups.length}`)
  groups.slice(0,15).forEach((g,i) => console.log(i+1, g.name, '|', g.slug))

  await browser.close()
}
main().catch(e => { console.error(e.message); process.exit(1) })
