/**
 * Analyze Post Job — BullMQ consumer cho queue `fb-analyze`.
 *
 * Full pipeline: NEW → classify → [vision] → MCP → generate_reply → REPLY_DRAFTED
 *
 * Concurrency: 3 (Gemini API không cần browser, safe to parallelize)
 */

import { createWorker, QUEUE_ANALYZE, type AnalyzeJobPayload } from '../queue/bullmq-config.js'
import { getSupabaseServiceClient } from '../db/supabase-service-role-client.js'
import { classifyPostRelevance, MIN_RELEVANCE_THRESHOLD, type PostClassification } from '../ai/classify-post-relevance.js'
import { assessCrisisRisk, CRISIS_DRAFT_REPLY } from '../ai/crisis-detector.js'
import { queryMcpForPost, type McpKnowledgeChunk } from './mcp-query-builder.js'
import { generateReplyDraft } from '../ai/generate-reply-draft.js'
import { visionExtractAudiogram } from '../ai/vision-extract-audiogram.js'
import { logger } from '../lib/pino-structured-logger.js'
import type { Job } from 'bullmq'

const VISION_TOPICS: PostClassification['topic'][] = [
  'tinnitus_symptom', 'tinnitus_treatment', 'hearing_loss'
]

export function startAnalyzeConsumer() {
  const worker = createWorker<AnalyzeJobPayload>(
    QUEUE_ANALYZE,
    async (job: Job<AnalyzeJobPayload>) => analyzePostJob(job),
    3, // 3 parallel Gemini calls
  )

  worker.on('completed', (job) =>
    logger.info({ jobId: job.id, postId: job.data.postId }, 'Analyze job done'),
  )
  worker.on('failed', (job, err) =>
    logger.error({ jobId: job?.id, err: err.message }, 'Analyze job failed'),
  )

  worker.run()
  logger.info({ queue: QUEUE_ANALYZE }, 'Analyze consumer started')
  return worker
}

async function analyzePostJob(job: Job<AnalyzeJobPayload>) {
  const { postId } = job.data
  const db = getSupabaseServiceClient()
  const log = logger.child({ jobId: job.id, postId })

  // Fetch post
  const { data: post, error: fetchErr } = await db
    .from('fb_posts')
    .select('id, source_id, content, image_urls, status, fb_post_url')
    .eq('id', postId)
    .single()

  if (fetchErr || !post) {
    throw new Error(`Post not found: ${postId}`)
  }

  const postRow = post as {
    id: string; source_id: string; content: string
    image_urls: string[]; status: string; fb_post_url: string | null
  }

  // Skip nếu đã có draft hoặc replied — chỉ process NEW và ANALYZED (classify-failed retry)
  if (postRow.status !== 'NEW' && postRow.status !== 'ANALYZED') {
    log.debug({ status: postRow.status }, 'Post already processed — skip')
    return { skipped: true }
  }

  log.info({ contentLen: postRow.content.length }, 'Analyzing post')

  // ── Step 1: Crisis check (keyword, no API call) ───────────────────────────
  const crisisResult = assessCrisisRisk(postRow.content)

  if (crisisResult.isCrisis) {
    log.warn({ keyword: crisisResult.matchedKeyword }, 'Crisis flag detected')
    await insertReplyDraft(postId, postRow.source_id, CRISIS_DRAFT_REPLY, [], {
      relevance: 1.0, topic: 'mental_health', urgency: 'high',
      intent: 'asking_help', lang: 'vi', crisis_flag: true,
    })
    await db.from('fb_posts')
      .update({ status: 'REPLY_DRAFTED', classification: { crisis_flag: true, urgency: 'high' } })
      .eq('id', postId)
    return { crisis: true }
  }

  // ── Step 2: Classify ───────────────────────────────────────────────────────
  let classification: PostClassification
  try {
    classification = await classifyPostRelevance(postRow.content, postRow.image_urls)
  } catch (err) {
    log.error({ err: (err as Error).message }, 'Classify failed')
    throw err  // Keep status NEW so BullMQ retry picks it up
  }

  // Update post with classification
  await db.from('fb_posts')
    .update({ classification, status: 'ANALYZED' })
    .eq('id', postId)

  // Skip nếu không đủ liên quan
  if (classification.relevance < MIN_RELEVANCE_THRESHOLD) {
    log.info({ relevance: classification.relevance }, 'Post not relevant — skip reply')
    return { relevant: false, relevance: classification.relevance }
  }

  // ── Step 3: Vision (nếu có ảnh và topic liên quan) ────────────────────────
  let visionContext = ''
  if (postRow.image_urls.length > 0 && VISION_TOPICS.includes(classification.topic)) {
    const audiogramData = await visionExtractAudiogram(postRow.image_urls).catch(() => null)
    if (audiogramData?.is_audiogram) {
      visionContext = `\n[Audiogram phát hiện: mức độ ${audiogramData.severity}, ${audiogramData.extracted_text.slice(0, 200)}]`
      log.debug({ severity: audiogramData.severity }, 'Audiogram extracted')
    }
  }

  // ── Step 4: MCP knowledge query ────────────────────────────────────────────
  const mcpChunks: McpKnowledgeChunk[] = await queryMcpForPost(
    postRow.content + visionContext,
  )

  // ── Step 5: Generate reply draft ───────────────────────────────────────────
  let replyDraft
  try {
    replyDraft = await generateReplyDraft(
      postRow.content + visionContext,
      classification,
      mcpChunks,
    )
  } catch (err) {
    log.error({ err: (err as Error).message }, 'Reply generation failed')
    throw err  // Keep status ANALYZED (classify succeeded) — BullMQ retry
  }

  // ── Step 6: Insert draft reply ─────────────────────────────────────────────
  await insertReplyDraft(postId, postRow.source_id, replyDraft.text, mcpChunks, classification)

  await db.from('fb_posts')
    .update({ status: 'REPLY_DRAFTED' })
    .eq('id', postId)

  log.info(
    { wordCount: replyDraft.wordCount, chunks: mcpChunks.length, topic: classification.topic },
    'Reply draft created',
  )

  return { relevance: classification.relevance, words: replyDraft.wordCount, chunks: mcpChunks.length }
}

async function insertReplyDraft(
  postId: string,
  sourceId: string,
  draftText: string,
  mcpChunks: McpKnowledgeChunk[],
  classification: PostClassification,
) {
  const db = getSupabaseServiceClient()

  // Lấy source để tìm page_id liên quan
  const { data: source } = await db
    .from('fb_target_sources')
    .select('page_id')
    .eq('id', sourceId)
    .maybeSingle()

  const mcpSources = mcpChunks.map((c) => ({
    id: c.id,
    score: c.score,
    preview: c.content.slice(0, 150),
  }))

  await db.from('fb_replies').insert({
    post_id: postId,
    page_id: (source as { page_id?: string } | null)?.page_id ?? null,
    draft_text: draftText,
    mcp_sources: mcpSources,
    classification,
    status: 'DRAFT',
  })
}
