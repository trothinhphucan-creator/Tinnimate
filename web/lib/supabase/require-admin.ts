import { createClient, createServiceClient } from '@/lib/supabase/server'

// Emails that have permanent admin access even without DB is_admin column
const ADMIN_EMAILS = [
  'chuduchaici@gmail.com',
  'duchaisea@gmail.com',
  'office.phucan@gmail.com',
  'trothinh.phucan@gmail.com',
  'trothinh.phucanmedia@gmail.com',
]

/**
 * Verifies the current request comes from an authenticated admin.
 * Priority: app_metadata.is_admin (JWT) → profiles.is_admin (DB) → email whitelist.
 * The email whitelist handles cases where is_admin column doesn't exist yet.
 */
export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 }

  // Fast path: JWT already has is_admin flag
  if (user.app_metadata?.is_admin === true) return { error: null, status: 200 }

  // Email whitelist (works before is_admin column exists in DB)
  if (user.email && ADMIN_EMAILS.includes(user.email)) return { error: null, status: 200 }

  // Fallback: check profiles table (handles JWT not refreshed yet)
  try {
    const sc = createServiceClient()
    const { data: profile } = await sc
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    if (profile?.is_admin === true) return { error: null, status: 200 }
  } catch {
    // Column may not exist yet — fall through
  }

  return { error: 'Forbidden', status: 403 }
}
