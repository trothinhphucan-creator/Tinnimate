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

function sortObject(obj: Record<string, string>): Record<string, string> {
  return Object.keys(obj).sort().reduce((result: Record<string, string>, key) => {
    result[key] = obj[key]
    return result
  }, {})
}

// POST /api/payment/vnpay
// Body: { tier: 'premium' | 'pro', yearly?: boolean }
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { tier, yearly = false } = await request.json() as { tier: string; yearly?: boolean }
    const config = await getPricingConfig()
    if (!config) return Response.json({ error: 'Pricing not configured' }, { status: 500 })

    const gw = config.gateways.vnpay
    if (!gw.enabled) return Response.json({ error: 'VNPay is not enabled' }, { status: 400 })

    const plan = config.plans.find(p => p.tier === tier)
    if (!plan || plan.price_vnd === 0) return Response.json({ error: 'Invalid plan' }, { status: 400 })

    const amount = yearly
      ? Math.round(plan.price_vnd * 12 * (1 - config.yearly_discount / 100))
      : plan.price_vnd

    const origin = request.headers.get('origin') ?? 'https://tinnimate.vuinghe.com'
    const orderId = `${Date.now()}`
    const createDate = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)

    const params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: gw.tmn_code,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `TinniMate ${plan.name} ${yearly ? 'Yearly' : 'Monthly'}`,
      vnp_OrderType: 'other',
      vnp_Amount: String(amount * 100), // VNPay uses smallest unit (đồng * 100)
      vnp_ReturnUrl: `${origin}/api/payment/vnpay/callback`,
      vnp_IpAddr: request.headers.get('x-forwarded-for') ?? '127.0.0.1',
      vnp_CreateDate: createDate,
      vnp_ExpireDate: new Date(Date.now() + 15 * 60 * 1000).toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
    }

    // Store order info for callback
    const sc = createServiceClient()
    await sc.from('payment_orders').insert({
      order_id: orderId,
      user_id: user.id,
      tier,
      yearly,
      amount,
      provider: 'vnpay',
      status: 'pending',
    })

    // Sign with HMAC-SHA512
    const sorted = sortObject(params)
    const signData = new URLSearchParams(sorted).toString()
    const hmac = crypto.createHmac('sha512', gw.hash_secret)
    const signed = hmac.update(signData).digest('hex')

    const paymentUrl = `${gw.endpoint}?${signData}&vnp_SecureHash=${signed}`

    return Response.json({ url: paymentUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
