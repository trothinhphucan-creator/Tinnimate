/**
 * Upsert scraped comments to fb_comments + enqueue classify jobs.
 */

import { getSupabaseServiceClient } from '../db/supabase-service-role-client.js'
import { getCommentClassifyQueue } from '../pipeline/classify-comment-job.js'
import type { ScrapedComment } from '../scraper/scrape-post-comments.js'
import { logger } from '../lib/pino-structured-logger.js'

export async function upsertFbComments(
  postId: string,
  comments: ScrapedComment[],
): Promise<{ inserted: number; skipped: number }> {
  if (comments.length === 0) return { inserted: 0, skipped: 0 }

  const db = getSupabaseServiceClient()
  const log = logger.child({ fn: 'upsertFbComments', postId })

  const rows = comments.map(c => ({
    post_id: postId,
    fb_comment_id: c.fbCommentId,
    parent_fb_id: c.parentFbId ?? null,
    author_name: c.authorName ?? null,
    author_fb_id: c.authorFbId ?? null,
    content: c.content,
    comment_url: c.commentUrl ?? null,
    posted_at: c.postedAt?.toISOString() ?? null,
    status: 'NEW' as const,
  }))

  const { data, error } = await db
    .from('fb_comments')
    .upsert(rows, {
      onConflict: 'post_id,fb_comment_id',
      ignoreDuplicates: true,  // skip existing, only insert new
    })
    .select('id, fb_comment_id')

  if (error) {
    log.error({ err: error.message }, 'Failed to upsert comments')
    throw error
  }

  const inserted = (data as Array<{ id: string; fb_comment_id: string }>).length
  const skipped = comments.length - inserted

  log.info({ inserted, skipped, total: comments.length }, 'Comments upserted')

  // Enqueue classify jobs for newly inserted comments
  const queue = getCommentClassifyQueue()
  const jobs = (data as Array<{ id: string; fb_comment_id: string }>).map(row => ({
    name: `classify-comment-${row.id}`,
    data: { commentId: row.id, postId },
    opts: {
      jobId: `classify-${row.id}`,  // dedup
      delay: Math.floor(Math.random() * 5000), // stagger by up to 5s
    },
  }))

  if (jobs.length > 0) {
    await queue.addBulk(jobs)
    log.info({ count: jobs.length }, 'Comment classify jobs enqueued')
  }

  return { inserted, skipped }
}
