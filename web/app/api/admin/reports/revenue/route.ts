import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

export const runtime = 'nodejs'

type PaymentOrderRow = {
  gateway: string
  amount: number
  currency: string
  status: string
  created_at: string
}

// GET /api/admin/reports/revenue
export async function GET() {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const sc = createServiceClient()
    const since90d = new Date(Date.now() - 90 * 86400000).toISOString()
    const since30d = new Date(Date.now() - 30 * 86400000).toISOString()

    const [ordersRes, subsActiveRes, subsCanceledRes, subsTrialRes, promosRes] = await Promise.all([
      sc.from('payment_orders').select('gateway, amount, currency, status, created_at').eq('status', 'paid').gte('created_at', since90d),
      sc.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      sc.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'canceled').gte('canceled_at', since30d),
      sc.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'trialing'),
      sc.from('promotions').select('is_active, used_count'),
    ])

    const orders = (ordersRes.data ?? []) as PaymentOrderRow[]

    // Total revenue by currency
    let totalUsd = 0
    let totalVnd = 0
    for (const o of orders) {
      const amt = o.amount ?? 0
      if (o.currency === 'usd') totalUsd += amt
      else if (o.currency === 'vnd') totalVnd += amt
    }

    // Revenue by gateway
    const gatewayMap: Record<string, { total_usd: number; total_vnd: number; count: number }> = {}
    for (const o of orders) {
      const gw = o.gateway ?? 'unknown'
      if (!gatewayMap[gw]) gatewayMap[gw] = { total_usd: 0, total_vnd: 0, count: 0 }
      if (o.currency === 'usd') gatewayMap[gw].total_usd += o.amount ?? 0
      else if (o.currency === 'vnd') gatewayMap[gw].total_vnd += o.amount ?? 0
      gatewayMap[gw].count++
    }
    const revenueByGateway = Object.entries(gatewayMap).map(([gateway, vals]) => ({ gateway, ...vals }))

    // Revenue by month (YYYY-MM)
    const monthMap: Record<string, { total_vnd: number; total_usd: number; count: number }> = {}
    for (const o of orders) {
      const month = (o.created_at ?? '').slice(0, 7)
      if (!month) continue
      if (!monthMap[month]) monthMap[month] = { total_vnd: 0, total_usd: 0, count: 0 }
      if (o.currency === 'vnd') monthMap[month].total_vnd += o.amount ?? 0
      else if (o.currency === 'usd') monthMap[month].total_usd += o.amount ?? 0
      monthMap[month].count++
    }
    const revenueByMonth = Object.entries(monthMap)
      .map(([month, vals]) => ({ month, ...vals }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // Promotions stats
    const promoRows = promosRes.data ?? []
    const totalPromos = promoRows.filter((p: { is_active: boolean }) => p.is_active).length
    const totalRedemptions = promoRows.reduce((sum: number, p: { used_count: number }) => sum + (p.used_count ?? 0), 0)

    return Response.json({
      totalRevenue: { usd: Math.round(totalUsd * 100) / 100, vnd: totalVnd },
      revenueByGateway,
      revenueByMonth,
      activeSubscriptions: subsActiveRes.count ?? 0,
      canceledLast30d: subsCanceledRes.count ?? 0,
      trialingSubscriptions: subsTrialRes.count ?? 0,
      totalPromos,
      totalRedemptions,
    })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
