import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import JournalClient from '@/components/journal-client'

async function getJournalData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('daily_checkins')
    .select('id, mood_score, sleep_score, tinnitus_loudness, notes, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200)

  return data ?? []
}

export default async function JournalPage() {
  const entries = await getJournalData()

  if (!entries) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        <p>Please <Link href="/login" className="text-blue-400 underline">log in</Link> to view your journal.</p>
      </div>
    )
  }

  return <JournalClient entries={entries} />
}
