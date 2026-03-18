// Stripe plan definitions and server-side client factory
import Stripe from 'stripe'

export const STRIPE_PLANS = {
  premium: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
    name: 'Premium',
    price: 9.99,
    currency: 'usd',
  },
  pro: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    name: 'Pro',
    price: 19.99,
    currency: 'usd',
  },
} as const

// Server-side only — never expose STRIPE_SECRET_KEY to the client
export function createStripeClient(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-02-25.clover',
  })
}
