import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

export const runtime = 'nodejs'

// PUT /api/admin/promotions/[id] — update is_active or notes
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const { id } = await params
    const body = await request.json() as { is_active?: boolean; notes?: string }

    const updates: Record<string, unknown> = {}
    if (body.is_active !== undefined) updates.is_active = body.is_active
    if (body.notes !== undefined) updates.notes = body.notes

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: 'No fields to update' }, { status: 400 })
    }

    const sc = createServiceClient()
    const { data: promo, error: updateError } = await sc
      .from('promotions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) return Response.json({ error: updateError.message }, { status: 500 })

    try {
      await sc.from('admin_audit_log').insert({ action: 'promo.update', target_type: 'promotion', target_id: id, diff: { after: updates } })
    } catch { /* non-critical */ }

    return Response.json({ promotion: promo })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/promotions/[id] — soft-delete (set is_active=false)
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const { id } = await params
    const sc = createServiceClient()

    const { error: updateError } = await sc
      .from('promotions')
      .update({ is_active: false })
      .eq('id', id)

    if (updateError) return Response.json({ error: updateError.message }, { status: 500 })

    try {
      await sc.from('admin_audit_log').insert({ action: 'promo.deactivate', target_type: 'promotion', target_id: id })
    } catch { /* non-critical */ }

    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 })
  }
}
