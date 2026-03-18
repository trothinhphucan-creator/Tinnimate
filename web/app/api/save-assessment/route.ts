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
    const { quiz_type, total_score, severity, answers } = body

    if (!quiz_type || total_score === undefined) {
      return NextResponse.json({ error: 'Missing quiz_type or total_score' }, { status: 400 })
    }

    const { error } = await supabase.from('assessments').insert({
      user_id: user.id,
      quiz_type,
      total_score,
      severity: severity ?? null,
      answers: answers ?? null,
    })

    if (error) {
      console.error('[save-assessment] DB error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[save-assessment] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
