import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

export const runtime = 'nodejs'

// GET /api/admin/conversations/[id]/messages — last 30 messages for admin preview
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const { id } = await params
    if (!id) return Response.json({ error: 'Missing conversation id' }, { status: 400 })

    const sc = createServiceClient()

    const { data: messages, error: dbError } = await sc
      .from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })
      .limit(30)

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 })

    return Response.json({ messages: messages ?? [] })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 })
  }
}
