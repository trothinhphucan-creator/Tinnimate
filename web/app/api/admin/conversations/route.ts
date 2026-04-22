import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/require-admin'
import { createClient } from '@/lib/supabase/server'
import { logAdminAction } from '@/lib/admin/audit-logger'

export const runtime = 'nodejs'

// GET /api/admin/conversations
// Params: search, page, limit, userId
export async function GET(request: Request) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const url = new URL(request.url)
    const search  = url.searchParams.get('search') ?? ''
    const userId  = url.searchParams.get('userId') ?? ''
    const page    = Math.max(1, parseInt(url.searchParams.get('page')  ?? '1'))
    const limit   = Math.min(100, parseInt(url.searchParams.get('limit') ?? '20'))

    const sc = createServiceClient()

    // Fetch conversations joined with profiles, including message count
    let query = sc
      .from('conversations')
      .select(
        `id, title, user_id, created_at, updated_at,
         profiles!conversations_user_id_fkey(name, email),
         messages(count)`,
        { count: 'exact' }
      )
      .is('deleted_at', null)

    if (search) {
      query = query.ilike('title', `%${search}%`)
    }
    if (userId) {
      query = query.eq('user_id', userId)
    }

    query = query
      .order('updated_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    const { data, count, error: dbError } = await query

    if (dbError) {
      console.error('[admin/conversations] DB error:', dbError)
      return Response.json({ error: dbError.message }, { status: 500 })
    }

    // Flatten profile join
    const conversations = (data ?? []).map((row: Record<string, unknown>) => {
      const profile = Array.isArray(row.profiles)
        ? (row.profiles[0] as { name?: string; email?: string } | undefined)
        : (row.profiles as { name?: string; email?: string } | undefined)

      const msgArr = Array.isArray(row.messages) ? row.messages as Array<{ count: number }> : []
      const messageCountHint = msgArr[0]?.count ?? 0

      return {
        id:                 row.id,
        title:              row.title,
        user_id:            row.user_id,
        user_name:          profile?.name  ?? null,
        user_email:         profile?.email ?? null,
        created_at:         row.created_at,
        updated_at:         row.updated_at,
        message_count_hint: messageCountHint,
      }
    })

    return Response.json({ conversations, total: count ?? 0 })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/conversations — soft-delete by id
export async function DELETE(request: Request) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const { id } = await request.json() as { id: string }
    if (!id) return Response.json({ error: 'Missing id' }, { status: 400 })

    const sc = createServiceClient()

    const { error: updateError } = await sc
      .from('conversations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (updateError) return Response.json({ error: updateError.message }, { status: 500 })

    // Get admin user for audit log
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    await logAdminAction({
      supabase: sc,
      adminId: user?.id,
      action: 'conversation.delete',
      targetType: 'conversation',
      targetId: id,
      req: request,
    })

    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 })
  }
}
