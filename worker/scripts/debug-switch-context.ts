/**
 * debug-switch-context.ts
 * Debug what happens after clicking "Chuyển" button
 */
import 'dotenv/config'
import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { loadSession } from '../src/browser/facebook-session-manager.js'
import { writeFileSync } from 'fs'

const pageId = 'b994e12a-d681-4c68-8ab4-f56ccb45da97'
const fbPageUrl = 'https://www.facebook.com/TinniAI/'

async function shot(pw: import('playwright').Page, name: string) {
  await pw.screenshot({ path: `/tmp/debug_${name}.png` })
  console.log(`📸 /tmp/debug_${name}.png — URL: ${pw.url()}`)
}

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
  await pw.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 20_000 })
  if (pw.url().includes('/login')) { console.error('Session expired'); process.exit(1) }

  console.log('Step 1: Navigate to Page')
  await pw.goto(fbPageUrl, { waitUntil: 'domcontentloaded', timeout: 25_000 })
  await pw.waitForTimeout(2000)
  await shot(pw, '1_page_initial')

  // Find and click the Chuyển button
  console.log('\nStep 2: Looking for Chuyển button...')
  const btns = await pw.evaluate(() => {
    return Array.from(document.querySelectorAll('div[role="button"], button'))
      .filter(b => b.textContent?.includes('Chuyển') || b.textContent?.includes('Switch'))
      .map(b => ({ text: b.textContent?.trim()?.slice(0, 80), class: b.className.slice(0, 60) }))
  })
  console.log('Chuyển buttons found:', btns.length)
  btns.forEach((b, i) => console.log(i+1, b.text, '|', b.class))

  // Click the button
  const btn = pw.locator('div[role="button"]:has-text("Chuyển")').first()
  if (await btn.count() > 0) {
    await btn.click()
    await pw.waitForTimeout(2000)
    await shot(pw, '2_after_chuyen_click')

    // Check what appeared
    const newBtns = await pw.evaluate(() => {
      return Array.from(document.querySelectorAll('div[role="button"], a[role="button"]'))
        .filter(b => b.textContent?.trim().length! > 0)
        .map(b => b.textContent?.trim()?.slice(0, 60))
        .filter(t => t && t.length > 2)
        .slice(0, 20)
    })
    console.log('\nButtons/links after click:', newBtns)
  }

  // Try navigating with act= param (Page numeric ID)
  // First get the Page ID from HTML
  const pageNumericId = await pw.evaluate(() => {
    const html = document.documentElement.innerHTML
    const patterns = [/"pageID"\s*:\s*"(\d+)"/, /"page_id"\s*:\s*"(\d+)"/]
    for (const p of patterns) { const m = html.match(p); if (m) return m[1] }
    return null
  })
  console.log('\nPage numeric ID from HTML:', pageNumericId)

  if (pageNumericId) {
    // Strategy: use act= param to switch to page context for groups
    const actUrl = `https://www.facebook.com/groups/?category=joined&act=${pageNumericId}`
    console.log('\nStep 3: Try act= URL:', actUrl)
    await pw.goto(actUrl, { waitUntil: 'domcontentloaded', timeout: 20_000 })
    await pw.waitForTimeout(3000)
    await shot(pw, '3_groups_with_act')

    const groupLinks = await pw.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href*="/groups/"]')).map(a => ({
        href: (a as HTMLAnchorElement).href.replace('https://www.facebook.com',''),
        text: (a.getAttribute('aria-label') || a.textContent?.trim())?.slice(0, 60)
      })).slice(0, 15)
    })
    console.log('Groups with act= param:', groupLinks.length)
    groupLinks.forEach((g, i) => console.log(i+1, g.href, '|', g.text))
  }

  await browser.close()
}
main().catch(e => { console.error(e.message); process.exit(1) })
