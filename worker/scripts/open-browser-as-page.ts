/**
 * open-browser-as-page.ts
 *
 * Mở trình duyệt Facebook đã đăng nhập, switch sang Page context.
 * Dùng để manually join groups từ danh tính Fanpage.
 *
 * Usage: npx tsx scripts/open-browser-as-page.ts --pageId=<uuid>
 */

import 'dotenv/config'
import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { loadSession } from '../src/browser/facebook-session-manager.js'

const args = process.argv.slice(2)
const pageIdArg = args.find(a => a.startsWith('--pageId='))
const pageId = pageIdArg?.split('=')[1]

if (!pageId) {
  console.error('❌ Thiếu --pageId=<uuid>\n   Ví dụ: npx tsx scripts/open-browser-as-page.ts --pageId=b994e12a-...')
  process.exit(1)
}

async function main() {
  console.log(`\n🔓 Loading session for page: ${pageId}`)
  const storageState = await loadSession(pageId!)
  if (!storageState) {
    console.error('❌ Không tìm thấy session — hãy đăng nhập trong Admin UI trước')
    process.exit(1)
  }

  chromium.use(StealthPlugin())
  const browser = await chromium.launch({
    headless: false,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH,
    args: [
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1280,900',
      '--window-position=50,50',
    ],
  })

  const context = await browser.newContext({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    storageState: storageState as any,
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  })

  const page = await context.newPage()

  // Verify session
  console.log('📡 Đang mở Facebook...')
  await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 20_000 })

  if (page.url().includes('/login')) {
    console.error('❌ Session hết hạn — hãy đăng nhập lại trong Admin UI')
    await browser.close()
    process.exit(1)
  }

  console.log('✅ Đã đăng nhập!\n')
  console.log('📋 HƯỚNG DẪN:')
  console.log('1. Trong trình duyệt đang mở, click vào avatar góc phải')
  console.log('2. Chọn "Chuyển tài khoản" → chọn trang TinniAI')
  console.log('3. Vào facebook.com/groups và tìm nhóm cần tham gia')
  console.log('4. Nhấn "Tham gia nhóm" với danh tính TinniAI Page')
  console.log('5. Sau khi join xong → quay lại Admin UI → Quét nhóm\n')
  console.log('⏸  Trình duyệt sẽ mở cho đến khi bạn đóng tay.')
  console.log('   Nhấn Ctrl+C để thoát script (browser vẫn mở).\n')

  // Navigate to groups discovery with Page context helper
  // First get the page numeric ID to offer context switch
  const pageInfo = await page.evaluate(() => {
    // Try to find stored page switch options
    return {
      currentUser: document.querySelector('[aria-label="Tài khoản của bạn"]')?.getAttribute('aria-label'),
    }
  }).catch(() => ({ currentUser: null }))

  console.log(`👤 Đang đăng nhập với: ${pageInfo.currentUser ?? 'tài khoản Facebook'}`)

  // Navigate to groups discovery
  await page.goto('https://www.facebook.com/groups/discover/', { waitUntil: 'domcontentloaded' })

  console.log('\n🌐 Trình duyệt đang ở trang Khám phá Nhóm.')
  console.log('   Hãy switch sang Page TinniAI và tìm nhóm để tham gia.\n')

  // Keep alive
  await new Promise(() => {}) // Wait forever until Ctrl+C
}

main().catch(e => {
  console.error('Error:', e.message)
  process.exit(1)
})
