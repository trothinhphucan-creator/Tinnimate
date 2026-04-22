import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

export const runtime = 'nodejs'

// GET /api/admin/promotions/[id]/redemptions — list redemptions with profile info
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const { id } = await params
    const sc = createServiceClient()

    const { data: redemptions, error: dbError } = await sc
      .from('promotion_redemptions')
      .select('id, promotion_id, user_id, order_id, redeemed_at, profiles(name, email)')
      .eq('promotion_id', id)
      .order('redeemed_at', { ascending: false })

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 })

    return Response.json({ redemptions: redemptions ?? [] })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 })
  }
}
