import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

export const runtime = 'nodejs'

// GET /api/admin/subscriptions — list subscriptions joined with profiles
export async function GET(request: Request) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const url = new URL(request.url)
    const statusFilter = url.searchParams.get('status') ?? 'all'
    const page = parseInt(url.searchParams.get('page') ?? '1')
    const limit = parseInt(url.searchParams.get('limit') ?? '20')

    const sc = createServiceClient()

    let query = sc
      .from('subscriptions')
      .select('*, profiles(name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data: subscriptions, count, error: dbError } = await query
    if (dbError) return Response.json({ error: dbError.message }, { status: 500 })

    const [
      { count: activeCount },
      { count: canceledCount },
      { count: trialingCount },
      { count: pastDueCount },
    ] = await Promise.all([
      sc.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      sc.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'canceled'),
      sc.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'trialing'),
      sc.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'past_due'),
    ])

    return Response.json({
      subscriptions: subscriptions ?? [],
      total: count ?? 0,
      stats: {
        active: activeCount ?? 0,
        canceled: canceledCount ?? 0,
        trialing: trialingCount ?? 0,
        past_due: pastDueCount ?? 0,
      },
    })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 })
  }
}
