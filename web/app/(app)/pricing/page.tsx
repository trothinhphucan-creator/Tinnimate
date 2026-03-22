'use client'

import { useState, useEffect } from 'react'
import { useUserStore } from '@/stores/use-user-store'
import { useLangStore } from '@/stores/use-lang-store'
import { Check, X, Sparkles, CreditCard } from 'lucide-react'
import type { SubscriptionTier, PricingConfig, PlanConfig } from '@/types'

const COMPARISON_KEYS = [
  { key: 'chat', vi: 'Chat AI', en: 'AI Chat', free: '5/ngày', premium: '∞', pro: '∞ + priority', ultra: '∞ + priority' },
  { key: 'sounds', vi: 'Âm thanh trị liệu', en: 'Therapy sounds', free: '3', premium: '11+', pro: '11+', ultra: '11+' },
  { key: 'quiz', vi: 'Bộ câu hỏi', en: 'Quizzes', free: '1/tháng', premium: '∞', pro: '∞', ultra: '∞' },
  { key: 'mixer', vi: 'Sound Mixer', en: 'Sound Mixer', free: false, premium: true, pro: true, ultra: true },
  { key: 'notch', vi: 'Notch Therapy', en: 'Notch Therapy', free: false, premium: true, pro: true, ultra: true },
  { key: 'sleep', vi: 'Chế độ ngủ', en: 'Sleep Mode', free: false, premium: true, pro: true, ultra: true },
  { key: 'zentones', vi: 'Zentones ✨', en: 'Zentones ✨', free: false, premium: false, pro: false, ultra: true },
  { key: 'cbti', vi: 'CBT-i', en: 'CBT-i', free: 'Tuần 1', premium: '4 tuần', pro: '4 tuần', ultra: '4 tuần' },
  { key: 'charts', vi: 'Biểu đồ', en: 'Charts', free: false, premium: true, pro: true, ultra: true },
  { key: 'pdf', vi: 'Xuất PDF', en: 'PDF export', free: false, premium: true, pro: true, ultra: true },
  { key: 'ent', vi: 'Bác sĩ TMH', en: 'ENT specialist', free: false, premium: false, pro: true, ultra: true },
  { key: 'family', vi: 'Family plan', en: 'Family plan', free: false, premium: false, pro: true, ultra: true },
]

type Gateway = 'stripe' | 'momo' | 'vnpay'
const GW_INFO: Record<Gateway, { icon: string; label: string; labelVi: string }> = {
  stripe: { icon: '💳', label: 'Credit Card', labelVi: 'Thẻ quốc tế' },
  momo: { icon: '🟣', label: 'MoMo Wallet', labelVi: 'Ví MoMo' },
  vnpay: { icon: '🏦', label: 'VNPay / ATM', labelVi: 'VNPay / ATM' },
}

