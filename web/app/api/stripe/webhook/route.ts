import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/server'
import type { SubscriptionTier } from '@/types'

export const runtime = 'nodejs'

// Lazy-initialized to avoid build-time env requirement
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })
}

// Map Stripe price/product metadata to subscription tier
function getTierFromStripeData(data: Stripe.Subscription | Stripe.Checkout.Session): SubscriptionTier {
  const metadata = data.metadata ?? {}
  const tier = metadata.tier as SubscriptionTier | undefined
  if (tier === 'premium' || tier === 'pro') return tier
  return 'free'
}

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')

    if (!sig) {
      return Response.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    let event: Stripe.Event
    try {
      event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Webhook signature verification failed'
      return Response.json({ error: message }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // ── Idempotency guard ──────────────────────────────────────────────
    // Insert event.id (unique PK) — if already exists, Stripe retried this event.
    // PostgreSQL UNIQUE constraint handles concurrent retries safely.
    const { error: idempotencyError } = await serviceClient
      .from('stripe_events')
      .insert({ id: event.id, type: event.type })

    if (idempotencyError) {
      // Duplicate key → already processed; acknowledge to stop Stripe retrying
      if (idempotencyError.code === '23505') {
        console.log(`[stripe-webhook] Duplicate event ${event.id} — skipping`)
        return Response.json({ received: true, skipped: true })
      }
      // Unexpected DB error — log but don't fail (let it retry)
      console.error('[stripe-webhook] Idempotency insert error:', idempotencyError)
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        const tier = getTierFromStripeData(session)
        const userId = session.metadata?.user_id

        // Update subscription record
        await serviceClient.from('subscriptions').upsert({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status: 'active',
          tier,
          user_id: userId ?? null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'stripe_customer_id' })

        // Update profile tier
        if (userId) {
          await serviceClient
            .from('profiles')
            .update({ subscription_tier: tier })
            .eq('id', userId)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const tier = getTierFromStripeData(subscription)

        await serviceClient
          .from('subscriptions')
          .update({
            status: subscription.status,
            tier,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)

        // Sync profile tier
        const { data: sub } = await serviceClient
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (sub?.user_id) {
          await serviceClient
            .from('profiles')
            .update({ subscription_tier: tier })
            .eq('id', sub.user_id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await serviceClient
          .from('subscriptions')
          .update({
            status: 'canceled',
            tier: 'free',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)

        // Reset profile to free
        const { data: sub } = await serviceClient
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (sub?.user_id) {
          await serviceClient
            .from('profiles')
            .update({ subscription_tier: 'free' })
            .eq('id', sub.user_id)
        }
        break
      }

      default:
        // Unhandled event — acknowledge receipt
        break
    }

    return Response.json({ received: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
