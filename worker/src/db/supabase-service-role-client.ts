/**
 * Supabase client dùng service_role key — bypass RLS.
 * CHỈ dùng trong worker (server-side), KHÔNG bao giờ expose ra browser/web.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '../config/environment-schema.js'

let _client: SupabaseClient | null = null

export function getSupabaseServiceClient(): SupabaseClient {
  if (_client) return _client
  _client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: { 'X-Client-Info': 'tinnimate-fb-worker' },
    },
  })
  return _client
}

// Type aliases cho các bảng — dùng `@supabase/supabase-js` generic.
// Khi schema ổn định, generate types bằng `supabase gen types typescript`.
export type FbPageStatus = 'IDLE' | 'CONNECTING' | 'ONLINE' | 'ERROR' | 'LOGGED_OUT'
export type FbSourceType = 'GROUP' | 'PAGE' | 'KEYWORD_SEARCH'
export type FbPostStatus = 'NEW' | 'ANALYZED' | 'REPLY_DRAFTED' | 'REPLIED' | 'SKIPPED'
export type FbReplyStatus = 'DRAFT' | 'APPROVED' | 'POSTED' | 'REJECTED' | 'FAILED'
export type FbJobStatus = 'QUEUED' | 'RUNNING' | 'DONE' | 'FAILED'

export type FbPageRow = {
  id: string
  label: string
  fb_user_id: string | null
  session_cookie_enc: string | null // bytea arrives as base64 string via PostgREST
  status: FbPageStatus
  last_active_at: string | null
  last_error: string | null
  created_at: string
  updated_at: string
}

export type FbTargetSourceRow = {
  id: string
  type: FbSourceType
  fb_url: string | null
  label: string
  keywords: string[]
  enabled: boolean
  last_scraped_at: string | null
  created_at: string
  updated_at: string
}

export type FbPostClassification = {
  relevance: number
  topic: string
  urgency: 'low' | 'medium' | 'high'
  intent: string
  lang: 'vi' | 'en' | 'mixed'
  crisis_flag: boolean
}

export type FbPostRow = {
  id: string
  source_id: string
  fb_post_id: string
  fb_post_url: string | null
  author_name: string | null
  author_fb_id: string | null
  content: string
  image_urls: string[]
  posted_at: string | null
  relevance_score: number | null
  classification: FbPostClassification | null
  status: FbPostStatus
  scraped_at: string
  updated_at: string
}

export type FbReplyMcpSource = {
  title: string
  score: number
  source: string
}

export type FbReplyRow = {
  id: string
  post_id: string
  page_id: string | null
  draft_text: string
  mcp_sources: FbReplyMcpSource[]
  confidence: number | null
  status: FbReplyStatus
  reviewer_id: string | null
  reviewed_at: string | null
  posted_fb_comment_id: string | null
  post_error: string | null
  created_at: string
  updated_at: string
}