export default function PricingPage() {
  const { user } = useUserStore()
  const { lang } = useLangStore()
  const isEn = lang === 'en'
  const isVN = lang === 'vi'
  const currentTier = (user?.subscription_tier ?? 'free') as SubscriptionTier
  const [yearly, setYearly] = useState(false)
  const [loadingGw, setLoadingGw] = useState<string | null>(null)
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null)
  const [selectedGw, setSelectedGw] = useState<Gateway>('stripe')

  // Fetch pricing config from DB
  useEffect(() => {
    fetch('/api/pricing-config')
      .then(r => r.json())
      .then(d => {
        if (d.pricing_config) {
          setPricingConfig(d.pricing_config)
          // Default to MoMo for VN locale if enabled
          const gw = d.pricing_config.gateways
          if (isVN && gw.momo?.enabled) setSelectedGw('momo')
          else if (isVN && gw.vnpay?.enabled) setSelectedGw('vnpay')
        }
      })
      .catch(() => {})
  }, [isVN])

  // Fallback plans if DB not loaded yet
  const plans: PlanConfig[] = pricingConfig?.plans ?? [
    { tier: 'free', name: 'Free', emoji: '🆓', price_usd: 0, price_vnd: 0, stripe_price_id: '', features_en: ['5 messages/day', '3 basic sounds', 'Hearing test'], features_vi: ['5 tin nhắn/ngày', '3 âm thanh cơ bản', 'Kiểm tra thính lực'], highlighted: false },
    { tier: 'premium', name: 'Premium', emoji: '⭐', price_usd: 4.99, price_vnd: 99000, stripe_price_id: '', features_en: ['Unlimited chat', 'All sounds', 'Sound Mixer', 'Notch Therapy', 'Sleep Mode'], features_vi: ['Chat không giới hạn', 'Tất cả âm thanh', 'Sound Mixer', 'Notch Therapy', 'Chế độ ngủ'], highlighted: false },
    { tier: 'pro', name: 'Pro', emoji: '💎', price_usd: 9.99, price_vnd: 199000, stripe_price_id: '', features_en: ['All Premium', 'Priority AI', 'ENT specialist'], features_vi: ['Tất cả Premium', 'AI ưu tiên', 'Bác sĩ TMH'], highlighted: false },
    { tier: 'ultra', name: 'Ultra', emoji: '✨', price_usd: 14.99, price_vnd: 299000, stripe_price_id: '', features_en: ['All Pro features', 'Zentones ✨', 'Fractal music therapy', 'Never-repeating melodies'], features_vi: ['Tất cả tính năng Pro', 'Zentones ✨', 'Liệu pháp nhạc fractal', 'Giai điệu không lặp lại'], highlighted: true },
  ]
  const discount = pricingConfig?.yearly_discount ?? 20
  const enabledGateways = Object.entries(pricingConfig?.gateways ?? { stripe: { enabled: true } })
    .filter(([, v]) => (v as { enabled: boolean }).enabled)
    .map(([k]) => k as Gateway)

  const getPrice = (plan: PlanConfig) => {
    const base = isVN ? plan.price_vnd : plan.price_usd
    if (base === 0) return isVN ? '0₫' : '$0'
    const price = yearly ? base * (1 - discount / 100) : base
    if (isVN) return `${Math.round(price).toLocaleString('vi-VN')}₫`
    return `$${price.toFixed(2)}`
  }

  const handleUpgrade = async (plan: PlanConfig) => {
    if (plan.tier === 'free' || plan.tier === currentTier) return
    setLoadingGw(plan.tier)
    try {
      let endpoint: string
      let body: Record<string, unknown>

      if (selectedGw === 'stripe') {
        endpoint = '/api/stripe/checkout'
        body = { priceId: plan.stripe_price_id, yearly }
      } else if (selectedGw === 'momo') {
        endpoint = '/api/payment/momo'
        body = { tier: plan.tier, yearly }
      } else {
        endpoint = '/api/payment/vnpay'
        body = { tier: plan.tier, yearly }
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const { url, error } = await res.json()
      if (url) window.location.href = url
      else if (error) alert(error)
    } catch {
    } finally {
      setLoadingGw(null)
    }
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-8">
      <div className="mx-auto max-w-4xl flex flex-col gap-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">{isEn ? 'Plans & Pricing' : 'Bảng Giá'}</h1>
          <p className="text-slate-400 text-sm mt-1">
            {isEn ? 'Choose the plan that works for you' : 'Chọn gói phù hợp với bạn'}
          </p>
        </div>

        {/* Yearly toggle */}
        <div className="flex items-center justify-center gap-3 text-sm">
          <span className={!yearly ? 'text-white font-medium' : 'text-slate-400'}>
            {isEn ? 'Monthly' : 'Hàng tháng'}
          </span>
          <button onClick={() => setYearly(v => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              yearly ? 'bg-blue-600' : 'bg-slate-700'
            }`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              yearly ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
          <span className={yearly ? 'text-white font-medium' : 'text-slate-400'}>
            {isEn ? 'Yearly' : 'Hàng năm'}{' '}
            <span className="rounded-full bg-emerald-600/20 text-emerald-400 px-2 py-0.5 text-xs ml-1">-{discount}%</span>
          </span>
        </div>

        {/* Payment method */}
        {enabledGateways.length > 1 && (
          <div className="flex items-center justify-center gap-2">
            <CreditCard size={14} className="text-slate-500" />
            <span className="text-xs text-slate-500">{isEn ? 'Pay with:' : 'Thanh toán:'}</span>
            {enabledGateways.map(gw => (
              <button key={gw} onClick={() => setSelectedGw(gw)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                  selectedGw === gw
                    ? 'bg-blue-600/20 border-blue-500/30 text-blue-300'
                    : 'bg-white/[0.02] border-white/5 text-slate-500 hover:text-white'
                }`}>
                <span>{GW_INFO[gw].icon}</span>
                <span>{isEn ? GW_INFO[gw].label : GW_INFO[gw].labelVi}</span>
              </button>
            ))}
          </div>
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map(plan => {
            const isCurrent = plan.tier === currentTier
            const isHighlighted = plan.highlighted

            return (
              <div key={plan.tier}
                className={`rounded-2xl border p-5 flex flex-col gap-4 transition-all ${
                  isHighlighted
                    ? 'border-blue-500/50 bg-blue-600/5 ring-1 ring-blue-500/30 shadow-lg shadow-blue-500/5'
                    : 'border-white/5 bg-white/[0.02]'
                }`}>
                {isHighlighted && (
                  <span className="self-start rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-3 py-0.5 text-xs font-semibold text-white flex items-center gap-1">
                    <Sparkles size={10} /> {isEn ? 'Most Popular' : 'Phổ biến nhất'}
                  </span>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{plan.emoji}</span>
                    <p className="font-semibold text-lg text-white">{plan.name}</p>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">{getPrice(plan)}</span>
                    <span className="text-sm text-slate-500">/{isEn ? 'month' : 'tháng'}</span>
                  </div>
                  {yearly && plan.price_usd > 0 && (
                    <p className="text-xs text-slate-600 mt-0.5 line-through">
                      {isVN ? `${plan.price_vnd.toLocaleString('vi-VN')}₫` : `$${plan.price_usd.toFixed(2)}`}/{isEn ? 'mo' : 'tháng'}
                    </p>
                  )}
                </div>

                <ul className="flex-1 flex flex-col gap-2">
                  {(isEn ? plan.features_en : plan.features_vi).map(feat => (
                    <li key={feat} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-blue-400 mt-0.5 shrink-0">✓</span>
                      {feat}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-600/10 px-4 py-2.5 text-center text-sm font-medium text-emerald-400">
                    ✓ {isEn ? 'Current Plan' : 'Gói hiện tại'}
                  </div>
                ) : plan.tier === 'free' ? (
                  <div className="rounded-xl border border-white/5 px-4 py-2.5 text-center text-sm text-slate-600">
                    {isEn ? 'Free forever' : 'Miễn phí mãi mãi'}
                  </div>
                ) : (
                  <button onClick={() => handleUpgrade(plan)}
                    disabled={loadingGw !== null}
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                      isHighlighted
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-500 hover:to-cyan-500'
                        : 'border border-white/10 text-white hover:bg-white/[0.05]'
                    }`}>
                    {loadingGw === plan.tier
                      ? (isEn ? 'Processing...' : 'Đang xử lý...')
                      : <>
                          <span>{GW_INFO[selectedGw].icon}</span>
                          {isEn ? `Upgrade with ${GW_INFO[selectedGw].label}` : `Nâng cấp qua ${GW_INFO[selectedGw].labelVi}`}
                        </>}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Feature comparison */}
        <div className="mt-4">
          <h2 className="text-sm font-semibold text-slate-400 text-center mb-4">
            {isEn ? 'Feature Comparison' : 'So Sánh Tính Năng'}
          </h2>
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-5 text-xs font-semibold text-slate-400 border-b border-white/5">
              <div className="p-3">{isEn ? 'Feature' : 'Tính năng'}</div>
              <div className="p-3 text-center">🆓 Free</div>
              <div className="p-3 text-center">⭐ Premium</div>
              <div className="p-3 text-center">💎 Pro</div>
              <div className="p-3 text-center">✨ Ultra</div>
            </div>
            {COMPARISON_KEYS.map((row, i) => (
              <div key={row.key} className={`grid grid-cols-5 text-xs border-b border-white/5 last:border-b-0 ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                <div className="p-3 text-slate-300">{isEn ? row.en : row.vi}</div>
                {(['free', 'premium', 'pro', 'ultra'] as const).map(tier => {
                  const val = row[tier]
                  return (
                    <div key={tier} className="p-3 text-center">
                      {val === true ? <Check size={14} className="mx-auto text-emerald-400" /> :
                       val === false ? <X size={14} className="mx-auto text-slate-700" /> :
                       <span className="text-slate-400">{val}</span>}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex justify-center gap-6 text-center text-xs text-slate-600 pb-8">
          <div>🔒 {isEn ? 'Secure payment' : 'Thanh toán an toàn'}</div>
          <div>↩️ {isEn ? 'Cancel anytime' : 'Hủy bất cứ lúc nào'}</div>
          {enabledGateways.map(gw => (
            <div key={gw}>{GW_INFO[gw].icon} {GW_INFO[gw].label}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
