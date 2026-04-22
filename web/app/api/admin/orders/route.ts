import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

export const runtime = 'nodejs'

// GET /api/admin/orders — list payment orders joined with profiles
export async function GET(request: Request) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const url = new URL(request.url)
    const statusFilter = url.searchParams.get('status') ?? 'all'
    const gatewayFilter = url.searchParams.get('gateway') ?? 'all'
    const page = parseInt(url.searchParams.get('page') ?? '1')
    const limit = parseInt(url.searchParams.get('limit') ?? '20')

    const sc = createServiceClient()

    let query = sc
      .from('payment_orders')
      .select('*, profiles(name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (statusFilter !== 'all') query = query.eq('status', statusFilter)
    if (gatewayFilter !== 'all') query = query.eq('gateway', gatewayFilter)

    const { data: orders, count, error: dbError } = await query
    if (dbError) return Response.json({ error: dbError.message }, { status: 500 })

    // Stats: counts + sum of paid amount
    const [
      { count: paidCount },
      { count: failedCount },
      { count: pendingCount },
      { count: refundedCount },
    ] = await Promise.all([
      sc.from('payment_orders').select('*', { count: 'exact', head: true }).eq('status', 'paid'),
      sc.from('payment_orders').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
      sc.from('payment_orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      sc.from('payment_orders').select('*', { count: 'exact', head: true }).eq('status', 'refunded'),
    ])

    // Sum paid amounts
    const { data: paidRows } = await sc
      .from('payment_orders')
      .select('amount, currency')
      .eq('status', 'paid')

    const totalPaidUSD = (paidRows ?? [])
      .filter(r => r.currency === 'USD')
      .reduce((sum, r) => sum + (r.amount ?? 0), 0)

    return Response.json({
      orders: orders ?? [],
      total: count ?? 0,
      stats: {
        paid: paidCount ?? 0,
        failed: failedCount ?? 0,
        pending: pendingCount ?? 0,
        refunded: refundedCount ?? 0,
        total_paid_usd: totalPaidUSD,
      },
    })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 })
  }
}
