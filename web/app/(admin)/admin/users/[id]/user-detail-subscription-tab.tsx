'use client'

import type { SubscriptionRow, PaymentOrderRow } from '@/types'

interface Props {
  subscription: SubscriptionRow | null
  orders: PaymentOrderRow[]
}

const STATUS_STYLE: Record<string, string> = {
  active:   'bg-emerald-500/20 text-emerald-400',
  canceled: 'bg-red-500/20 text-red-400',
  past_due: 'bg-amber-500/20 text-amber-400',
  trialing: 'bg-blue-500/20 text-blue-400',
}

const ORDER_STATUS_STYLE: Record<string, string> = {
  paid:     'bg-emerald-500/20 text-emerald-400',
  pending:  'bg-amber-500/20 text-amber-400',
  failed:   'bg-red-500/20 text-red-400',
  refunded: 'bg-slate-500/20 text-slate-400',
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-white/[0.03] rounded-lg p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm text-white break-all">{value ?? '—'}</p>
    </div>
  )
}

export function SubscriptionTab({ subscription, orders }: Props) {
  if (!subscription) {
    return <p className="text-sm text-slate-500">No subscription found for this user.</p>
  }

  const statusStyle = STATUS_STYLE[subscription.status] ?? 'bg-slate-500/20 text-slate-400'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/[0.03] rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-1">Status</p>
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle}`}>
            {subscription.status}
          </span>
        </div>
        <Field label="Period End"
          value={subscription.current_period_end
            ? new Date(subscription.current_period_end).toLocaleDateString()
            : null} />
        <div className="bg-white/[0.03] rounded-lg p-3 col-span-2">
          <p className="text-xs text-slate-500 mb-1">Stripe Subscription ID</p>
          {subscription.stripe_subscription_id
            ? <a href={`https://dashboard.stripe.com/subscriptions/${subscription.stripe_subscription_id}`}
                target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 font-mono break-all">
                {subscription.stripe_subscription_id}
              </a>
            : <p className="text-sm text-slate-500">—</p>}
        </div>
        <Field label="Stripe Price ID" value={
          <span className="font-mono text-xs">{subscription.stripe_price_id}</span>
        } />
        <Field label="Created" value={new Date(subscription.created_at).toLocaleDateString()} />
      </div>

      {/* Payment orders */}
      {orders.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 mb-2">Payment Orders</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-2 px-2 text-slate-500">Gateway</th>
                  <th className="text-left py-2 px-2 text-slate-500">Amount</th>
                  <th className="text-left py-2 px-2 text-slate-500">Status</th>
                  <th className="text-left py-2 px-2 text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="border-b border-white/[0.03]">
                    <td className="py-2 px-2 text-slate-300 capitalize">{o.gateway}</td>
                    <td className="py-2 px-2 text-white">{o.amount.toLocaleString()} {o.currency.toUpperCase()}</td>
                    <td className="py-2 px-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${ORDER_STATUS_STYLE[o.status] ?? ''}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-slate-500">{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
