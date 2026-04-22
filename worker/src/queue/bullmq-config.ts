/**
 * BullMQ configuration — Redis connection + queue definitions.
 */

import { Queue, Worker, type ConnectionOptions, type Processor } from 'bullmq'
import { env } from '../config/environment-schema.js'

// Parse Redis URL → IORedis connection options
function parseRedisOpts(): ConnectionOptions {
  const url = new URL(env.REDIS_URL)
  return {
    host: url.hostname,
    port: Number(url.port) || 6379,
    password: url.password || undefined,
    db: url.pathname ? Number(url.pathname.slice(1)) || 0 : 0,
    maxRetriesPerRequest: null,  // Required by BullMQ
    enableReadyCheck: false,
  }
}

export const redisOpts = parseRedisOpts()

// ─── Queue names ────────────────────────────────────────────────────────────

export const QUEUE_SCRAPE = 'fb-scrape'
export const QUEUE_ANALYZE = 'fb-analyze'

// ─── Job payloads ────────────────────────────────────────────────────────────

export type ScrapeJobPayload = {
  sourceId: string
  pageId: string
  sourceType: 'GROUP' | 'PAGE' | 'KEYWORD_SEARCH'
  fbUrl: string | null
  keywords: string[]
  label: string
}

export type AnalyzeJobPayload = {
  postId: string
}

// ─── Queue instances (singletons) ────────────────────────────────────────────

let _scrapeQueue: Queue<ScrapeJobPayload> | null = null
let _analyzeQueue: Queue<AnalyzeJobPayload> | null = null

export function getScrapeQueue(): Queue<ScrapeJobPayload> {
  if (!_scrapeQueue) {
    _scrapeQueue = new Queue<ScrapeJobPayload>(QUEUE_SCRAPE, {
      connection: redisOpts,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 60_000 }, // 1m, 2m, 4m
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 200 },
      },
    })
  }
  return _scrapeQueue
}

export function getAnalyzeQueue(): Queue<AnalyzeJobPayload> {
  if (!_analyzeQueue) {
    _analyzeQueue = new Queue<AnalyzeJobPayload>(QUEUE_ANALYZE, {
      connection: redisOpts,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'fixed', delay: 30_000 },
        removeOnComplete: { count: 200 },
        removeOnFail: { count: 300 },
      },
    })
  }
  return _analyzeQueue
}

// ─── Worker factory helper ────────────────────────────────────────────────────

export function createWorker<T>(
  queueName: string,
  processor: Processor<T>,
  concurrency = 1,
): Worker<T> {
  return new Worker<T>(queueName, processor, {
    connection: redisOpts,
    concurrency,
    autorun: false, // Must call .run() manually after setup
  })
}
