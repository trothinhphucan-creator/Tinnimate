/**
 * Alert Webhook — gửi cảnh báo qua Telegram khi có sự kiện quan trọng.
 *
 * Triggers:
 *   - Fanpage LOGGED_OUT → alert ngay
 *   - Queue depth fb-analyze > 100
 *   - Gemini error rate > 10%
 *   - Crisis post detected
 */

import { env } from '../config/environment-schema.js'
import { logger } from '../lib/pino-structured-logger.js'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? ''
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? ''

async function sendTelegram(message: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    logger.debug({ message: message.slice(0, 50) }, 'Telegram not configured — alert skipped')
    return
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    })
    if (!res.ok) {
      logger.warn({ status: res.status }, 'Telegram send failed')
    }
  } catch (err) {
    logger.warn({ err: (err as Error).message }, 'Telegram send error')
  }
}

export async function alertPageLoggedOut(pageLabel: string, pageId: string): Promise<void> {
  const msg = [
    `🔴 *TinniMate Worker Alert*`,
    ``,
    `Fanpage bị đăng xuất!`,
    `📛 Page: *${pageLabel}*`,
    `🔑 ID: \`${pageId}\``,
    ``,
    `Vào Admin UI để đăng nhập lại: https://tinnimate.vuinghe.com/admin/social-listening/pages`,
  ].join('\n')

  logger.warn({ pageId, pageLabel }, 'ALERT: page logged out')
  await sendTelegram(msg)
}

export async function alertCrisisPost(postId: string, snippet: string): Promise<void> {
  const msg = [
    `⚠️ *TinniMate — CRISIS POST DETECTED*`,
    ``,
    `Phát hiện bài viết có dấu hiệu tự hại!`,
    `📝 Post ID: \`${postId}\``,
    `💬 Snippet: _"${snippet.slice(0, 100)}"_`,
    ``,
    `Review ngay: https://tinnimate.vuinghe.com/admin/social-listening/queue`,
  ].join('\n')

  logger.warn({ postId }, 'ALERT: crisis post')
  await sendTelegram(msg)
}

export async function alertQueueDepth(queueName: string, depth: number): Promise<void> {
  const msg = [
    `⚠️ *TinniMate Worker — Queue Backlog*`,
    ``,
    `Queue \`${queueName}\` backlog: *${depth} jobs*`,
    `Worker có thể bị chậm hoặc stuck.`,
  ].join('\n')

  logger.warn({ queueName, depth }, 'ALERT: queue backlog')
  await sendTelegram(msg)
}

/**
 * Periodic monitor — chạy mỗi 5 phút để check health.
 */
export function startPeriodicMonitor(): void {
  const INTERVAL_MS = 5 * 60 * 1000

  const check = async () => {
    try {
      // Check page statuses — alert LOGGED_OUT pages
      const { getSupabaseServiceClient } = await import('../db/supabase-service-role-client.js')
      const db = getSupabaseServiceClient()

      const { data: loggedOutPages } = await db
        .from('fb_pages')
        .select('id, label, status, last_active_at')
        .eq('status', 'LOGGED_OUT')

      for (const p of (loggedOutPages ?? []) as Array<{ id: string; label: string }>) {
        await alertPageLoggedOut(p.label, p.id)
      }

      // Check queue depth
      const { getScrapeQueue, getAnalyzeQueue } = await import('../queue/bullmq-config.js')
      const scrapeDepth = await getScrapeQueue().count()
      const analyzeDepth = await getAnalyzeQueue().count()

      if (analyzeDepth > 100) await alertQueueDepth('fb-analyze', analyzeDepth)
      if (scrapeDepth > 50) await alertQueueDepth('fb-scrape', scrapeDepth)

      logger.debug({ scrapeDepth, analyzeDepth }, 'Periodic health check done')
    } catch (err) {
      logger.error({ err: (err as Error).message }, 'Periodic monitor check failed')
    }
  }

  setInterval(() => void check(), INTERVAL_MS)
  logger.info({ intervalMs: INTERVAL_MS }, 'Periodic monitor started')
}
