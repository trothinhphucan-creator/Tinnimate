'use client'

import { useState } from 'react'
import { useUserStore } from '@/stores/use-user-store'
import { useLangStore } from '@/stores/use-lang-store'
import { Check, X, Sparkles } from 'lucide-react'
import type { SubscriptionTier } from '@/types'

interface Plan {
  tier: SubscriptionTier
  name: string
  emoji: string
  monthlyUSD: number
  monthlyVND: number
  features: { vi: string; en: string }[]
  priceIdEnv: string
}

const PLANS: Plan[] = [
  {
    tier: 'free', name: 'Free', emoji: '🆓',
    monthlyUSD: 0, monthlyVND: 0,
    features: [
      { vi: '5 tin nhắn/ngày', en: '5 messages/day' },
      { vi: '3 âm thanh cơ bản', en: '3 basic sounds' },
      { vi: 'Kiểm tra thính lực', en: 'Hearing test' },
      { vi: '1 bộ câu hỏi/tháng', en: '1 quiz/month' },
      { vi: 'Blog kiến thức', en: 'Knowledge blog' },
    ],
    priceIdEnv: '',
  },
  {
    tier: 'premium', name: 'Premium', emoji: '⭐',
    monthlyUSD: 4.99, monthlyVND: 99000,
    features: [
      { vi: 'Chat không giới hạn', en: 'Unlimited chat' },
      { vi: 'Toàn bộ 11+ âm thanh', en: 'All 11+ sounds' },
      { vi: 'Tất cả bộ câu hỏi', en: 'All quizzes' },
      { vi: 'Sound Mixer', en: 'Sound Mixer' },
      { vi: 'Notch Therapy', en: 'Notch Therapy' },
      { vi: 'Chế độ ngủ', en: 'Sleep Mode' },
      { vi: 'CBT-i đầy đủ 4 tuần', en: 'Full 4-week CBT-i' },
      { vi: 'Biểu đồ tiến triển', en: 'Progress charts' },
      { vi: 'Xuất PDF báo cáo', en: 'PDF export' },
    ],
    priceIdEnv: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID ?? '',
  },
  {
    tier: 'pro', name: 'Pro', emoji: '💎',
    monthlyUSD: 9.99, monthlyVND: 199000,
    features: [
      { vi: 'Tất cả Premium', en: 'Everything in Premium' },
      { vi: 'AI ưu tiên (phản hồi nhanh)', en: 'Priority AI (faster)' },
      { vi: 'Kết nối bác sĩ TMH', en: 'ENT specialist connect' },
      { vi: 'Hỗ trợ ưu tiên 24/7', en: 'Priority support 24/7' },
      { vi: 'Family plan (3 người)', en: 'Family plan (3 users)' },
    ],
    priceIdEnv: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? '',
  },
]

const COMPARISON = [
  { feature: { vi: 'Chat AI', en: 'AI Chat' }, free: '5/ngày', premium: '∞', pro: '∞ + priority' },
  { feature: { vi: 'Âm thanh trị liệu', en: 'Therapy sounds' }, free: '3', premium: '11+', pro: '11+' },
  { feature: { vi: 'Bộ câu hỏi', en: 'Quizzes' }, free: '1/tháng', premium: '∞', pro: '∞' },
  { feature: { vi: 'Sound Mixer', en: 'Sound Mixer' }, free: false, premium: true, pro: true },
  { feature: { vi: 'Notch Therapy', en: 'Notch Therapy' }, free: false, premium: true, pro: true },
  { feature: { vi: 'Chế độ ngủ', en: 'Sleep Mode' }, free: false, premium: true, pro: true },
  { feature: { vi: 'CBT-i', en: 'CBT-i' }, free: 'Tuần 1', premium: '4 tuần', pro: '4 tuần' },
  { feature: { vi: 'Biểu đồ tiến triển', en: 'Progress charts' }, free: false, premium: true, pro: true },
  { feature: { vi: 'Xuất PDF', en: 'PDF export' }, free: false, premium: true, pro: true },
  { feature: { vi: 'Bác sĩ TMH', en: 'ENT specialist' }, free: false, premium: false, pro: true },
  { feature: { vi: 'Family plan', en: 'Family plan' }, free: false, premium: false, pro: true },
]

export default function PricingPage() {
  const { user } = useUserStore()
  const { lang } = useLangStore()
  const isEn = lang === 'en'
  const currentTier = (user?.subscription_tier ?? 'free') as SubscriptionTier
  const [yearly, setYearly] = useState(false)
  const [loadingTier, setLoadingTier] = useState<SubscriptionTier | null>(null)
  const isVN = lang === 'vi'

  const getPrice = (plan: Plan) => {
    const base = isVN ? plan.monthlyVND : plan.monthlyUSD
    if (base === 0) return isVN ? '0₫' : '$0'
    const price = yearly ? base * 0.8 : base
    if (isVN) return `${Math.round(price).toLocaleString('vi-VN')}₫`
    return `$${price.toFixed(2)}`
  }

  const handleUpgrade = async (plan: Plan) => {
    if (!plan.priceIdEnv || plan.tier === currentTier) return
    setLoadingTier(plan.tier)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: plan.priceIdEnv, yearly }),
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch {
    } finally {
      setLoadingTier(null)
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
            <span className="rounded-full bg-emerald-600/20 text-emerald-400 px-2 py-0.5 text-xs ml-1">-20%</span>
          </span>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PLANS.map(plan => {
            const isCurrent = plan.tier === currentTier
            const isHighlighted = plan.tier === 'premium'

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
                  {yearly && plan.monthlyUSD > 0 && (
                    <p className="text-xs text-slate-600 mt-0.5 line-through">
                      {isVN ? `${plan.monthlyVND.toLocaleString('vi-VN')}₫/tháng` : `$${plan.monthlyUSD.toFixed(2)}/month`}
                    </p>
                  )}
                </div>

                <ul className="flex-1 flex flex-col gap-2">
                  {plan.features.map(feat => (
                    <li key={feat.en} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-blue-400 mt-0.5 shrink-0">✓</span>
                      {isEn ? feat.en : feat.vi}
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
                    disabled={loadingTier !== null}
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-50 ${
                      isHighlighted
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-500 hover:to-cyan-500'
                        : 'border border-white/10 text-white hover:bg-white/[0.05]'
                    }`}>
                    {loadingTier === plan.tier
                      ? (isEn ? 'Processing...' : 'Đang xử lý...')
                      : (isEn ? `Upgrade to ${plan.name}` : `Nâng cấp ${plan.name}`)}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Feature comparison table */}
        <div className="mt-4">
          <h2 className="text-sm font-semibold text-slate-400 text-center mb-4">
            {isEn ? 'Feature Comparison' : 'So Sánh Tính Năng'}
          </h2>
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-4 text-xs font-semibold text-slate-400 border-b border-white/5">
              <div className="p-3">{isEn ? 'Feature' : 'Tính năng'}</div>
              <div className="p-3 text-center">🆓 Free</div>
              <div className="p-3 text-center">⭐ Premium</div>
              <div className="p-3 text-center">💎 Pro</div>
            </div>
            {COMPARISON.map((row, i) => (
              <div key={i} className={`grid grid-cols-4 text-xs border-b border-white/5 last:border-b-0 ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                <div className="p-3 text-slate-300">{isEn ? row.feature.en : row.feature.vi}</div>
                {(['free', 'premium', 'pro'] as const).map(tier => {
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
          <div>💳 {isEn ? 'Stripe powered' : 'Powered by Stripe'}</div>
        </div>
      </div>
    </div>
  )
}
