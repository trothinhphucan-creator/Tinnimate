/**
 * Facebook Login Flow — Headful browser login + cookie capture.
 *
 * Được gọi từ admin UI qua HTTP API:
 *   POST /worker/login/start   → mở browser, trả loginId
 *   GET  /worker/login/:id/status → poll cho đến khi xong
 *
 * Vì cần giao diện người dùng (nhập mật khẩu/2FA), browser phải headful.
 * Trên server không có màn hình: cần Xvfb (xem systemd unit).
 *
 * Nếu MiniPC không có GUI: dùng script `scripts/interactive-facebook-login-helper.ts`
 * chạy trực tiếp trên laptop → copy cookie vào DB qua HTTP.
 */

import type { BrowserContext } from 'playwright'
import { launchStealthBrowser } from './launch-stealth-browser.js'
import { saveSession, markPageStatus } from './facebook-session-manager.js'
import { logger } from '../lib/pino-structured-logger.js'

export type LoginSession = {
  id: string          // loginId trả về cho admin UI
  pageId: string      // fb_pages.id sẽ cập nhật
  status: 'PENDING' | 'WAITING_2FA' | 'SUCCESS' | 'FAILED' | 'TIMEOUT'
  errorMessage?: string
  startedAt: Date
  context?: BrowserContext
}

// In-memory store cho active login sessions (1 login tại 1 thời điểm)
const _activeSessions = new Map<string, LoginSession>()

/**
 * Bắt đầu một login session headful.
 * Returns loginId để client poll status.
 */
export async function startFacebookLogin(pageId: string, label: string): Promise<string> {
  const loginId = `login-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  const session: LoginSession = {
    id: loginId,
    pageId,
    status: 'PENDING',
    startedAt: new Date(),
  }
  _activeSessions.set(loginId, session)

  logger.info({ loginId, pageId, label }, 'Starting headful Facebook login')

  // Run async — không await (client poll status)
  runLoginFlow(session, label).catch((err) => {
    session.status = 'FAILED'
    session.errorMessage = err instanceof Error ? err.message : String(err)
    logger.error({ loginId, err: session.errorMessage }, 'Login flow error')
  })

  return loginId
}

/**
 * Lấy trạng thái login session.
 */
export function getLoginStatus(loginId: string): LoginSession | undefined {
  return _activeSessions.get(loginId)
}

/**
 * Internal: chạy toàn bộ flow headful login.
 * Timeout: 5 phút (người dùng nhập credentials + 2FA).
 */
async function runLoginFlow(session: LoginSession, _label: string): Promise<void> {
  await markPageStatus(session.pageId, 'CONNECTING')

  const { browser, context } = await launchStealthBrowser({ headful: true })
  session.context = context

  const page = await context.newPage()

  try {
    await page.goto('https://www.facebook.com/login', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    })

    logger.info({ loginId: session.id }, 'Facebook login page loaded — waiting for user')

    // Poll mỗi 3s, timeout 5 phút
    const TIMEOUT_MS = 5 * 60 * 1000
    const POLL_MS = 3_000
    const startedAt = Date.now()

    while (Date.now() - startedAt < TIMEOUT_MS) {
      await page.waitForTimeout(POLL_MS)

      const url = page.url()

      // Check 2FA prompt
      if (url.includes('two_step_verification') || url.includes('checkpoint')) {
        session.status = 'WAITING_2FA'
        logger.info({ loginId: session.id }, '2FA checkpoint detected — waiting')
        continue
      }

      // Đã đăng nhập thành công (feed hoặc home)
      if (
        url.includes('facebook.com/') &&
        !url.includes('/login') &&
        !url.includes('/checkpoint')
      ) {
        // Extract fb_user_id từ cookie
        const cookies = await context.cookies('https://www.facebook.com')
        const cUserCookie = cookies.find((c) => c.name === 'c_user')
        const fbUserId = cUserCookie?.value

        // Save session to DB
        await saveSession(session.pageId, context)

        // Update fb_user_id
        const { getSupabaseServiceClient } = await import('../db/supabase-service-role-client.js')
        const db = getSupabaseServiceClient()
        if (fbUserId) {
          await db.from('fb_pages').update({ fb_user_id: fbUserId }).eq('id', session.pageId)
        }

        session.status = 'SUCCESS'
        logger.info({ loginId: session.id, fbUserId }, 'Facebook login successful')
        return
      }
    }

    // Timeout
    session.status = 'TIMEOUT'
    session.errorMessage = 'Login timeout after 5 minutes'
    await markPageStatus(session.pageId, 'ERROR', session.errorMessage)
    logger.warn({ loginId: session.id }, 'Login session timed out')
  } catch (err) {
    session.status = 'FAILED'
    session.errorMessage = err instanceof Error ? err.message : String(err)
    await markPageStatus(session.pageId, 'ERROR', session.errorMessage)
    throw err
  } finally {
    await page.close().catch(() => {})
    // Đóng browser nhưng context đã lưu cookie vào DB
    await browser.close().catch(() => {})
    session.context = undefined

    // Cleanup session sau 10 phút
    setTimeout(() => _activeSessions.delete(session.id), 10 * 60 * 1000)
  }
}
