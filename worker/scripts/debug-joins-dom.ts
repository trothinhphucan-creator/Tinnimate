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

  // Click Chuyển ngay
  const btn = pw.locator('div[role="button"]:has-text("Chuyển ngay")').first()
  if (await btn.count() > 0) { await btn.click(); await pw.waitForTimeout(1500) }

  // Navigate to joins
  await pw.goto('https://www.facebook.com/groups/joins/?nav_source=tab', { waitUntil: 'domcontentloaded', timeout: 25000 })
  await pw.waitForTimeout(3000)
  for (let i=0;i<3;i++) { await pw.evaluate(()=>window.scrollBy(0,800)); await pw.waitForTimeout(800) }

  // Get first 3 group cards HTML to understand structure
  const cards = await pw.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="/groups/"]')).slice(0, 5)
    return links.map(a => {
      const parent = a.closest('[role="listitem"]') ?? a.closest('li') ?? a.parentElement
      return {
        href: (a as HTMLAnchorElement).href,
        ariaLabel: a.getAttribute('aria-label'),
        aText: a.textContent?.trim()?.slice(0, 80),
        parentText: parent?.textContent?.trim()?.slice(0, 200),
        // Look for heading inside
        heading: parent?.querySelector('span[dir="auto"], h3, h4, strong')?.textContent?.trim()?.slice(0, 80),
      }
    })
  })
  console.log('Group card structures:')
  cards.forEach((c, i) => {
    console.log(`\n--- Card ${i+1} ---`)
    console.log('href:', c.href.replace('https://www.facebook.com',''))
    console.log('aria-label:', c.ariaLabel)
    console.log('a.text:', c.aText)
    console.log('heading:', c.heading)
    console.log('parent.text:', c.parentText?.replace(/\n/g,' '))
  })

  await browser.close()
}
main().catch(e => { console.error(e.message); process.exit(1) })
