// GET /api/admin/usage — aggregated token usage and cost data for dashboard
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

export async function GET(request: Request) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from') ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const to = searchParams.get('to') ?? new Date().toISOString()
    const groupBy = searchParams.get('group_by') ?? 'day'

    const serviceClient = createServiceClient()
    const { data, error: dbError } = await serviceClient
      .from('usage_logs')
      .select('*')
      .gte('created_at', from)
      .lte('created_at', to)
      .order('created_at', { ascending: false })

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 })

    const logs = data ?? []

    type LogRow = { input_tokens?: number; output_tokens?: number; input_cost_usd?: number; output_cost_usd?: number; created_at?: string; model_id?: string }
    type Bucket = { inputTokens: number; outputTokens: number; cost: number; requests: number }

    // Aggregate totals
    const totals = (logs as LogRow[]).reduce(
      (acc: Bucket, log: LogRow) => {
        acc.inputTokens += log.input_tokens ?? 0
        acc.outputTokens += log.output_tokens ?? 0
        acc.cost += (log.input_cost_usd ?? 0) + (log.output_cost_usd ?? 0)
        acc.requests++
        return acc
      },
      { inputTokens: 0, outputTokens: 0, cost: 0, requests: 0 }
    )

    if (groupBy === 'day') {
      const byDay: Record<string, Bucket> = {}
      for (const log of logs as LogRow[]) {
        const day = (log.created_at ?? '').slice(0, 10)
        if (!byDay[day]) byDay[day] = { inputTokens: 0, outputTokens: 0, cost: 0, requests: 0 }
        byDay[day].inputTokens += log.input_tokens ?? 0
        byDay[day].outputTokens += log.output_tokens ?? 0
        byDay[day].cost += (log.input_cost_usd ?? 0) + (log.output_cost_usd ?? 0)
        byDay[day].requests++
      }
      return Response.json({ grouped: byDay, totals })
    }

    if (groupBy === 'model') {
      const byModel: Record<string, Bucket> = {}
      for (const log of logs as LogRow[]) {
        const key = log.model_id ?? 'unknown'
        if (!byModel[key]) byModel[key] = { inputTokens: 0, outputTokens: 0, cost: 0, requests: 0 }
        byModel[key].inputTokens += log.input_tokens ?? 0
        byModel[key].outputTokens += log.output_tokens ?? 0
        byModel[key].cost += (log.input_cost_usd ?? 0) + (log.output_cost_usd ?? 0)
        byModel[key].requests++
      }
      return Response.json({ grouped: byModel, totals })
    }

    return Response.json({ totals, raw: logs })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
