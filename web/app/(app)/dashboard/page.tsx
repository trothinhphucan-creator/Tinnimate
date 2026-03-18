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

  const [checkinRes, assessmentRes, therapyRes, profileRes] = await Promise.all([
    supabase.from('daily_checkins').select('mood_score, sleep_score, tinnitus_loudness, created_at')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('assessments').select('quiz_type, total_score, created_at')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
    supabase.from('therapy_sessions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('profiles').select('name, subscription_tier').eq('id', user.id).single(),
  ])

  return {
    name: profileRes.data?.name ?? user.email?.split('@')[0] ?? 'User',
    tier: profileRes.data?.subscription_tier ?? 'free',
    lastCheckin: checkinRes.data as CheckIn | null,
    assessments: (assessmentRes.data ?? []) as Assessment[],
    therapyCount: therapyRes.count ?? 0,
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
