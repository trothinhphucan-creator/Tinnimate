import { createClient } from '@/lib/supabase/server'

/**
 * Verifies the current request comes from an authenticated admin.
 * Uses app_metadata.is_admin (set only via service role) rather than
 * user_metadata.is_admin (which users can set themselves).
 */
export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 }
  if (user.app_metadata?.is_admin !== true) return { error: 'Forbidden', status: 403 }
  return { error: null, status: 200 }
}
