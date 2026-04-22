/**
 * Scrape Producer — đọc fb_target_sources enabled → đẩy job vào BullMQ theo cron.
 *
 * Schedule: SCRAPE_CRON env (default: "0 8,14,20 * * *" = 8h, 14h, 20h hàng ngày)
 * Mỗi source được pair với 1 fb_pages ONLINE (round-robin).
 */

import { Cron } from 'croner'
import { getScrapeQueue, type ScrapeJobPayload } from './bullmq-config.js'
import { getSupabaseServiceClient } from '../db/supabase-service-role-client.js'
import { pickOnlinePage } from '../browser/facebook-session-manager.js'
import { logger } from '../lib/pino-structured-logger.js'
import { env } from '../config/environment-schema.js'

export function startScrapeProducer(): void {
  const cron = new Cron(
    env.SCRAPE_CRON,
    { timezone: 'Asia/Ho_Chi_Minh', protect: true },
    async () => {
      logger.info({ cron: env.SCRAPE_CRON }, 'Scrape producer triggered')
      await enqueueAllSources()
    },
  )

  logger.info({ cron: env.SCRAPE_CRON }, 'Scrape cron scheduled')

  // Cleanup
  process.on('SIGTERM', () => cron.stop())
  process.on('SIGINT', () => cron.stop())
}

/**
 * Force-run: dùng cho endpoint /worker/scrape/run-now (manual trigger từ admin UI).
 */
export async function enqueueAllSources(): Promise<{ queued: number; skipped: number }> {
  const db = getSupabaseServiceClient()
  const queue = getScrapeQueue()

  const { data: sources, error } = await db
    .from('fb_target_sources')
    .select('id, type, fb_url, label, keywords')
    .eq('enabled', true)

  if (error || !sources) {
    logger.error({ error: error?.message }, 'Failed to fetch fb_target_sources')
    return { queued: 0, skipped: 0 }
  }

  let queued = 0
  let skipped = 0

  for (const source of sources as Array<{
    id: string
    type: string
    fb_url: string | null
    label: string
    keywords: string[]
  }>) {
    // Chọn page ONLINE theo round-robin
    const pageId = await pickOnlinePage()
    if (!pageId) {
      logger.warn({ sourceId: source.id }, 'No ONLINE fb_pages — skipping source')
      skipped++
      continue
    }

    const payload: ScrapeJobPayload = {
      sourceId: source.id,
      pageId,
      sourceType: source.type as ScrapeJobPayload['sourceType'],
      fbUrl: source.fb_url,
      keywords: source.keywords,
      label: source.label,
    }

    try {
      await queue.add(`scrape:${source.id}`, payload, {
        jobId: `scrape:${source.id}:${Date.now()}`,
        // Delay nhỏ stagger giữa các source (30s * index) — tránh parallel
        delay: queued * 30_000,
      })
      queued++
      logger.debug({ sourceId: source.id, pageId, label: source.label }, 'Job queued')
    } catch (err) {
      logger.error({ sourceId: source.id, err: (err as Error).message }, 'Failed to queue job')
      skipped++
    }
  }

  logger.info({ queued, skipped, totalSources: sources.length }, 'Enqueue run complete')
  return { queued, skipped }
}
