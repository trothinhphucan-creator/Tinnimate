/**
 * debug-page-groups.ts - Chụp screenshot và lấy HTML của /groups/ page
 */
import 'dotenv/config'
import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { loadSession } from '../src/browser/facebook-session-manager.js'
import { writeFileSync } from 'fs'

const pageId = 'b994e12a-d681-4c68-8ab4-f56ccb45da97'
const fbPageUrl = 'https://www.facebook.com/TinniAI/'

async function main() {
  const storageState = await loadSession(pageId)
  if (!storageState) { console.error('No session'); process.exit(1) }

  chromium.use(StealthPlugin())
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH,
    args: ['--no-sandbox'],
  })

  const context = await browser.newContext({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    storageState: storageState as any,
    locale: 'vi-VN',
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  })

  const pw = await context.newPage()

  // Verify session
  await pw.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 20_000 })
  if (pw.url().includes('/login')) { console.error('Session expired'); await browser.close(); process.exit(1) }
  console.log('✅ Logged in')

  // Navigate to Page groups
  const url = `${fbPageUrl}groups/`
  await pw.goto(url, { waitUntil: 'domcontentloaded', timeout: 25_000 })
  await pw.waitForTimeout(4000)
  console.log('Final URL:', pw.url())
  console.log('Title:', await pw.title())

  // Scroll 5 times
  for (let i = 0; i < 8; i++) {
    await pw.evaluate(() => window.scrollBy(0, window.innerHeight))
    await pw.waitForTimeout(1000)
  }

  // Screenshot
  await pw.screenshot({ path: '/tmp/page_groups_debug.png', fullPage: false })
  console.log('📸 Screenshot saved: /tmp/page_groups_debug.png')

  // Count all group links
  const links = await pw.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href*="/groups/"]')).map(a => ({
      href: (a as HTMLAnchorElement).href,
      text: a.textContent?.trim().slice(0, 60),
      aria: a.getAttribute('aria-label')
    })).slice(0, 30)
  })
  console.log('\nAll group links found:')
  links.forEach((l, i) => console.log(i+1, l.href.replace('https://www.facebook.com',''), '|', l.aria || l.text))

  // Also check page title and any h1/h2
  const titles = await pw.evaluate(() => {
    return {
      title: document.title,
      h1: Array.from(document.querySelectorAll('h1,h2')).map(h => h.textContent?.trim()).slice(0,5)
    }
  })
  console.log('\nPage title:', titles.title)
  console.log('Headings:', titles.h1)

  await browser.close()
}
main().catch(e => { console.error(e.message); process.exit(1) })
