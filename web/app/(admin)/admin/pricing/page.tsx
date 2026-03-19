'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import type { PricingConfig, PlanConfig, PaymentGateways } from '@/types'

const DEFAULT_CONFIG: PricingConfig = {
  plans: [
    { tier: 'free', name: 'Free', emoji: '🆓', price_usd: 0, price_vnd: 0, stripe_price_id: '', features_en: ['5 messages/day'], features_vi: ['5 tin nhắn/ngày'], highlighted: false },
    { tier: 'premium', name: 'Premium', emoji: '⭐', price_usd: 4.99, price_vnd: 99000, stripe_price_id: '', features_en: ['Unlimited'], features_vi: ['Không giới hạn'], highlighted: true },
    { tier: 'pro', name: 'Pro', emoji: '💎', price_usd: 9.99, price_vnd: 199000, stripe_price_id: '', features_en: ['All Premium'], features_vi: ['Tất cả Premium'], highlighted: false },
  ],
  gateways: {
    stripe: { enabled: true, secret_key: '', webhook_secret: '' },
    momo: { enabled: false, partner_code: '', access_key: '', secret_key: '', endpoint: 'https://test-payment.momo.vn/v2/gateway/api/create' },
    vnpay: { enabled: false, tmn_code: '', hash_secret: '', endpoint: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html' },
  },
  trial_days: 7,
  yearly_discount: 20,
}

export default function AdminPricingPage() {
  const [config, setConfig] = useState<PricingConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch('/api/admin/config')
      .then(r => r.json())
      .then(d => { if (d.pricing_config) setConfig(d.pricing_config) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const save = useCallback(async () => {
    setSaving(true); setMsg('')
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pricing_config: config }),
      })
      if (res.ok) setMsg('✅ Saved!')
      else setMsg('❌ Error saving')
    } catch { setMsg('❌ Network error') }
    finally { setSaving(false) }
  }, [config])

  const updatePlan = (idx: number, field: keyof PlanConfig, value: unknown) => {
    setConfig(c => ({
      ...c,
      plans: c.plans.map((p, i) => i === idx ? { ...p, [field]: value } : p),
    }))
  }

  const updateGateway = <G extends keyof PaymentGateways>(
    gw: G, field: string, value: string | boolean
  ) => {
    setConfig(c => ({
      ...c,
      gateways: { ...c.gateways, [gw]: { ...c.gateways[gw], [field]: value } },
    }))
  }

  if (loading) return <div className="p-8 text-slate-500">Loading...</div>

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">💰 Pricing & Payments</h1>
          <p className="text-slate-400 text-sm">Manage plans, prices, and payment gateways</p>
        </div>
        <button onClick={save} disabled={saving}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-500 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
      {msg && <div className="mb-4 text-sm">{msg}</div>}

      {/* Global settings */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-white mb-3">⚙️ Global Settings</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Trial Days (free → premium)</label>
            <input type="number" value={config.trial_days}
              onChange={e => setConfig(c => ({ ...c, trial_days: +e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white" />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Yearly Discount (%)</label>
            <input type="number" min={0} max={50} value={config.yearly_discount}
              onChange={e => setConfig(c => ({ ...c, yearly_discount: +e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white" />
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-white mb-3">📋 Plans</h2>
        <div className="space-y-4">
          {config.plans.map((plan, idx) => (
            <div key={plan.tier} className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{plan.emoji}</span>
                <span className="text-sm font-semibold text-white">{plan.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-400">{plan.tier}</span>
                {plan.highlighted && <span className="text-[10px] px-2 py-0.5 rounded bg-blue-600/20 text-blue-400">Highlighted</span>}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Name</label>
                  <input value={plan.name} onChange={e => updatePlan(idx, 'name', e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-800 border border-white/10 rounded text-xs text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Price USD</label>
                  <input type="number" step="0.01" value={plan.price_usd}
                    onChange={e => updatePlan(idx, 'price_usd', +e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-800 border border-white/10 rounded text-xs text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Price VND</label>
                  <input type="number" step="1000" value={plan.price_vnd}
                    onChange={e => updatePlan(idx, 'price_vnd', +e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-800 border border-white/10 rounded text-xs text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Stripe Price ID</label>
                  <input value={plan.stripe_price_id}
                    onChange={e => updatePlan(idx, 'stripe_price_id', e.target.value)}
                    placeholder="price_xxx"
                    className="w-full px-2 py-1.5 bg-slate-800 border border-white/10 rounded text-xs text-white placeholder:text-slate-600" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Features (EN) — one per line</label>
                  <textarea value={plan.features_en.join('\n')} rows={3}
                    onChange={e => updatePlan(idx, 'features_en', e.target.value.split('\n'))}
                    className="w-full px-2 py-1.5 bg-slate-800 border border-white/10 rounded text-xs text-white resize-none" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Features (VI) — one per line</label>
                  <textarea value={plan.features_vi.join('\n')} rows={3}
                    onChange={e => updatePlan(idx, 'features_vi', e.target.value.split('\n'))}
                    className="w-full px-2 py-1.5 bg-slate-800 border border-white/10 rounded text-xs text-white resize-none" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Gateways */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-3">💳 Payment Gateways</h2>
        <div className="space-y-4">
          {/* Stripe */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">💳</span>
                <span className="text-sm font-semibold text-white">Stripe</span>
                <span className="text-[10px] text-slate-500">(International)</span>
              </div>
              <button onClick={() => updateGateway('stripe', 'enabled', !config.gateways.stripe.enabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  config.gateways.stripe.enabled ? 'bg-emerald-600' : 'bg-slate-700'
                }`}>
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  config.gateways.stripe.enabled ? 'translate-x-5' : 'translate-x-1'
                }`} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Secret Key</label>
                <input type="password" placeholder="sk_live_xxx" value={config.gateways.stripe.secret_key}
                  onChange={e => updateGateway('stripe', 'secret_key', e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-800 border border-white/10 rounded text-xs text-white placeholder:text-slate-600" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Webhook Secret</label>
                <input type="password" placeholder="whsec_xxx" value={config.gateways.stripe.webhook_secret}
                  onChange={e => updateGateway('stripe', 'webhook_secret', e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-800 border border-white/10 rounded text-xs text-white placeholder:text-slate-600" />
              </div>
            </div>
          </div>

          {/* MoMo */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🟣</span>
                <span className="text-sm font-semibold text-white">MoMo</span>
                <span className="text-[10px] text-slate-500">(Vietnam)</span>
              </div>
              <button onClick={() => updateGateway('momo', 'enabled', !config.gateways.momo.enabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  config.gateways.momo.enabled ? 'bg-emerald-600' : 'bg-slate-700'
                }`}>
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  config.gateways.momo.enabled ? 'translate-x-5' : 'translate-x-1'
                }`} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Partner Code</label>
                <input placeholder="MOMO_PARTNER" value={config.gateways.momo.partner_code}
                  onChange={e => updateGateway('momo', 'partner_code', e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-800 border border-white/10 rounded text-xs text-white placeholder:text-slate-600" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Access Key</label>
                <input type="password" value={config.gateways.momo.access_key}
                  onChange={e => updateGateway('momo', 'access_key', e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-800 border border-white/10 rounded text-xs text-white placeholder:text-slate-600" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Secret Key</label>
                <input type="password" value={config.gateways.momo.secret_key}
                  onChange={e => updateGateway('momo', 'secret_key', e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-800 border border-white/10 rounded text-xs text-white placeholder:text-slate-600" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Endpoint</label>
                <input value={config.gateways.momo.endpoint}
                  onChange={e => updateGateway('momo', 'endpoint', e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-800 border border-white/10 rounded text-xs text-white" />
              </div>
            </div>
          </div>

          {/* VNPay */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏦</span>
                <span className="text-sm font-semibold text-white">VNPay</span>
                <span className="text-[10px] text-slate-500">(Vietnam)</span>
              </div>
              <button onClick={() => updateGateway('vnpay', 'enabled', !config.gateways.vnpay.enabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  config.gateways.vnpay.enabled ? 'bg-emerald-600' : 'bg-slate-700'
                }`}>
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  config.gateways.vnpay.enabled ? 'translate-x-5' : 'translate-x-1'
                }`} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">TMN Code</label>
                <input placeholder="VNPAY_TMN" value={config.gateways.vnpay.tmn_code}
                  onChange={e => updateGateway('vnpay', 'tmn_code', e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-800 border border-white/10 rounded text-xs text-white placeholder:text-slate-600" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Hash Secret</label>
                <input type="password" value={config.gateways.vnpay.hash_secret}
                  onChange={e => updateGateway('vnpay', 'hash_secret', e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-800 border border-white/10 rounded text-xs text-white placeholder:text-slate-600" />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] text-slate-500 block mb-1">Endpoint</label>
                <input value={config.gateways.vnpay.endpoint}
                  onChange={e => updateGateway('vnpay', 'endpoint', e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-800 border border-white/10 rounded text-xs text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
