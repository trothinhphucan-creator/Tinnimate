/**
 * Facebook Login Flow — Headful browser login + cookie capture.
 *
 * Được gọi từ admin UI qua HTTP API:
 *   POST /worker/login/start          → mở browser, trả loginId
 *   GET  /worker/login/:id/status     → poll trạng thái + logs + instruction
 *   GET  /worker/login/:id/screenshot → snapshot trang đang hiển thị (PNG base64)
 *
 * MiniPC headless: cần Xvfb (xvfb-run wrapper trong systemd unit) hoặc
 * dùng `npm run login:helper -- --pageId=<id>` chạy trên laptop dev.
 *
 * Nếu DISPLAY env không set → trả NEEDS_HELPER ngay với instruction script.
 */

import type { BrowserContext } from 'playwright'
import { launchStealthBrowser } from './launch-stealth-browser.js'
import { saveSession, markPageStatus } from './facebook-session-manager.js'
import { logger } from '../lib/pino-structured-logger.js'

export type LoginLogEntry = { ts: string; level: 'info' | 'warn' | 'error'; msg: string }

export type LoginStatus =
  | 'PENDING'         // browser đang khởi động
  | 'AWAITING_USER'   // chờ user nhập credentials
  | 'WAITING_2FA'     // FB yêu cầu 2FA
  | 'SUCCESS'
  | 'FAILED'
  | 'TIMEOUT'
  | 'NEEDS_HELPER'    // MiniPC headless — yêu cầu chạy helper trên dev machine

export type LoginSession = {
  id: string
  pageId: string
  label: string
  status: LoginStatus
  errorMessage?: string
  currentInstruction: string
  logs: LoginLogEntry[]
  screenshotBase64: string | null   // PNG, refresh mỗi ~3s khi đang chạy
  startedAt: Date
  context?: BrowserContext
}

const _activeSessions = new Map<string, LoginSession>()

const SCREENSHOT_INTERVAL_MS = 3_000
const TIMEOUT_MS = 5 * 60 * 1000
const POLL_MS = 2_000
const SESSION_TTL_MS = 10 * 60 * 1000

function appendLog(session: LoginSession, level: LoginLogEntry['level'], msg: string): void {
  session.logs.push({ ts: new Date().toISOString(), level, msg })
  // Cap để không phình memory
  if (session.logs.length > 200) session.logs.shift()
  logger[level]({ loginId: session.id }, `[login] ${msg}`)
}

function setInstruction(session: LoginSession, text: string): void {
  session.currentInstruction = text
}

/**
 * Bắt đầu login session. Returns loginId để client poll.
 */
