import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { mood_score, sleep_score, tinnitus_loudness, notes } = body

    if (mood_score === undefined || sleep_score === undefined || tinnitus_loudness === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { error } = await supabase.from('daily_checkins').insert({
      user_id: user.id,
      mood_score: Math.max(0, Math.min(10, Number(mood_score))),
      sleep_score: Math.max(0, Math.min(10, Number(sleep_score))),
      tinnitus_loudness: Math.max(0, Math.min(10, Number(tinnitus_loudness))),
      notes: notes ?? null,
    })

    if (error) {
      console.error('[save-checkin] DB error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[save-checkin] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
