'use client'

import { useState } from 'react'
import { useUserStore } from '@/stores/use-user-store'
import { SubscriptionTier } from '@/types'

interface Plan {
  tier: SubscriptionTier
  name: string
  monthlyPrice: number
  features: string[]
  priceIdEnv: string
}

const PLANS: Plan[] = [
  {
    tier: 'free',
    name: 'Free',
    monthlyPrice: 0,
    features: [
      '5 tin nhắn/ngày',
      'Âm thanh cơ bản',
      'Bài kiểm tra thính lực',
      '1 bộ câu hỏi/tháng',
    ],
    priceIdEnv: '',
  },
  {
    tier: 'premium',
    name: 'Premium',
    monthlyPrice: 9.99,
    features: [
      'Chat không giới hạn',
      'Toàn bộ âm thanh trị liệu',
      'Kiểm tra thính lực không giới hạn',
      'Tất cả bộ câu hỏi (THI, PHQ-9, GAD-7)',
      'Lịch sử & biểu đồ tiến triển',
    ],
    priceIdEnv: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID ?? '',
  },
  {
    tier: 'pro',
    name: 'Pro',
    monthlyPrice: 19.99,
    features: [
      'Tất cả tính năng Premium',
      'Ưu tiên phản hồi AI',
      'Xuất báo cáo PDF',
      'Hỗ trợ ưu tiên 24/7',
      'API access',
    ],
    priceIdEnv: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? '',
  },
]

export default function PricingPage() {
  const { user } = useUserStore()
  const currentTier = user?.subscription_tier ?? 'free'
  const [yearly, setYearly] = useState(false)
  const [loadingTier, setLoadingTier] = useState<SubscriptionTier | null>(null)

  const getPrice = (monthly: number) => {
    if (monthly === 0) return '$0'
    const price = yearly ? (monthly * 12 * 0.8) / 12 : monthly
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
      // silently fail — user stays on page
    } finally {
      setLoadingTier(null)
    }
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-8">
      <div className="mx-auto max-w-4xl flex flex-col gap-8">
        {/* Header */}
        <div className="text-center flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Bảng giá</h1>
          <p className="text-slate-400 text-sm">Chọn gói phù hợp với bạn</p>
        </div>

        {/* Yearly toggle */}
        <div className="flex items-center justify-center gap-3 text-sm">
          <span className={!yearly ? 'text-white font-medium' : 'text-slate-400'}>Hàng tháng</span>
          <button
            onClick={() => setYearly((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              yearly ? 'bg-blue-600' : 'bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                yearly ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={yearly ? 'text-white font-medium' : 'text-slate-400'}>
            Hàng năm{' '}
            <span className="rounded-full bg-blue-600/20 text-blue-400 px-2 py-0.5 text-xs ml-1">
              -20%
            </span>
          </span>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrentPlan = plan.tier === currentTier
            const isHighlighted = plan.tier === 'premium'

            return (
              <div
                key={plan.tier}
                className={`rounded-xl border p-6 flex flex-col gap-5 ${
                  isHighlighted
                    ? 'border-blue-500 bg-blue-600/10 ring-1 ring-blue-500'
                    : 'border-slate-700 bg-slate-900'
                }`}
              >
                {isHighlighted && (
                  <span className="self-start rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">
                    Phổ biến nhất
                  </span>
                )}

                <div>
                  <p className="font-semibold text-lg">{plan.name}</p>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{getPrice(plan.monthlyPrice)}</span>
                    <span className="text-sm text-slate-400">/tháng</span>
                  </div>
                  {yearly && plan.monthlyPrice > 0 && (
                    <p className="text-xs text-slate-500 mt-0.5 line-through">
                      ${plan.monthlyPrice.toFixed(2)}/tháng
                    </p>
                  )}
                </div>

                <ul className="flex-1 flex flex-col gap-2">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-blue-400 mt-0.5 shrink-0">✓</span>
                      {feat}
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <div className="rounded-xl border border-slate-700 px-4 py-2.5 text-center text-sm font-medium text-slate-400">
                    Gói hiện tại
                  </div>
                ) : plan.tier === 'free' ? (
                  <div className="rounded-xl border border-slate-700 px-4 py-2.5 text-center text-sm text-slate-500">
                    Gói cơ bản
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={loadingTier !== null}
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isHighlighted
                        ? 'bg-blue-600 text-white hover:bg-blue-500'
                        : 'border border-slate-700 text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {loadingTier === plan.tier ? 'Đang xử lý...' : `Nâng cấp ${plan.name}`}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