export async function startFacebookLogin(pageId: string, label: string): Promise<string> {
  const loginId = `login-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  const session: LoginSession = {
    id: loginId,
    pageId,
    label,
    status: 'PENDING',
    currentInstruction: 'Đang khởi động trình duyệt trên worker host...',
    logs: [],
    screenshotBase64: null,
    startedAt: new Date(),
  }
  _activeSessions.set(loginId, session)

  appendLog(session, 'info', `Login started for fanpage "${label}"`)

  // Kiểm tra DISPLAY trước khi launch
  if (!process.env.DISPLAY) {
    session.status = 'NEEDS_HELPER'
    setInstruction(
      session,
      'MiniPC không có màn hình (DISPLAY chưa set).\n\n' +
        'Cách 1 — dùng helper trên laptop dev:\n' +
        `  cd worker && npm run login:helper -- --pageId=${pageId}\n` +
        '  → Browser sẽ mở trên laptop, đăng nhập xong cookie tự sync về DB.\n\n' +
        'Cách 2 — chạy worker dưới Xvfb (systemd unit có sẵn):\n' +
        '  sudo systemctl restart tinnimate-fb-worker\n' +
        '  → Sau đó bấm lại "Đăng nhập".',
    )
    appendLog(session, 'warn', 'No DISPLAY env — falling back to helper instructions')
    cleanupLater(loginId)
    return loginId
  }

  // Run async — không await
  runLoginFlow(session).catch((err) => {
    session.status = 'FAILED'
    session.errorMessage = err instanceof Error ? err.message : String(err)
    appendLog(session, 'error', `Login crashed: ${session.errorMessage}`)
  })

  return loginId
}

/**
 * Trả về snapshot session để admin UI poll.
 * Loại bỏ context (Playwright object không serialize được).
 */
export function getLoginStatus(loginId: string): Omit<LoginSession, 'context'> | undefined {
  const s = _activeSessions.get(loginId)
  if (!s) return undefined
  const { context: _ctx, ...rest } = s
  return rest
}

/**
 * Trả screenshot PNG hiện tại (raw base64, không có data URI prefix).
 */
export function getLoginScreenshot(loginId: string): string | null {
  return _activeSessions.get(loginId)?.screenshotBase64 ?? null
}

// ── Internal flow ────────────────────────────────────────────────────────────

async function runLoginFlow(session: LoginSession): Promise<void> {
  await markPageStatus(session.pageId, 'CONNECTING')
  appendLog(session, 'info', 'Launching stealth Chromium (headful)')
  setInstruction(session, 'Trình duyệt đang mở trên MiniPC. Chờ Facebook tải...')

  const { browser, context } = await launchStealthBrowser({ headful: true })
  session.context = context
  const page = await context.newPage()

  // Periodic screenshot capture
  const captureTimer = setInterval(async () => {
    if (page.isClosed()) return
    try {
      const buf = await page.screenshot({ type: 'png', fullPage: false })
      session.screenshotBase64 = buf.toString('base64')
    } catch {
      /* page có thể đang navigate, bỏ qua */
    }
  }, SCREENSHOT_INTERVAL_MS)

  try {
    await page.goto('https://www.facebook.com/login', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    })
    appendLog(session, 'info', 'Facebook login page loaded')

    session.status = 'AWAITING_USER'
    setInstruction(
      session,
      'Vào MiniPC qua VNC/x11-forwarding để nhập email + mật khẩu.\n' +
        'Hoặc nếu xem được screenshot bên dưới, đứng từ máy đang xem màn hình MiniPC để nhập.',
    )

    const startedAt = Date.now()

    while (Date.now() - startedAt < TIMEOUT_MS) {
      await page.waitForTimeout(POLL_MS)
      if (page.isClosed()) throw new Error('Browser tab bị đóng đột ngột')

      const url = page.url()

      // 2FA / checkpoint
      if (url.includes('two_step_verification') || url.includes('checkpoint')) {
        if (session.status !== 'WAITING_2FA') {
          session.status = 'WAITING_2FA'
          setInstruction(session, 'FB yêu cầu mã 2FA / checkpoint. Nhập mã trên màn hình MiniPC.')
          appendLog(session, 'info', '2FA / checkpoint detected')
        }
        continue
      }

      // Đã login (rời /login + không stuck checkpoint)
      if (url.includes('facebook.com/') && !url.includes('/login') && !url.includes('/checkpoint')) {
        appendLog(session, 'info', `Logged in — URL = ${url}`)
        setInstruction(session, 'Đăng nhập thành công, đang lưu session cookie...')

        const cookies = await context.cookies('https://www.facebook.com')
        const cUserCookie = cookies.find((c) => c.name === 'c_user')
        const fbUserId = cUserCookie?.value

        await saveSession(session.pageId, context)

        if (fbUserId) {
          const { getSupabaseServiceClient } = await import('../db/supabase-service-role-client.js')
          const db = getSupabaseServiceClient()
          await db.from('fb_pages').update({ fb_user_id: fbUserId }).eq('id', session.pageId)
          appendLog(session, 'info', `Saved fb_user_id = ${fbUserId}`)
        }

        session.status = 'SUCCESS'
        setInstruction(session, '✓ Hoàn tất. Có thể đóng dialog này.')
        appendLog(session, 'info', 'Session saved to DB')
        return
      }
    }

    session.status = 'TIMEOUT'
    session.errorMessage = 'Login timeout sau 5 phút'
    setInstruction(session, 'Hết giờ chờ. Thử lại từ đầu.')
    await markPageStatus(session.pageId, 'ERROR', session.errorMessage)
    appendLog(session, 'warn', 'Timeout reached')
  } catch (err) {
    session.status = 'FAILED'
    session.errorMessage = err instanceof Error ? err.message : String(err)
    setInstruction(session, `Lỗi: ${session.errorMessage}`)
    await markPageStatus(session.pageId, 'ERROR', session.errorMessage)
    appendLog(session, 'error', `Flow error: ${session.errorMessage}`)
    throw err
  } finally {
    clearInterval(captureTimer)
    await page.close().catch(() => {})
    await browser.close().catch(() => {})
    session.context = undefined
    cleanupLater(session.id)
  }
}

function cleanupLater(loginId: string): void {
  setTimeout(() => _activeSessions.delete(loginId), SESSION_TTL_MS)
}
