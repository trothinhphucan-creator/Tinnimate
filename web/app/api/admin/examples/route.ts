import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/require-admin'
import type { FewShotExample } from '@/types'

// GET /api/admin/examples — list all, ordered by created_at desc
export async function GET() {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const serviceClient = createServiceClient()
    const { data, error: dbError } = await serviceClient
      .from('few_shot_examples')
      .select('*')
      .order('created_at', { ascending: false })

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 })

    return Response.json(data as FewShotExample[])
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}

// POST /api/admin/examples — create example
export async function POST(request: Request) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const body = await request.json() as {
      user_message: string
      ai_response: string
      category?: string
    }
    const { user_message, ai_response, category } = body

    if (!user_message || !ai_response) {
      return Response.json({ error: 'user_message and ai_response are required' }, { status: 400 })
    }
    if (typeof user_message !== 'string' || user_message.length > 2000) {
      return Response.json({ error: 'user_message must be a string under 2,000 characters' }, { status: 400 })
    }
    if (typeof ai_response !== 'string' || ai_response.length > 10000) {
      return Response.json({ error: 'ai_response must be a string under 10,000 characters' }, { status: 400 })
    }

    const serviceClient = createServiceClient()
    const { data, error: dbError } = await serviceClient
      .from('few_shot_examples')
      .insert({ user_message, ai_response, category: category ?? null, is_active: true })
      .select()
      .single()

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 })

    return Response.json(data as FewShotExample, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}

// PUT /api/admin/examples — update existing by id
export async function PUT(request: Request) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const body = await request.json() as Partial<FewShotExample> & { id: string }
    if (!body.id) return Response.json({ error: 'id is required' }, { status: 400 })

    const { id, created_at: _created, ...updates } = body

    const serviceClient = createServiceClient()
    const { data, error: dbError } = await serviceClient
      .from('few_shot_examples')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 })

    return Response.json(data as FewShotExample)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}

// PATCH /api/admin/examples — toggle is_active for id
export async function PATCH(request: Request) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const body = await request.json() as { id: string }
    if (!body.id) return Response.json({ error: 'id is required' }, { status: 400 })

    const serviceClient = createServiceClient()

    const { data: current, error: fetchError } = await serviceClient
      .from('few_shot_examples')
      .select('is_active')
      .eq('id', body.id)
      .single()

    if (fetchError || !current) return Response.json({ error: 'Example not found' }, { status: 404 })

    const { data, error: dbError } = await serviceClient
      .from('few_shot_examples')
      .update({ is_active: !current.is_active })
      .eq('id', body.id)
      .select()
      .single()

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 })

    return Response.json(data as FewShotExample)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/admin/examples?id=X
export async function DELETE(request: Request) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

    const serviceClient = createServiceClient()
    const { error: dbError } = await serviceClient
      .from('few_shot_examples')
      .delete()
      .eq('id', id)

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 })

    return Response.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
