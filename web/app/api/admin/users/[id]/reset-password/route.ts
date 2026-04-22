import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

export const runtime = 'nodejs'

// POST /api/admin/users/[id]/reset-password — Generate password reset link for user
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const { id } = await params
    const sc = createServiceClient()

    // Get user email from profiles
    const { data: profile, error: profileError } = await sc
      .from('profiles')
      .select('email')
      .eq('id', id)
      .single()

    if (profileError || !profile?.email) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Generate password reset link via admin API
    const { data, error: linkError } = await sc.auth.admin.generateLink({
      type: 'recovery',
      email: profile.email,
    })

    if (linkError || !data?.properties?.action_link) {
      return Response.json({ error: linkError?.message ?? 'Failed to generate link' }, { status: 500 })
    }

    // Write audit log
    await sc.from('admin_audit_log').insert({
      action: 'password.reset',
      target_type: 'user',
      target_id: id,
    })

    return Response.json({ link: data.properties.action_link })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
