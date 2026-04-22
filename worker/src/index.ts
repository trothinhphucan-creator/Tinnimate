/**
 * TinniMate FB Social Listening Worker — entrypoint (Phase 02).
 *
 * Khởi động:
 *   1. Verify MCP connectivity
 *   2. Start BullMQ scrape consumer (concurrency=1)
 *   3. Start cron producer (8h, 14h, 20h VN)
 *   4. HTTP server với các endpoints cho admin UI
 */

import express, { type Request, type Response } from 'express'
import { env } from './config/environment-schema.js'
import { logger } from './lib/pino-structured-logger.js'
import { mcpGetStoreStats } from './lib/agentsee-mcp-http-client.js'
import { startScrapeConsumer } from './queue/scrape-consumer.js'
import { startScrapeProducer, enqueueAllSources } from './queue/scrape-producer.js'
import { startAnalyzeConsumer } from './pipeline/analyze-post-job.js'
import { startFacebookLogin, getLoginStatus, getLoginScreenshot } from './browser/facebook-login-flow.js'
import { getSupabaseServiceClient } from './db/supabase-service-role-client.js'
import { markPageStatus } from './browser/facebook-session-manager.js'
import { geminiUsage } from './ai/gemini-client.js'
import { startPeriodicMonitor } from './monitoring/alert-webhook.js'
import { postFbCommentForReply } from './browser/post-fb-comment.js'
import { scanJoinedGroups } from './browser/scan-joined-groups.js'

