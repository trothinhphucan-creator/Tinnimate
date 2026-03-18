import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import type { PricingConfig } from '@/types'

export const runtime = 'nodejs'

async function getPricingConfig(): Promise<PricingConfig | null> {
  const sc = createServiceClient()
  const { data } = await sc.from('admin_config').select('pricing_config').limit(1).single()
  return (data as { pricing_config: PricingConfig } | null)?.pricing_config ?? null
}

// POST /api/payment/momo
// Body: { tier: 'premium' | 'pro', yearly?: boolean }
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { tier, yearly = false } = await request.json() as { tier: string; yearly?: boolean }
    const config = await getPricingConfig()
    if (!config) return Response.json({ error: 'Pricing not configured' }, { status: 500 })

    const gw = config.gateways.momo
    if (!gw.enabled) return Response.json({ error: 'MoMo is not enabled' }, { status: 400 })

    const plan = config.plans.find(p => p.tier === tier)
    if (!plan || plan.price_vnd === 0) return Response.json({ error: 'Invalid plan' }, { status: 400 })

    const amount = yearly
      ? Math.round(plan.price_vnd * 12 * (1 - config.yearly_discount / 100))
      : plan.price_vnd

    const orderId = `TINNI_${user.id.slice(0, 8)}_${Date.now()}`
    const requestId = orderId
    const origin = request.headers.get('origin') ?? 'https://tinnimate.vuinghe.com'
    const orderInfo = `TinniMate ${plan.name} - ${yearly ? 'Yearly' : 'Monthly'}`
    const redirectUrl = `${origin}/chat?upgrade=success`
    const ipnUrl = `${origin}/api/payment/momo/callback`
    const requestType = 'payWithMethod'
    const extraData = Buffer.from(JSON.stringify({ user_id: user.id, tier, yearly })).toString('base64')

    // Create HMAC SHA256 signature
    const rawSig = `accessKey=${gw.access_key}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${gw.partner_code}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`
    const signature = crypto.createHmac('sha256', gw.secret_key).update(rawSig).digest('hex')

    const body = {
      partnerCode: gw.partner_code,
      partnerName: 'TinniMate',
      storeId: 'TinniMateStore',
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang: 'vi',
      requestType,
      extraData,
      signature,
    }

    const res = await fetch(gw.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const result = await res.json()

    if (result.resultCode === 0) {
      return Response.json({ url: result.payUrl })
    }
    return Response.json({ error: result.message ?? 'MoMo error' }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
