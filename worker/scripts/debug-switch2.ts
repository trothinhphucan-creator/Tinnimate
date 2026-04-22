import 'dotenv/config'
import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { loadSession } from '../src/browser/facebook-session-manager.js'

const pageId = 'b994e12a-d681-4c68-8ab4-f56ccb45da97'
const fbPageUrl = 'https://www.facebook.com/TinniAI/'

async function main() {
  const ss = await loadSession(pageId)
  chromium.use(StealthPlugin())
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH, args: ['--no-sandbox'] })
  const ctx = await browser.newContext({ storageState: ss as any, locale: 'vi-VN', viewport: { width: 1280, height: 900 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36' })
  const pw = await ctx.newPage()

  await pw.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 20000 })
  await pw.goto(fbPageUrl, { waitUntil: 'domcontentloaded', timeout: 25000 })
  await pw.waitForTimeout(2000)

  // Click "Chuyển ngay" button  
  const btn = pw.locator('div[role="button"]:has-text("Chuyển ngay")').first()
  console.log('Chuyển ngay count:', await btn.count())
  if (await btn.count() > 0) {
    await btn.click()
    console.log('Clicked, waiting 2s...')
    await pw.waitForTimeout(2000)
    await pw.screenshot({ path: '/tmp/after_chuyen_ngay.png' })
    console.log('Screenshot saved: /tmp/after_chuyen_ngay.png')
    console.log('URL after click:', pw.url())
    
    // Check for modal or dialog
    const dialogs = await pw.evaluate(() =>
      Array.from(document.querySelectorAll('[role="dialog"], [aria-modal="true"]'))
        .map(d => d.getAttribute('role') + '|' + d.textContent?.trim().slice(0, 100))
    )
    console.log('Dialogs:', dialogs)
    
    // Check if we navigated to a different URL
    // Try navigating to groups page
    await pw.goto(fbPageUrl + 'groups/', { waitUntil: 'domcontentloaded', timeout: 20000 })
    await pw.waitForTimeout(3000)
    await pw.screenshot({ path: '/tmp/after_switch_groups.png' })
    console.log('Groups URL screenshot: /tmp/after_switch_groups.png')
    console.log('Groups URL:', pw.url())
    console.log('Title:', await pw.title())

    const links = await pw.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href*="/groups/"]')).map(a => {
        const h = (a as HTMLAnchorElement).href.replace('https://www.facebook.com','')
        const t = (a.getAttribute('aria-label') || a.textContent?.trim())?.slice(0, 60)
        return h + ' | ' + t
      }).slice(0, 15)
    })
    console.log('Group links:')
    links.forEach((l, i) => console.log(i+1, l))
  }

  await browser.close()
}
main().catch(e => { console.error(e.message); process.exit(1) })
