/**
 * requireAdmin — Server-side admin gate for social-listening API routes.
 *
 * Checks that the calling browser session belongs to a user with
 * role='admin' in user_metadata (set via Supabase dashboard or admin CLI).
 *
 * Usage:
 *   const guard = await requireAdmin()
 *   if (guard) return guard   // 401 or 403 Response
 *   // ... proceed with admin logic
 */

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function requireAdmin(): Promise<NextResponse | null> {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      },
    )

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized — please log in' }, { status: 401 })
    }

    // Check role in user_metadata (set via Supabase Auth dashboard or admin API)
    const role =
      (user.user_metadata?.role as string | undefined) ??
      (user.app_metadata?.role as string | undefined)

    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
    }

    return null // ✅ authorized
  } catch {
    return NextResponse.json({ error: 'Auth check failed' }, { status: 500 })
  }
}
