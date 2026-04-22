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
  for (let i=0;i<4;i++) { await pw.evaluate(()=>window.scrollBy(0,600)); await pw.waitForTimeout(700) }

  // Inspect first 6 group cards in detail
  const cards = await pw.evaluate(() => {
    const SKIP = ['feed','discover','joins','create','you_admin','invites','search','explore']
    const SKIP_TEXT = ['Bảng feed của bạn','Khám phá','Nhóm của bạn','Tạo nhóm mới','Xem tất cả']
    const links = Array.from(document.querySelectorAll('a[href*="/groups/"]'))
      .filter(a => {
        const m = (a as HTMLAnchorElement).href.match(/\/groups\/([^/?#]+)/)
        const slug = m?.[1]
        if (!slug || SKIP.includes(slug)) return false
        const txt = a.textContent?.trim() ?? ''
        return !SKIP_TEXT.includes(txt)
      })
      .slice(0,6)

    return links.map(a => {
      const slug = (a as HTMLAnchorElement).href.match(/\/groups\/([^/?#]+)/)?.[1]
      // Try different approaches to get name
      const img = a.querySelector('img')
      const imgAlt = img?.getAttribute('alt')?.trim()
      const aSpan = a.querySelector('span')?.textContent?.trim()

      // Walk up 3 levels max looking for a listitem
      let container: Element | null = a
      for (let i=0;i<6;i++) {
        if (!container) break
        if (container.getAttribute('role') === 'listitem' || container.tagName === 'LI') break
        container = container.parentElement
      }
      // First direct child span of container (usually group name)
      const containerSpans = Array.from(container?.querySelectorAll('span') ?? [])
        .map(s => s.textContent?.trim())
        .filter(t => t && t.length > 3 && !SKIP_TEXT.includes(t!) && !/^(Tham|Đã tham|thành viên|member|Bài)/.test(t!))

      return { slug, imgAlt, aSpan, containerSpans: containerSpans.slice(0,5) }
    })
  })
  cards.forEach((c,i) => {
    console.log(`\n--- ${i+1} | slug:${c.slug} ---`)
    console.log('  img alt:', c.imgAlt)
    console.log('  a>span:', c.aSpan)
    console.log('  containerSpans:', c.containerSpans)
  })

  await browser.close()
}
main().catch(e => { console.error(e.message); process.exit(1) })
