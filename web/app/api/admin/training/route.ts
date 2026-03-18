import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/require-admin'
import type { TrainingSession } from '@/types'

// GET /api/admin/training — list all (limit 20) or single by ?id=X
export async function GET(request: Request) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    const serviceClient = createServiceClient()

    if (id) {
      // Single session with full messages
      const { data, error: dbError } = await serviceClient
        .from('training_sessions')
        .select('*')
        .eq('id', id)
        .single()

      if (dbError || !data) return Response.json({ error: 'Session not found' }, { status: 404 })

      return Response.json(data as TrainingSession)
    }

    // List most recent 20
    const { data, error: dbError } = await serviceClient
      .from('training_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 })

    return Response.json(data as TrainingSession[])
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}

// POST /api/admin/training — save session
export async function POST(request: Request) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const body = await request.json() as {
      messages: TrainingSession['messages']
      feedback: TrainingSession['feedback']
      notes?: string
    }
    const { messages, feedback, notes } = body

    if (!messages || !feedback) {
      return Response.json({ error: 'messages and feedback are required' }, { status: 400 })
    }

    const serviceClient = createServiceClient()
    const { data, error: dbError } = await serviceClient
      .from('training_sessions')
      .insert({ messages, feedback, notes: notes ?? null })
      .select()
      .single()

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 })

    return Response.json(data as TrainingSession, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/admin/training?id=X
export async function DELETE(request: Request) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

    const serviceClient = createServiceClient()
    const { error: dbError } = await serviceClient
      .from('training_sessions')
      .delete()
      .eq('id', id)

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 })

    return Response.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
