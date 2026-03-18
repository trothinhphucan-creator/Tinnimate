import { createServiceClient } from '@/lib/supabase/server'
import type { PricingConfig, SubscriptionTier } from '@/types'

export const runtime = 'nodejs'

// POST /api/payment/momo/callback — IPN from MoMo
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { resultCode, extraData, orderId } = body

    if (resultCode !== 0) {
      // Payment failed or cancelled
      return Response.json({ message: 'Payment not successful' })
    }

    // Decode user info from extraData
    const userData = JSON.parse(Buffer.from(extraData, 'base64').toString('utf8')) as {
      user_id: string
      tier: SubscriptionTier
      yearly: boolean
    }

    // Get pricing config to verify
    const sc = createServiceClient()

    // Update user subscription tier
    await sc.from('profiles').update({ subscription_tier: userData.tier }).eq('id', userData.user_id)

    // Record payment
    await sc.from('subscriptions').upsert({
      user_id: userData.user_id,
      subscription_tier: userData.tier,
      payment_provider: 'momo',
      payment_ref: orderId,
      status: 'active',
      period: userData.yearly ? 'yearly' : 'monthly',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    return Response.json({ message: 'OK' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
