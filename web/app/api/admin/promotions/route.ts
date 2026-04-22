import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

export const runtime = 'nodejs'

const CODE_RE = /^[A-Z0-9-]+$/
const VALID_KINDS = ['percent', 'fixed', 'trial_extend', 'tier_grant'] as const

// GET /api/admin/promotions — list all promotions ordered by created_at desc
export async function GET() {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const sc = createServiceClient()
    const { data: promotions, error: dbError } = await sc
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false })

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 })

    // Stats: active count + redemptions this month
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [{ count: activeCount }, { count: redemptionsThisMonth }] = await Promise.all([
      sc.from('promotions').select('*', { count: 'exact', head: true }).eq('is_active', true),
      sc.from('promotion_redemptions').select('*', { count: 'exact', head: true }).gte('redeemed_at', monthStart),
    ])

    return Response.json({
      promotions: promotions ?? [],
      stats: { active: activeCount ?? 0, redemptions_this_month: redemptionsThisMonth ?? 0 },
    })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/promotions — create a new promotion
export async function POST(request: Request) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const body = await request.json() as {
      code: string; kind: string; value?: number; tier_grant?: string
      max_uses?: number; starts_at?: string; ends_at?: string; notes?: string
    }

    const code = (body.code ?? '').toUpperCase().trim()
    if (!code || !CODE_RE.test(code)) {
      return Response.json({ error: 'Code must be uppercase alphanumeric with dashes only' }, { status: 400 })
    }
    if (!VALID_KINDS.includes(body.kind as typeof VALID_KINDS[number])) {
      return Response.json({ error: `Kind must be one of: ${VALID_KINDS.join(', ')}` }, { status: 400 })
    }

    const sc = createServiceClient()
    const { data: promo, error: insertError } = await sc
      .from('promotions')
      .insert({
        code,
        kind: body.kind,
        value: body.value ?? null,
        tier_grant: body.tier_grant ?? null,
        max_uses: body.max_uses ?? null,
        starts_at: body.starts_at ?? null,
        ends_at: body.ends_at ?? null,
        notes: body.notes ?? null,
        is_active: true,
        used_count: 0,
      })
      .select()
      .single()

    if (insertError) return Response.json({ error: insertError.message }, { status: 500 })

    try {
      await sc.from('admin_audit_log').insert({ action: 'promo.create', target_type: 'promotion', target_id: promo.id, diff: { after: promo } })
    } catch { /* non-critical */ }

    return Response.json({ promotion: promo }, { status: 201 })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 })
  }
}
