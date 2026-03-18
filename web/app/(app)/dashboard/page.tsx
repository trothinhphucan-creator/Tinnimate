import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/dashboard-client'

interface CheckIn {
  mood_score: number
  sleep_score: number
  tinnitus_loudness: number
  created_at: string
}

interface Assessment {
  quiz_type: string
  total_score: number
  created_at: string
}

async function getDashboardData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 30 days ago
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [checkinsRes, assessmentRes, therapyRes, profileRes] = await Promise.all([
    // All check-ins from the last 30 days (for chart)
    supabase.from('daily_checkins').select('mood_score, sleep_score, tinnitus_loudness, created_at')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true }),
    // All assessments (for chart)
    supabase.from('assessments').select('quiz_type, total_score, created_at')
      .eq('user_id', user.id).order('created_at', { ascending: true }),
    supabase.from('therapy_sessions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('profiles').select('name, subscription_tier').eq('id', user.id).single(),
  ])

  const checkins = (checkinsRes.data ?? []) as CheckIn[]
  const assessments = (assessmentRes.data ?? []) as Assessment[]

  // Calculate streak: consecutive days with check-ins ending today
  let streak = 0
  if (checkins.length > 0) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkinDates = new Set(checkins.map(c => {
      const d = new Date(c.created_at)
      d.setHours(0, 0, 0, 0)
      return d.toDateString()
    }))
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      if (checkinDates.has(d.toDateString())) {
        streak++
      } else {
        break
      }
    }
  }

  return {
    name: profileRes.data?.name ?? user.email?.split('@')[0] ?? 'User',
    tier: profileRes.data?.subscription_tier ?? 'free',
    lastCheckin: checkins.length > 0 ? checkins[checkins.length - 1] : null,
    checkins,
    assessments,
    therapyCount: therapyRes.count ?? 0,
    streak,
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        <p>Please <Link href="/login" className="text-blue-400 underline">log in</Link> to view dashboard.</p>
      </div>
    )
  }

  return <DashboardClient data={data} />
}
