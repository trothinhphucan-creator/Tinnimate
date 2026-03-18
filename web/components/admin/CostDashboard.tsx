// Server component — fetches usage data and renders cost summary widget for admin dashboard
import { createServiceClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type LogRow = { input_cost_usd?: number; output_cost_usd?: number; model_id?: string }

async function getUsageStats() {
  try {
    const supabase = createServiceClient()
    const now = new Date()

    // Month start (first day of current month)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    // Today start
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

    const { data: monthLogs } = await supabase
      .from('usage_logs')
      .select('model_id, input_tokens, output_tokens, input_cost_usd, output_cost_usd')
      .gte('created_at', monthStart)

    const logs = (monthLogs ?? []) as LogRow[]

    const monthTotals = logs.reduce(
      (acc: { cost: number; requests: number }, l: LogRow) => {
        acc.cost += (l.input_cost_usd ?? 0) + (l.output_cost_usd ?? 0)
        acc.requests++
        return acc
      },
      { cost: 0, requests: 0 }
    )

    // Today subset (re-query for accuracy)
    const { data: todayLogs } = await supabase
      .from('usage_logs')
      .select('input_cost_usd, output_cost_usd')
      .gte('created_at', todayStart)

    const todayCost = ((todayLogs ?? []) as LogRow[]).reduce(
      (sum: number, l: LogRow) => sum + (l.input_cost_usd ?? 0) + (l.output_cost_usd ?? 0), 0
    )

    // Top model by requests this month
    const byModel: Record<string, number> = {}
    for (const l of logs) {
      const key = l.model_id ?? 'unknown'
      byModel[key] = (byModel[key] ?? 0) + 1
    }
    const topModel = Object.entries(byModel).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

    return { monthCost: monthTotals.cost, monthRequests: monthTotals.requests, todayCost, topModel }
  } catch {
    return { monthCost: 0, monthRequests: 0, todayCost: 0, topModel: '—' }
  }
}

function fmt(usd: number) {
  return usd < 0.001 ? '$0.00' : `$${usd.toFixed(usd < 0.01 ? 4 : 2)}`
}

export async function CostDashboard() {
  const { monthCost, monthRequests, todayCost, topModel } = await getUsageStats()

  const stats = [
    { label: 'This Month', value: fmt(monthCost), sub: `${monthRequests} requests` },
    { label: 'Today', value: fmt(todayCost), sub: 'cost so far' },
    { label: 'Top Model', value: topModel.split('-').slice(0, 3).join('-'), sub: 'most used' },
  ]

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-300 mb-3">Token Cost (this month)</h2>
      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ label, value, sub }) => (
          <Card key={label} className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs text-slate-400 font-medium">{label}</CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-4">
              <p className="text-white font-semibold text-base truncate">{value}</p>
              <p className="text-slate-500 text-[10px] mt-0.5">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
