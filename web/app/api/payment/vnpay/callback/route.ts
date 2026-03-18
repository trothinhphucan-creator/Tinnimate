import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import crypto from 'crypto'
import type { PricingConfig, SubscriptionTier } from '@/types'

export const runtime = 'nodejs'

// GET /api/payment/vnpay/callback — VNPay return URL
export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries())
    const secureHash = params['vnp_SecureHash']
    delete params['vnp_SecureHash']
    delete params['vnp_SecureHashType']

    // Verify signature
    const sc = createServiceClient()
    const { data: configData } = await sc.from('admin_config').select('pricing_config').limit(1).single()
    const config = (configData as { pricing_config: PricingConfig } | null)?.pricing_config
    if (!config) return Response.redirect(new URL('/pricing', request.url))

    const sorted = Object.keys(params).sort().reduce((r: Record<string, string>, k) => {
      r[k] = params[k]
      return r
    }, {})
    const signData = new URLSearchParams(sorted).toString()
    const hmac = crypto.createHmac('sha512', config.gateways.vnpay.hash_secret)
    const checkHash = hmac.update(signData).digest('hex')

    const origin = request.nextUrl.origin
    
    if (secureHash !== checkHash) {
      return Response.redirect(`${origin}/pricing?error=invalid_signature`)
    }

    const responseCode = params['vnp_ResponseCode']
    const orderId = params['vnp_TxnRef']

    if (responseCode !== '00') {
      return Response.redirect(`${origin}/pricing?error=payment_failed`)
    }

    // Look up order
    const { data: order } = await sc
      .from('payment_orders')
      .select('user_id, tier, yearly')
      .eq('order_id', orderId)
      .eq('provider', 'vnpay')
      .single()

    if (!order) return Response.redirect(`${origin}/pricing?error=order_not_found`)

    // Update subscription
    await sc.from('profiles')
      .update({ subscription_tier: order.tier as SubscriptionTier })
      .eq('id', order.user_id)

    await sc.from('subscriptions').upsert({
      user_id: order.user_id,
      subscription_tier: order.tier,
      payment_provider: 'vnpay',
      payment_ref: orderId,
      status: 'active',
      period: order.yearly ? 'yearly' : 'monthly',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    // Mark order complete
    await sc.from('payment_orders')
      .update({ status: 'completed' })
      .eq('order_id', orderId)

    return Response.redirect(`${origin}/chat?upgrade=success`)
  } catch {
    const origin = request.nextUrl.origin
    return Response.redirect(`${origin}/pricing?error=server_error`)
  }
}
