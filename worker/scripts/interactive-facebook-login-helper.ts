#!/usr/bin/env tsx
/**
 * interactive-facebook-login-helper.ts
 *
 * Chạy trên **laptop dev có GUI** để đăng nhập Facebook thay cho MiniPC headless.
 * Sau khi đăng nhập xong, cookie được mã hóa và lưu vào Supabase DB tự động.
 *
 * Usage:
 *   npm run login:helper -- --pageId=<fb_pages.id>
 *   npm run login:helper -- --pageId=<fb_pages.id> --timeout=300
 *
 * Cần các env:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   FB_COOKIE_ENCRYPTION_KEY (AES-256 key, 64 hex chars)
 *
 * Đọc từ .env hoặc export trực tiếp.
 */

import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { createClient } from '@supabase/supabase-js'
import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'

// Load .env from worker root
const envPath = path.resolve(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const [k, ...v] = line.split('=')
    if (k && v.length) process.env[k.trim()] = v.join('=').trim().replace(/^['"]|['"]$/g, '')
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const ENCRYPTION_KEY = process.env.FB_COOKIE_ENCRYPTION_KEY ?? ''
const TIMEOUT_MS = Number(getArg('--timeout') ?? '300') * 1000 // default 5 min

function getArg(name: string): string | null {
  const arg = process.argv.find(a => a.startsWith(`${name}=`))
  return arg ? arg.split('=').slice(1).join('=') : null
}

const PAGE_ID = getArg('--pageId')

if (!PAGE_ID) {
  console.error('❌ Missing --pageId argument\n   Usage: npm run login:helper -- --pageId=<fb_pages.id>')
  process.exit(1)
}
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 64) {
  console.error('❌ FB_COOKIE_ENCRYPTION_KEY must be 64 hex chars (256-bit AES key)')
  process.exit(1)
}

// ── Crypto helpers (same as facebook-session-manager.ts) ────────────────────
function encryptAES256GCM(plaintext: string, hexKey: string): string {
  const key = Buffer.from(hexKey, 'hex')
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return JSON.stringify({
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    data: enc.toString('hex'),
  })
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const db = createClient(SUPABASE_URL, SUPABASE_KEY)

  // Fetch page label
  const { data: page, error } = await db
    .from('fb_pages')
    .select('id, label, status')
    .eq('id', PAGE_ID)
    .single()

  if (error || !page) {
    console.error(`❌ fb_pages row not found for id=${PAGE_ID}`)
    process.exit(1)
  }

  console.log(`\n🚀 Facebook Login Helper — TinniMate`)
  console.log(`📛 Fanpage: ${(page as { label: string }).label} (${PAGE_ID})`)
  console.log('━'.repeat(55))

  // Launch headful Chromium on this machine
  chromium.use(StealthPlugin())
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--start-maximized',
    ],
  })
  const context = await browser.newContext({
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    viewport: { width: 1280, height: 800 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  })
  const page_ = await context.newPage()

  await page_.goto('https://www.facebook.com/login', { waitUntil: 'domcontentloaded' })

  console.log('\n📌 Hướng dẫn:')
  console.log('   1. Cửa sổ Chrome đã mở — đăng nhập tài khoản Facebook của fanpage')
  console.log('   2. Nhập email + mật khẩu, xác nhận 2FA nếu cần')
  console.log('   3. Sau khi vào được trang chủ FB → script tự động lưu cookie')
  console.log('   4. ĐỪNG đóng cửa sổ Chrome thủ công\n')

  const startedAt = Date.now()
  let savedOk = false

  while (Date.now() - startedAt < TIMEOUT_MS) {
    await new Promise(r => setTimeout(r, 2_500))
    if (page_.isClosed()) {
      console.error('❌ Browser tab bị đóng sớm')
      break
    }

    const url = page_.url()

    // 2FA checkpoint
    if (url.includes('two_step_verification') || url.includes('checkpoint')) {
      process.stdout.write('\r⏳ Đang chờ bạn xác nhận 2FA...')
      continue
    }

    // Logged in
    if (
      url.includes('facebook.com/') &&
      !url.includes('/login') &&
      !url.includes('/checkpoint')
    ) {
      console.log('\n✅ Đã đăng nhập! Đang trích xuất cookie...')

      const cookies = await context.cookies('https://www.facebook.com')
      const cUser = cookies.find(c => c.name === 'c_user')
      const fbUserId = cUser?.value ?? null

      // Build storageState-compatible JSON
      const storageState = JSON.stringify({
        cookies: cookies.map(c => ({ ...c, sameSite: c.sameSite ?? 'Lax' })),
        origins: [],
      })

      const encrypted = encryptAES256GCM(storageState, ENCRYPTION_KEY)

      // Save to Supabase
      const { error: upsertErr } = await db.from('fb_pages').update({
        encrypted_session: encrypted,
        fb_user_id: fbUserId,
        status: 'ONLINE',
        last_active_at: new Date().toISOString(),
        last_error: null,
      }).eq('id', PAGE_ID)

      if (upsertErr) {
        console.error(`❌ Supabase update failed: ${upsertErr.message}`)
      } else {
        console.log(`✅ Cookie đã lưu vào DB (fb_user_id=${fbUserId ?? '?'})`)
        console.log(`✅ Fanpage "${(page as { label: string }).label}" → ONLINE`)
        savedOk = true
      }

      break
    }

    process.stdout.write('\r⏳ Chờ đăng nhập...')
  }

  await browser.close()

  if (!savedOk) {
    console.error('\n⏰ Timeout hoặc đăng nhập thất bại. Thử lại bằng cách chạy lại lệnh.')
    process.exit(1)
  }

  console.log('\n🎉 Hoàn tất! Bây giờ vào Admin UI:')
  console.log('   https://tinnimate.vuinghe.com/admin/social-listening/pages')
  console.log('   → Fanpage nên hiển thị status ONLINE\n')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
