/**
 * Comment Classify + Reply Draft Job — BullMQ pipeline.
 *
 * Queue: fb-comment-classify
 * Flow:
 *   1. Load fb_comment from DB
 *   2. Classify intent with Gemini
 *   3. Update fb_comments.needs_reply + classification
 *   4. If needs_reply → generate reply draft → insert fb_replies (with comment_id)
 *   5. Update status: CLASSIFIED or REPLY_DRAFTED
 */

import { Queue, type Job } from 'bullmq'
import { createWorker, redisOpts } from '../queue/bullmq-config.js'
import { getSupabaseServiceClient } from '../db/supabase-service-role-client.js'
import { classifyCommentIntent, type CommentClassification } from '../ai/classify-comment-intent.js'
import { generateReplyDraft } from '../ai/generate-reply-draft.js'
import { queryMcpForPost, type McpKnowledgeChunk } from './mcp-query-builder.js'
import type { PostClassification } from '../ai/classify-post-relevance.js'
import { logger } from '../lib/pino-structured-logger.js'

export const QUEUE_COMMENT_CLASSIFY = 'fb-comment-classify'

export type CommentClassifyPayload = {
  commentId: string
  postId: string
}

let _commentQueue: Queue<CommentClassifyPayload> | null = null

export function getCommentClassifyQueue(): Queue<CommentClassifyPayload> {
  if (!_commentQueue) {
    _commentQueue = new Queue<CommentClassifyPayload>(QUEUE_COMMENT_CLASSIFY, {
      connection: redisOpts,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'fixed', delay: 30_000 },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 200 },
      },
    })
  }
  return _commentQueue
}

export function startCommentClassifyConsumer() {
  const worker = createWorker<CommentClassifyPayload>(
    QUEUE_COMMENT_CLASSIFY,
    async (job: Job<CommentClassifyPayload>) => classifyCommentJob(job),
    3, // parallel Gemini calls safe
  )

  worker.on('completed', (job) =>
    logger.info({ jobId: job.id, commentId: job.data.commentId }, 'Comment classify done'),
  )
  worker.on('failed', (job, err) =>
    logger.error({ jobId: job?.id, err: err.message }, 'Comment classify failed'),
  )

  worker.run()
  logger.info({ queue: QUEUE_COMMENT_CLASSIFY }, 'Comment classify consumer started')
  return worker
}

async function classifyCommentJob(job: Job<CommentClassifyPayload>) {
  const { commentId, postId } = job.data
  const db = getSupabaseServiceClient()
  const log = logger.child({ jobId: job.id, commentId, postId })

  // 1. Load comment + parent post content for context
  const { data: comment, error } = await db
    .from('fb_comments')
    .select('id, content, status, fb_posts(content, fb_post_url, source_id, fb_target_sources(label, keywords))')
    .eq('id', commentId)
    .single()

  if (error || !comment) throw new Error(`Comment not found: ${commentId}`)

  const row = comment as unknown as {
    id: string
    content: string
    status: string
    fb_posts: {
      content: string
      fb_post_url: string | null
      source_id: string
      fb_target_sources: { label: string; keywords: string[] } | null
    } | null
  }

  if (row.status !== 'NEW') {
    log.debug({ status: row.status }, 'Comment already classified — skip')
    return { skipped: true }
  }

  log.info({ contentLen: row.content.length }, 'Classifying comment')

  // 2. LLM classify
  let classification: CommentClassification
  try {
    classification = await classifyCommentIntent(
      row.content,
      row.fb_posts?.content,
    )
  } catch (err) {
    log.error({ err: (err as Error).message }, 'Classification failed')
    await db.from('fb_comments').update({ status: 'SKIPPED' }).eq('id', commentId)
    throw err
  }

  log.info({ needs_reply: classification.needs_reply, intent: classification.intent, urgency: classification.urgency }, 'Comment classified')

  // 3. Update comment classification
  await db.from('fb_comments').update({
    needs_reply: classification.needs_reply,
    intent: classification.intent,
    urgency: classification.urgency,
    classification: classification as unknown as Record<string, unknown>,
    status: classification.needs_reply ? 'CLASSIFIED' : 'SKIPPED',
  }).eq('id', commentId)

  if (!classification.needs_reply) {
    log.debug('Comment does not need reply — done')
    return { needs_reply: false }
  }

  // 4. Generate reply draft for comments that need reply
  log.info('Generating reply draft for comment')

  let mcpChunks: McpKnowledgeChunk[] = []
  try {
    mcpChunks = await queryMcpForPost(row.content)
  } catch (err) {
    log.warn({ err: (err as Error).message }, 'MCP query failed — proceeding without knowledge base')
  }

  // Build a PostClassification-compatible object for the existing generator
  const syntheticClassification: PostClassification = {
    relevance: classification.confidence,
    topic: 'tinnitus_symptom',
    urgency: classification.urgency as 'high' | 'medium' | 'low',
    intent: classification.intent === 'asking_question' || classification.intent === 'seeking_info'
      ? 'asking_help'
      : 'sharing_experience',
    lang: (classification.lang === 'vi' || classification.lang === 'en' || classification.lang === 'mixed')
      ? classification.lang
      : 'vi',
    crisis_flag: false,
  }

  let draftText = ''
  try {
    const generated = await generateReplyDraft(row.content, syntheticClassification, mcpChunks)
    draftText = generated.text
  } catch (err) {
    log.error({ err: (err as Error).message }, 'Reply draft generation failed')
    return { needs_reply: true, draft: false }
  }

  // 5. Insert fb_replies with comment_id
  const mcpSourcesForDb = mcpChunks.map(c => ({ id: c.id, score: c.score, preview: c.content.slice(0, 200) }))
  await db.from('fb_replies').insert({
    post_id: postId,
    comment_id: commentId,
    draft_text: draftText,
    status: 'DRAFT',
    classification: {
      intent: classification.intent,
      urgency: classification.urgency,
      crisis_flag: false,
      topic: 'tinnitus_comment',
      relevance: classification.confidence,
      needs_reply: true,
    },
    mcp_sources: mcpSourcesForDb,
  })

  // 6. Update comment status
  await db.from('fb_comments').update({ status: 'REPLY_DRAFTED' }).eq('id', commentId)

  log.info({ draftLen: draftText.length }, 'Reply draft created for comment')
  return { needs_reply: true, draft: true, draftLen: draftText.length }
}
