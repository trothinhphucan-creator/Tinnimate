import { requireAdmin } from '@/lib/social-listening/require-admin'
import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase/admin-client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adminDb = () => getAdminSupabase() as any

// GET /api/social-listening/history?filter=ALL|POSTED|REJECTED|FAILED|CRISIS&limit=100
// Trả lịch sử fb_replies join post + page (loại trừ status DRAFT để tách khỏi review queue).
export async function GET(req: Request) {
  const guard = await requireAdmin(); if (guard) return guard

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') ?? 'ALL'
  const limit = Math.min(Number(searchParams.get('limit') ?? 100), 200)

  const db = adminDb()

  let query = db
    .from('fb_replies')
    .select(`
      id, draft_text, status, posted_at, post_error, created_at, classification,
      post:fb_posts(id, content, fb_post_url, author_name, posted_at,
        source:fb_target_sources(label)),
      page:fb_pages(label)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (filter === 'POSTED') query = query.eq('status', 'POSTED')
  else if (filter === 'REJECTED') query = query.eq('status', 'REJECTED')
  else if (filter === 'FAILED') query = query.eq('status', 'FAILED')
  else if (filter === 'CRISIS') query = query.contains('classification', { crisis_flag: true })
  else query = query.neq('status', 'DRAFT') // ALL = mọi thứ trừ DRAFT

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}
