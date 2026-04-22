import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

export const runtime = 'nodejs'

// Aggregate rows by date field (YYYY-MM-DD) and count distinct values per day
function groupByDate(rows: Record<string, unknown>[], dateField: string, distinctField?: string): { date: string; count: number }[] {
  const map: Record<string, Set<string> | number> = {}
  for (const row of rows) {
    const raw = row[dateField] as string | undefined
    if (!raw) continue
    const date = raw.slice(0, 10)
    if (distinctField) {
      if (!map[date]) map[date] = new Set<string>()
      ;(map[date] as Set<string>).add(row[distinctField] as string)
    } else {
      map[date] = ((map[date] as number) ?? 0) + 1
    }
  }
  return Object.entries(map)
    .map(([date, val]) => ({ date, count: val instanceof Set ? val.size : (val as number) }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

// Aggregate rows by a field value → count
function groupByField<T extends string>(rows: Record<string, unknown>[], field: string): Record<T, number> {
  const map: Record<string, number> = {}
  for (const row of rows) {
    const key = (row[field] as string) ?? 'unknown'
    map[key] = (map[key] ?? 0) + 1
  }
  return map as Record<T, number>
}

// GET /api/admin/reports/activity
export async function GET() {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const sc = createServiceClient()
    const since30d = new Date(Date.now() - 30 * 86400000).toISOString()

    const [
      checkinsRes,
      messagesRes,
      signupsRes,
      tiersRes,
      totalRes,
      active7dRes,
      assessmentsRes,
      therapyRes,
    ] = await Promise.all([
      sc.from('daily_checkins').select('user_id, created_at').gte('created_at', since30d),
      sc.from('messages').select('created_at').eq('role', 'user').gte('created_at', since30d),
      sc.from('profiles').select('created_at').gte('created_at', since30d),
      sc.from('profiles').select('subscription_tier'),
      sc.from('profiles').select('id', { count: 'exact', head: true }),
      sc.from('profiles').select('id', { count: 'exact', head: true }).gte(
        'last_checkin_date',
        new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
      ),
      sc.from('assessments').select('quiz_type, score, created_at').gte('created_at', since30d),
      sc.from('therapy_sessions').select('sound_type, duration_sec, created_at').gte('created_at', since30d),
    ])

    // DAU: distinct users per day from checkins
    const dau = groupByDate(
      (checkinsRes.data ?? []) as Record<string, unknown>[],
      'created_at',
      'user_id'
    )

    // Messages per day
    const messages = groupByDate(
      (messagesRes.data ?? []) as Record<string, unknown>[],
      'created_at'
    )

    // New signups per day
    const signups = groupByDate(
      (signupsRes.data ?? []) as Record<string, unknown>[],
      'created_at'
    )

    // Tier breakdown
    const tierBreakdown = groupByField<'free' | 'premium' | 'pro' | 'ultra'>(
      (tiersRes.data ?? []) as Record<string, unknown>[],
      'subscription_tier'
    )

    // Top assessments: group by quiz_type → avg score + count
    type AssessmentRow = { quiz_type: string; score: number }
    const assessmentMap: Record<string, { sum: number; count: number }> = {}
    for (const row of (assessmentsRes.data ?? []) as AssessmentRow[]) {
      const qt = row.quiz_type ?? 'unknown'
      if (!assessmentMap[qt]) assessmentMap[qt] = { sum: 0, count: 0 }
      assessmentMap[qt].sum += row.score ?? 0
      assessmentMap[qt].count++
    }
    const assessments = Object.entries(assessmentMap).map(([quiz_type, { sum, count }]) => ({
      quiz_type,
      avg_score: count > 0 ? Math.round((sum / count) * 10) / 10 : 0,
      count,
    }))

    // Therapy usage: group by sound_type → count + avg duration
    type TherapyRow = { sound_type: string; duration_sec: number }
    const therapyMap: Record<string, { sum: number; count: number }> = {}
    for (const row of (therapyRes.data ?? []) as TherapyRow[]) {
      const st = row.sound_type ?? 'unknown'
      if (!therapyMap[st]) therapyMap[st] = { sum: 0, count: 0 }
      therapyMap[st].sum += row.duration_sec ?? 0
      therapyMap[st].count++
    }
    const therapyUsage = Object.entries(therapyMap).map(([sound_type, { sum, count }]) => ({
      sound_type,
      count,
      avg_duration_sec: count > 0 ? Math.round(sum / count) : 0,
    }))

    return Response.json({
      dau,
      messages,
      signups,
      tierBreakdown,
      totalUsers: totalRes.count ?? 0,
      active7d: active7dRes.count ?? 0,
      assessments,
      therapyUsage,
    })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
