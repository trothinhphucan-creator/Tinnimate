/**
 * Upsert FB posts vào Supabase fb_posts.
 * Dedupe theo fb_post_id — ON CONFLICT DO NOTHING.
 */

import { getSupabaseServiceClient, type FbPostRow } from './supabase-service-role-client.js'
import { logger } from '../lib/pino-structured-logger.js'
import type { ExtractedPost } from '../scraper/extract-post-fields.js'

export type UpsertPostsResult = {
  attempted: number
  newInserted: number
  alreadyExisted: number
  failed: number
}

/**
 * Upsert nhiều posts vào DB. Returns count mới insert thực sự.
 */
export async function upsertFbPosts(
  sourceId: string,
  posts: ExtractedPost[],
): Promise<UpsertPostsResult> {
  if (posts.length === 0) return { attempted: 0, newInserted: 0, alreadyExisted: 0, failed: 0 }

  const db = getSupabaseServiceClient()
  let newInserted = 0
  let alreadyExisted = 0
  let failed = 0

  // Batch upsert. Supabase PostgREST không hỗ trợ ON CONFLICT DO NOTHING trực tiếp
  // nên ta dùng upsert với ignoreDuplicates: true (maps to ON CONFLICT DO NOTHING)
  const rows = posts.map((p) => ({
    source_id: sourceId,
    fb_post_id: p.fbPostId,
    fb_post_url: p.fbPostUrl,
    author_name: p.authorName,
    author_fb_id: p.authorFbId,
    content: p.content,
    image_urls: p.imageUrls,
    posted_at: p.postedAt?.toISOString() ?? null,
    status: 'NEW' as const,
  }))

  // Try upsert in batches of 20
  const BATCH = 20
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    try {
      const { error, count } = await db
        .from('fb_posts')
        .upsert(batch, {
          onConflict: 'fb_post_id',
          ignoreDuplicates: true,
          count: 'exact',
        })

      if (error) {
        logger.error({ error: error.message, batchStart: i }, 'Batch upsert error')
        failed += batch.length
      } else {
        const inserted = count ?? 0
        newInserted += inserted
        alreadyExisted += batch.length - inserted
      }
    } catch (err) {
      logger.error({ err: (err as Error).message, batchStart: i }, 'Batch upsert exception')
      failed += batch.length
    }
  }

  logger.info(
    { attempted: posts.length, newInserted, alreadyExisted, failed },
    'Posts upsert complete',
  )
  return { attempted: posts.length, newInserted, alreadyExisted, failed }
}

/**
 * Mark post status (e.g. NEW → ANALYZED).
 */
export async function updatePostStatus(
  postId: string,
  status: FbPostRow['status'],
): Promise<void> {
  const db = getSupabaseServiceClient()
  await db.from('fb_posts').update({ status }).eq('id', postId)
}

/**
 * Get posts by status for pipeline processing.
 */
export async function getPostsByStatus(
  status: FbPostRow['status'],
  limit = 50,
): Promise<FbPostRow[]> {
  const db = getSupabaseServiceClient()
  const { data, error } = await db
    .from('fb_posts')
    .select('*')
    .eq('status', status)
    .order('scraped_at', { ascending: true })
    .limit(limit)

  if (error) throw new Error(`getPostsByStatus failed: ${error.message}`)
  return (data ?? []) as FbPostRow[]
}
