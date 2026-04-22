/**
 * Supabase Admin Client — dùng service_role key để bypass RLS.
 *
 * QUAN TRỌNG: Chỉ dùng trong server-side code (API routes, Server Actions).
 * KHÔNG export sang client components.
 *
 * Khác với createServerClient (@supabase/ssr): client này KHÔNG đọc cookies
 * → service_role key có effect thực sự → bypass RLS hoàn toàn.
 */

import { createClient } from '@supabase/supabase-js'

let _adminClient: ReturnType<typeof createClient> | null = null

export function getAdminSupabase() {
  if (!_adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }
    _adminClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return _adminClient
}
