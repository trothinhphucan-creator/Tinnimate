import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

export const runtime = 'nodejs'

// GET /api/admin/audit
// Params: action (text filter), page, limit
export async function GET(request: Request) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const url    = new URL(request.url)
    const action = url.searchParams.get('action') ?? ''
    const page   = Math.max(1, parseInt(url.searchParams.get('page')  ?? '1'))
    const limit  = Math.min(200, parseInt(url.searchParams.get('limit') ?? '50'))

    const sc = createServiceClient()

    // Fetch audit log joined with profiles for admin name/email
    let query = sc
      .from('admin_audit_log')
      .select(
        `id, action, target_type, target_id, diff, ip, created_at,
         profiles!admin_audit_log_admin_id_fkey(name, email)`,
        { count: 'exact' }
      )

    if (action) {
      query = query.ilike('action', `%${action}%`)
    }

    query = query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    const { data, count, error: dbError } = await query

    if (dbError) {
      console.error('[admin/audit] DB error:', dbError)
      return Response.json({ error: dbError.message }, { status: 500 })
    }

    const entries = (data ?? []).map((row: Record<string, unknown>) => {
      const profile = Array.isArray(row.profiles)
        ? (row.profiles[0] as { name?: string; email?: string } | undefined)
        : (row.profiles as { name?: string; email?: string } | undefined)

      return {
        id:          row.id,
        action:      row.action,
        target_type: row.target_type,
        target_id:   row.target_id,
        diff:        row.diff,
        ip:          row.ip,
        created_at:  row.created_at,
        admin_name:  profile?.name  ?? null,
        admin_email: profile?.email ?? null,
      }
    })

    return Response.json({ entries, total: count ?? 0 })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 })
  }
}
