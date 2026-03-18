import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })
}

// POST /api/stripe/checkout
// Body: { priceId: string, yearly: boolean }
// Returns: { url: string } — Stripe-hosted checkout URL
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { priceId, yearly } = await request.json() as { priceId: string; yearly: boolean }

    if (!priceId) {
      return Response.json({ error: 'Missing priceId' }, { status: 400 })
    }

    const origin = request.headers.get('origin') ?? 'http://localhost:3000'

    // Look up existing Stripe customer for this user
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/chat?upgrade=success`,
      cancel_url: `${origin}/pricing`,
      metadata: { user_id: user.id },
      subscription_data: {
        metadata: { user_id: user.id },
        trial_period_days: yearly ? undefined : 7,
      },
      allow_promotion_codes: true,
    }

    // Re-use existing Stripe customer when available
    if (existingSub?.stripe_customer_id) {
      sessionParams.customer = existingSub.stripe_customer_id
    } else {
      sessionParams.customer_email = user.email
    }

    const session = await getStripe().checkout.sessions.create(sessionParams)

    return Response.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
