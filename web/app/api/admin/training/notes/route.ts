import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/require-admin'
import type { TrainingNote } from '@/types'

// GET /api/admin/training/notes — list all training notes
export async function GET() {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const serviceClient = createServiceClient()
    const { data, error: dbError } = await serviceClient
      .from('training_notes')
      .select('*')
      .order('created_at', { ascending: false })

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 })

    return Response.json(data as TrainingNote[])
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/admin/training/notes?id=X
export async function DELETE(request: Request) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

    const serviceClient = createServiceClient()
    const { error: dbError } = await serviceClient
      .from('training_notes')
      .delete()
      .eq('id', id)

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 })

    return Response.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