async function main() {
  logger.info(
    {
      nodeEnv: env.NODE_ENV,
      port: env.WORKER_HTTP_PORT,
      mcpUrl: env.AGENTSEE_MCP_URL,
      scrapeCron: env.SCRAPE_CRON,
    },
    'Booting FB social listening worker (Phase 02)',
  )

  // 1. Verify MCP reachable on startup
  try {
    const stats = await mcpGetStoreStats()
    logger.info({ stats }, 'AgentSee MCP reachable ✓')
  } catch (err) {
    logger.warn(
      { err: err instanceof Error ? err.message : err },
      'AgentSee MCP unreachable on boot — reply pipeline will fail until fixed',
    )
  }

  // 2. Start BullMQ consumers
  startScrapeConsumer()
  startAnalyzeConsumer()

  // 3. Start cron producer
  startScrapeProducer()

  // 4. Start periodic health monitor (Telegram alerts)
  startPeriodicMonitor()

  // 4. HTTP server
  const app = express()
  app.use(express.json({ limit: '1mb' }))

  // Auth middleware (X-Worker-Key). Skip /health & /metrics
  app.use((req: Request, res: Response, next) => {
    if (req.path === '/health' || req.path === '/metrics') return next()
    const key = req.header('x-worker-key')
    if (key !== env.WORKER_SHARED_SECRET) {
      res.status(401).json({ error: 'unauthorized' })
      return
    }
    next()
  })

  // ── Health ─────────────────────────────────────────────────────────────────
  app.get('/health', async (_req: Request, res: Response) => {
    let mcpOk = false
    try {
      await mcpGetStoreStats()
      mcpOk = true
    } catch { /* non-fatal */ }

    res.json({
      status: 'ok',
      service: 'fb-worker',
      phase: '03',
      mcpReachable: mcpOk,
      geminiUsage: geminiUsage.summary(),
      ts: new Date().toISOString(),
    })
  })

  // GET /metrics — Prometheus-style text format
  app.get('/metrics', (_req: Request, res: Response) => {
    const u = geminiUsage.summary()
    const lines = [
      `# HELP fb_worker_gemini_calls_total Total Gemini API calls`,
      `# TYPE fb_worker_gemini_calls_total counter`,
      `fb_worker_gemini_calls_total ${u.calls}`,
      `# HELP fb_worker_gemini_input_tokens_total Total input tokens`,
      `# TYPE fb_worker_gemini_input_tokens_total counter`,
      `fb_worker_gemini_input_tokens_total ${u.inputTokens}`,
      `# HELP fb_worker_gemini_output_tokens_total Total output tokens`,
      `# TYPE fb_worker_gemini_output_tokens_total counter`,
      `fb_worker_gemini_output_tokens_total ${u.outputTokens}`,
      `# HELP fb_worker_gemini_cost_usd_total Estimated cost USD`,
      `# TYPE fb_worker_gemini_cost_usd_total counter`,
      `fb_worker_gemini_cost_usd_total ${u.estimatedCostUsd}`,
    ]
    res.set('Content-Type', 'text/plain; version=0.0.4')
    res.send(lines.join('\n') + '\n')
  })

  // ── Login: start headful session ───────────────────────────────────────────
  // POST /worker/login/start  Body: { pageId: string, label: string }
  app.post('/worker/login/start', async (req: Request, res: Response) => {
    const { pageId, label } = req.body as { pageId?: string; label?: string }
    if (!pageId || !label) {
      res.status(400).json({ error: 'pageId and label required' })
      return
    }
    try {
      const loginId = await startFacebookLogin(pageId, label)
      res.json({ loginId, message: 'Login session started. Browser will open on MiniPC.' })
    } catch (err) {
      res.status(500).json({ error: (err as Error).message })
    }
  })

  // GET /worker/login/:id/status
  app.get('/worker/login/:id/status', (req: Request, res: Response) => {
    const session = getLoginStatus(req.params['id'] as string)
    if (!session) {
      res.status(404).json({ error: 'Login session not found' })
      return
    }
    res.json({
      loginId: session.id,
      pageId: session.pageId,
      label: session.label,
      status: session.status,
      currentInstruction: session.currentInstruction,
      logs: session.logs,
      hasScreenshot: !!session.screenshotBase64,
      errorMessage: session.errorMessage ?? null,
      startedAt: session.startedAt.toISOString(),
    })
  })

  // GET /worker/login/:id/screenshot.png — raw PNG bytes (cache-busting via ?ts=)
  app.get('/worker/login/:id/screenshot.png', (req: Request, res: Response) => {
    const b64 = getLoginScreenshot(req.params['id'] as string)
    if (!b64) {
      res.status(404).send('No screenshot yet')
      return
    }
    const buf = Buffer.from(b64, 'base64')
    res.set('Content-Type', 'image/png')
    res.set('Cache-Control', 'no-store')
    res.send(buf)
  })

  // ── Scrape: manual trigger ─────────────────────────────────────────────────
  // POST /worker/scrape/run-now  → enqueue all enabled sources immediately
  app.post('/worker/scrape/run-now', async (_req: Request, res: Response) => {
    try {
      const result = await enqueueAllSources()
      res.json({ message: 'Scrape jobs enqueued', ...result })
    } catch (err) {
      res.status(500).json({ error: (err as Error).message })
    }
  })

  // ── Page health check ──────────────────────────────────────────────────────
  // POST /worker/page/:id/health
  app.post('/worker/page/:id/health', async (req: Request, res: Response) => {
    const { id } = req.params
    // Simple DB check — full validation requires browser (expensive)
    const db = getSupabaseServiceClient()
    const { data } = await db.from('fb_pages').select('id, label, status').eq('id', id).single()
    if (!data) {
      res.status(404).json({ error: 'Page not found' })
      return
    }
    res.json(data)
  })

  // POST /worker/page/:id/logout  → mark LOGGED_OUT
  app.post('/worker/page/:id/logout', async (req: Request, res: Response) => {
    const { id } = req.params
    await markPageStatus(req.params['id'] as string, 'LOGGED_OUT', 'Manual logout via admin UI')
    res.json({ ok: true })
  })

  // ── Reply post ─────────────────────────────────────────────────────────────
  // POST /worker/reply/post  Body: { replyId: string }
  app.post('/worker/reply/post', async (req: Request, res: Response) => {
    const { replyId } = req.body as { replyId?: string }
    if (!replyId) {
      res.status(400).json({ error: 'replyId required' })
      return
    }
    try {
      const result = await postFbCommentForReply(replyId)
      res.json(result)
    } catch (err) {
      res.status(502).json({ error: (err as Error).message })
    }
  })

  // ── Scan joined groups ────────────────────────────────────────────────────
  // GET /worker/groups/scan?pageId=<id>
  app.get('/worker/groups/scan', async (req: Request, res: Response) => {
    const pageId = req.query['pageId'] as string | undefined
    if (!pageId) { res.status(400).json({ error: 'pageId required' }); return }
    try {
      // Fetch fb_page_url to enable Page context switching
      const db = getSupabaseServiceClient()
      const { data } = await db.from('fb_pages').select('fb_page_url').eq('id', pageId).single()
      const fbPageUrl = (data as { fb_page_url?: string | null } | null)?.fb_page_url ?? null
      const groups = await scanJoinedGroups(pageId, fbPageUrl)
      res.json({ groups, scannedAsPage: !!fbPageUrl })
    } catch (err) {
      res.status(502).json({ error: (err as Error).message })
    }
  })

  // ── Start server ───────────────────────────────────────────────────────────
  app.listen(env.WORKER_HTTP_PORT, '0.0.0.0', () => {
    logger.info({ port: env.WORKER_HTTP_PORT }, 'Worker HTTP server listening')
  })

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Graceful shutdown initiated')
    process.exit(0)
  }
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

main().catch((err) => {
  logger.fatal({ err: err instanceof Error ? err.stack : err }, 'Worker boot failed')
  process.exit(1)
})
