import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

export const runtime = 'nodejs'

// GET /api/admin/users — List all users with profiles + stats
export async function GET(request: Request) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const url = new URL(request.url)
    const search = url.searchParams.get('search') ?? ''
    const tier = url.searchParams.get('tier') ?? ''
    const sort = url.searchParams.get('sort') ?? 'created_at'
    const order = url.searchParams.get('order') ?? 'desc'
    const page = parseInt(url.searchParams.get('page') ?? '1')
    const limit = parseInt(url.searchParams.get('limit') ?? '50')

    const sc = createServiceClient()

    // Get profiles with is_admin flag
    // Note: tinnitus info is in separate table (tinnitus_profiles), not in profiles
    let query = sc
      .from('profiles')
      .select('id, name, email, subscription_tier, is_admin, created_at', { count: 'exact' })

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }
    if (tier && tier !== 'all') {
      query = query.eq('subscription_tier', tier)
    }

    query = query.order(sort as string, { ascending: order === 'asc' })
    query = query.range((page - 1) * limit, page * limit - 1)

    const { data: users, count, error: dbError } = await query

    if (dbError) {
      console.error('CRM query error:', dbError)
      return Response.json({ error: dbError.message }, { status: 500 })
    }

    // Compute stats manually (no RPC dependency)
    const [
      { count: total },
      { count: free },
      { count: premium },
      { count: pro },
      { count: ultra },
      { count: active7d },
    ] = await Promise.all([
      sc.from('profiles').select('*', { count: 'exact', head: true }),
      sc.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'free'),
      sc.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'premium'),
      sc.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'pro'),
      sc.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'ultra'),
      sc.from('profiles').select('*', { count: 'exact', head: true }).gte('last_checkin_date', new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]),
    ])

    const stats = {
      total:    total    ?? 0,
      free:     free     ?? 0,
      premium:  premium  ?? 0,
      pro:      pro      ?? 0,
      ultra:    ultra    ?? 0,
      active_7d: active7d ?? 0,
    }

    return Response.json({
      users: users ?? [],
      total: count ?? 0,
      page,
      limit,
      stats,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}

// PUT /api/admin/users — Update user profile (tier, admin status)
export async function PUT(request: Request) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const { id, subscription_tier, is_admin, notes } = await request.json() as {
      id: string
      subscription_tier?: string
      is_admin?: boolean
      notes?: string
    }

    if (!id) return Response.json({ error: 'Missing user id' }, { status: 400 })

    const sc = createServiceClient()
    const updates: Record<string, unknown> = {}
    if (subscription_tier !== undefined) updates.subscription_tier = subscription_tier
    if (is_admin !== undefined) updates.is_admin = is_admin
    if (notes !== undefined) updates.admin_notes = notes

    const { error: updateError } = await sc
      .from('profiles')
      .update(updates)
      .eq('id', id)

    if (updateError) return Response.json({ error: updateError.message }, { status: 500 })

    return Response.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
