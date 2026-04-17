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
    // Support both field-name conventions: {score|total_score} and {interpretation|severity}
    const { quiz_type, score, total_score, interpretation, severity, answers } = body
    const resolvedScore = score ?? total_score
    const resolvedInterpretation = interpretation ?? severity ?? null

    if (!quiz_type || resolvedScore === undefined) {
      return NextResponse.json({ error: 'Missing quiz_type or score' }, { status: 400 })
    }

    const { error } = await supabase.from('assessments').insert({
      user_id: user.id,
      quiz_type,
      score: resolvedScore,
      interpretation: resolvedInterpretation,
      answers: answers ?? [],
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
