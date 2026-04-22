/**
 * Facebook Session Manager
 *
 * Load/save/validate Playwright storageState từ Supabase fb_pages.session_cookie_enc.
 * Cookie lưu mã hóa AES-256-GCM (xem session-cookie-encryption.ts).
 *
 * Flow:
 *   1. loadSession(pageId) → decrypt → trả Playwright storageState object
 *   2. saveSession(pageId, context) → lấy storageState → encrypt → upsert DB
 *   3. validateSession(pageId) → mở tab FB → check URL → nếu redirect về login → LOGGED_OUT
 */

import type { BrowserContext } from 'playwright'
import { encryptStorageState, decryptStorageState } from '../lib/session-cookie-encryption.js'
import { getSupabaseServiceClient, type FbPageRow } from '../db/supabase-service-role-client.js'
import { logger } from '../lib/pino-structured-logger.js'

export type StorageState = {
  cookies: Array<{
    name: string
    value: string
    domain: string
    path: string
    expires: number
    httpOnly: boolean
    secure: boolean
    sameSite: string
  }>
  origins: Array<{
    origin: string
    localStorage: Array<{ name: string; value: string }>
  }>
}

/**
 * Load session cookie từ DB, decrypt và trả về storageState.
 * Throws nếu page không tồn tại hoặc không có session.
 */
export async function loadSession(pageId: string): Promise<StorageState> {
  const db = getSupabaseServiceClient()
  const { data, error } = await db
    .from('fb_pages')
    .select('id, label, session_cookie_enc, status')
    .eq('id', pageId)
    .single()

  if (error || !data) {
    throw new Error(`fb_pages not found: ${pageId} — ${error?.message}`)
  }

  const row = data as Pick<FbPageRow, 'id' | 'label' | 'session_cookie_enc' | 'status'>

  if (!row.session_cookie_enc) {
    throw new Error(`Page "${row.label}" (${pageId}) has no session cookie stored`)
  }

  // PostgREST returns bytea as hex string prefixed with \x
  const hexStr = row.session_cookie_enc as unknown as string
  const blob = Buffer.from(hexStr.startsWith('\\x') ? hexStr.slice(2) : hexStr, 'hex')

  try {
    const state = decryptStorageState<StorageState>(blob)
    logger.debug({ pageId, label: row.label, cookieCount: state.cookies.length }, 'Session loaded')
    return state
  } catch (err) {
    throw new Error(`Failed to decrypt session for page ${pageId}: ${(err as Error).message}`)
  }
}

/**
 * Lưu session hiện tại của browser context vào DB (sau login hoặc refresh).
 */
export async function saveSession(pageId: string, context: BrowserContext): Promise<void> {
  const state = await context.storageState()
  const encrypted = encryptStorageState(state)

  // PostgREST expects hex string prefixed with \x for bytea
  const hexValue = `\\x${encrypted.toString('hex')}`

  const db = getSupabaseServiceClient()
  const { error } = await db
    .from('fb_pages')
    .update({
      session_cookie_enc: hexValue as unknown as Buffer, // type coercion for PostgREST
      status: 'ONLINE',
      last_active_at: new Date().toISOString(),
      last_error: null,
    })
    .eq('id', pageId)

  if (error) {
    throw new Error(`Failed to save session for page ${pageId}: ${error.message}`)
  }

  logger.info({ pageId, cookieCount: state.cookies.length }, 'Session saved')
}

/**
 * Validate session bằng cách mở facebook.com và kiểm tra URL redirect.
 * Returns: 'valid' | 'expired'
 */
export async function validateSession(
  pageId: string,
  context: BrowserContext,
): Promise<'valid' | 'expired'> {
  const page = await context.newPage()
  try {
    await page.goto('https://www.facebook.com', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    })
    await page.waitForTimeout(2000)

    const url = page.url()
    const isLoggedOut =
      url.includes('/login') ||
      url.includes('checkpoint') ||
      url.includes('two_step_verification')

    if (isLoggedOut) {
      logger.warn({ pageId, url }, 'Session expired — FB redirected to login')
      await markPageStatus(pageId, 'LOGGED_OUT', 'Session expired: redirected to login')
      return 'expired'
    }

    logger.debug({ pageId }, 'Session valid')
    await markPageStatus(pageId, 'ONLINE')
    return 'valid'
  } finally {
    await page.close()
  }
}

/**
 * Helper: update fb_pages.status.
 */
export async function markPageStatus(
  pageId: string,
  status: FbPageRow['status'],
  error?: string,
): Promise<void> {
  const db = getSupabaseServiceClient()
  await db
    .from('fb_pages')
    .update({
      status,
      last_error: error ?? null,
      last_active_at: new Date().toISOString(),
    })
    .eq('id', pageId)
}

/**
 * Round-robin: trả về 1 pageId ONLINE từ danh sách, rotate theo call.
 * State trong memory (worker là single process).
 */
const _rrState = { idx: 0 }

export async function pickOnlinePage(): Promise<string | null> {
  const db = getSupabaseServiceClient()
  const { data } = await db
    .from('fb_pages')
    .select('id')
    .eq('status', 'ONLINE')
    .order('last_active_at', { ascending: true })

  if (!data || data.length === 0) return null
  const rows = data as { id: string }[]
  const picked = rows[_rrState.idx % rows.length]
  _rrState.idx = (_rrState.idx + 1) % rows.length
  return picked.id
}
