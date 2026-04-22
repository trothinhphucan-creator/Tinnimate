import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

export const runtime = 'nodejs'

// GET /api/admin/users/[id] — Full 360° user detail
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const { id } = await params
    const sc = createServiceClient()

    const [
      profileRes,
      tinnitusRes,
      subscriptionRes,
      assessmentsRes,
      checkinsRes,
      therapyRes,
      conversationsRes,
      ordersRes,
    ] = await Promise.all([
      sc.from('profiles').select('*').eq('id', id).single(),
      sc.from('tinnitus_profiles').select('*').eq('user_id', id).single(),
      sc.from('subscriptions').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      sc.from('assessments').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(20),
      sc.from('daily_checkins').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(60),
      sc.from('therapy_sessions').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(30),
      sc.from('conversations').select('*').eq('user_id', id).is('deleted_at', null).order('updated_at', { ascending: false }).limit(20),
      sc.from('payment_orders').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(10),
    ])

    return Response.json({
      profile: profileRes.data,
      tinnitus: tinnitusRes.data,
      subscription: subscriptionRes.data,
      assessments: assessmentsRes.data ?? [],
      checkins: checkinsRes.data ?? [],
      therapy: therapyRes.data ?? [],
      conversations: conversationsRes.data ?? [],
      orders: ordersRes.data ?? [],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
