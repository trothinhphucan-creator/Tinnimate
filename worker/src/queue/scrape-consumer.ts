/**
 * Scrape Consumer — BullMQ worker consume job → Playwright scrape → upsert posts.
 *
 * Concurrency: 1 (FB không thích parallel sessions từ cùng IP).
 * Mỗi job:
 *   1. Load session cookie từ DB (pageId)
 *   2. Validate session còn sống
 *   3. Scrape source (group / keyword search)
 *   4. Upsert posts vào fb_posts
 *   5. Enqueue analyze jobs cho posts mới
 *   6. Update fb_scrape_jobs audit log
 */

import { createWorker, getAnalyzeQueue, type ScrapeJobPayload } from './bullmq-config.js'
import { QUEUE_SCRAPE } from './bullmq-config.js'
import { loadSession, validateSession, markPageStatus } from '../browser/facebook-session-manager.js'
import { launchStealthBrowser } from '../browser/launch-stealth-browser.js'
import { scrapeGroupPosts, scrapeKeywordSearch } from '../scraper/scrape-group-posts.js'
import { upsertFbPosts } from '../db/fb-posts-upsert.js'
import { getSupabaseServiceClient } from '../db/supabase-service-role-client.js'
import { logger } from '../lib/pino-structured-logger.js'
import type { Job } from 'bullmq'

export function startScrapeConsumer() {
  const worker = createWorker<ScrapeJobPayload>(
    QUEUE_SCRAPE,
    async (job: Job<ScrapeJobPayload>) => {
      return runScrapeJob(job)
    },
    1, // concurrency = 1
  )

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, sourceId: job.data.sourceId }, 'Scrape job completed')
  })

  worker.on('failed', (job, err) => {
    logger.error(
      { jobId: job?.id, sourceId: job?.data.sourceId, err: err.message },
      'Scrape job failed',
    )
    if (job) {
      updateScrapeJobRecord(job.data.sourceId, job.data.pageId, 'FAILED', { error: err.message })
    }
  })

  worker.run()
  logger.info({ queue: QUEUE_SCRAPE }, 'Scrape consumer started')
  return worker
}

async function runScrapeJob(job: Job<ScrapeJobPayload>) {
  const { sourceId, pageId, sourceType, fbUrl, keywords, label } = job.data
  const db = getSupabaseServiceClient()

  // Create audit record
  const { data: jobRecord } = await db
    .from('fb_scrape_jobs')
    .insert({
      source_id: sourceId,
      page_id: pageId,
      status: 'RUNNING',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  const scrapeJobId = (jobRecord as { id: string } | null)?.id

  const log = logger.child({ jobId: job.id, scrapeJobId, sourceId, label })
  log.info('Running scrape job')

  let browser: Awaited<ReturnType<typeof launchStealthBrowser>>['browser'] | null = null
  let context: Awaited<ReturnType<typeof launchStealthBrowser>>['context'] | null = null

  try {
    // 1. Load + validate session
    const storageState = await loadSession(pageId)
    const launched = await launchStealthBrowser({
      headful: false,
      storageState: storageState as NonNullable<import('../browser/launch-stealth-browser.js').LaunchOptions['storageState']>,
    })
    browser = launched.browser
    context = launched.context

    await markPageStatus(pageId, 'ONLINE')

    const sessionStatus = await validateSession(pageId, context)
    if (sessionStatus === 'expired') {
      throw new Error(`Session expired for page ${pageId}`)
    }

    // 2. Scrape based on source type
    let scrapeResult

    if (sourceType === 'KEYWORD_SEARCH' || !fbUrl) {
      const keyword = keywords[0] ?? 'ù tai'
      log.info({ keyword }, 'Scraping keyword search')
      scrapeResult = await scrapeKeywordSearch(context, keyword, {
        sessionId: job.id ?? 'job',
      })
    } else {
      log.info({ fbUrl }, 'Scraping group/page')
      scrapeResult = await scrapeGroupPosts(context, {
        url: fbUrl,
        keywords,
        sessionId: job.id ?? 'job',
      })
    }

    // 3. Upsert posts
    const upsertResult = await upsertFbPosts(sourceId, scrapeResult.posts)

    // 4. Enqueue analyze jobs cho posts mới (chỉ newInserted)
    if (upsertResult.newInserted > 0) {
      await enqueueAnalyzeForNewPosts(sourceId, upsertResult.newInserted)
    }

    // 5. Update source last_scraped_at
    await db
      .from('fb_target_sources')
      .update({ last_scraped_at: new Date().toISOString() })
      .eq('id', sourceId)

    // 6. Update scrape job record
    await updateScrapeJobRecord(sourceId, pageId, 'DONE', {
      postsFound: scrapeResult.posts.length,
      postsNew: upsertResult.newInserted,
      scrapeJobId,
    })

    log.info(
      {
        collected: scrapeResult.posts.length,
        newInserted: upsertResult.newInserted,
        scrolls: scrapeResult.scrollsDone,
      },
      'Scrape job done',
    )

    return { postsFound: scrapeResult.posts.length, newInserted: upsertResult.newInserted }
  } catch (err) {
    const msg = (err as Error).message
    log.error({ err: msg }, 'Scrape job error')
    await updateScrapeJobRecord(sourceId, pageId, 'FAILED', {
      error: msg,
      scrapeJobId,
    })
    throw err
  } finally {
    await context?.close().catch(() => {})
    await browser?.close().catch(() => {})
  }
}

/**
 * Enqueue analyze jobs cho posts mới nhất của source.
 */
async function enqueueAnalyzeForNewPosts(sourceId: string, limit: number) {
  const db = getSupabaseServiceClient()
  const analyzeQueue = getAnalyzeQueue()

  const { data: newPosts } = await db
    .from('fb_posts')
    .select('id')
    .eq('source_id', sourceId)
    .eq('status', 'NEW')
    .order('scraped_at', { ascending: false })
    .limit(limit)

  if (!newPosts?.length) return

  for (const p of newPosts as { id: string }[]) {
    await analyzeQueue.add(
      `analyze:${p.id}`,
      { postId: p.id },
      { jobId: `analyze:${p.id}` },
    ).catch((err) =>
      logger.warn({ postId: p.id, err: (err as Error).message }, 'Failed to queue analyze job'),
    )
  }

  logger.debug({ queued: newPosts.length }, 'Analyze jobs queued for new posts')
}

async function updateScrapeJobRecord(
  sourceId: string,
  pageId: string,
  status: 'DONE' | 'FAILED',
  extra: {
    postsFound?: number
    postsNew?: number
    error?: string
    scrapeJobId?: string
  } = {},
) {
  const db = getSupabaseServiceClient()
  const updateData: Record<string, unknown> = {
    status,
    finished_at: new Date().toISOString(),
  }
  if (extra.postsFound !== undefined) updateData.posts_found = extra.postsFound
  if (extra.postsNew !== undefined) updateData.posts_new = extra.postsNew
  if (extra.error) updateData.error = extra.error.slice(0, 500)

  if (extra.scrapeJobId) {
    await db.from('fb_scrape_jobs').update(updateData).eq('id', extra.scrapeJobId)
  } else {
    // Fallback: update most recent job for this source
    await db
      .from('fb_scrape_jobs')
      .update(updateData)
      .eq('source_id', sourceId)
      .eq('status', 'RUNNING')
      .order('created_at', { ascending: false })
      .limit(1)
  }
}
