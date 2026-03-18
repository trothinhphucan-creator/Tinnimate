'use client'

import Link from 'next/link'
import { Lock, Sparkles } from 'lucide-react'
import { useUserStore } from '@/stores/use-user-store'
import { useLangStore } from '@/stores/use-lang-store'
import type { SubscriptionTier } from '@/types'

interface PremiumGateProps {
  /** Minimum tier required to access this feature */
  requiredTier?: SubscriptionTier
  /** Feature name to show in the upgrade prompt */
  feature?: string
  featureVi?: string
  /** Show content if user has access, otherwise show upgrade prompt */
  children: React.ReactNode
  /** Inline mode: shows a small lock overlay instead of replacing content */
  inline?: boolean
}

const TIER_RANK: Record<SubscriptionTier, number> = { free: 0, premium: 1, pro: 2 }

export function PremiumGate({
  requiredTier = 'premium',
  feature = 'this feature',
  featureVi = 'tính năng này',
  children,
  inline = false,
}: PremiumGateProps) {
  const { user } = useUserStore()
  const { lang } = useLangStore()
  const isEn = lang === 'en'
  const userTier = (user?.subscription_tier ?? 'free') as SubscriptionTier
  const hasAccess = TIER_RANK[userTier] >= TIER_RANK[requiredTier]

  if (hasAccess) return <>{children}</>

  if (inline) {
    return (
      <div className="relative">
        <div className="pointer-events-none opacity-30 blur-[2px] select-none">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Link href="/pricing"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-amber-500/20 hover:from-amber-500 hover:to-orange-500 transition-all">
            <Lock size={14} />
            {isEn ? `Upgrade to ${requiredTier}` : `Nâng cấp ${requiredTier}`}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
        <Lock size={28} className="text-amber-400" />
      </div>
      <h2 className="text-lg font-bold text-white mb-2">
        {isEn ? `${feature} is Premium` : `${featureVi} cần Premium`}
      </h2>
      <p className="text-xs text-slate-400 mb-6 max-w-xs">
        {isEn
          ? `Upgrade to ${requiredTier} to unlock ${feature.toLowerCase()} and all premium features.`
          : `Nâng cấp lên ${requiredTier} để mở khóa ${featureVi.toLowerCase()} và tất cả tính năng cao cấp.`}
      </p>
      <Link href="/pricing"
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-amber-500/20 hover:from-amber-500 hover:to-orange-500 transition-all">
        <Sparkles size={16} />
        {isEn ? 'View Plans & Upgrade' : 'Xem Gói & Nâng Cấp'}
      </Link>
      <div className="mt-4 grid grid-cols-3 gap-3 text-center max-w-sm">
        {[
          { emoji: '💬', label: isEn ? 'Unlimited chat' : 'Chat không giới hạn' },
          { emoji: '🎛️', label: isEn ? 'Sound Mixer' : 'Trộn âm thanh' },
          { emoji: '🧠', label: isEn ? 'Full CBT-i' : 'CBT-i đầy đủ' },
        ].map(f => (
          <div key={f.emoji} className="bg-white/[0.02] border border-white/5 rounded-lg p-2">
            <div className="text-base">{f.emoji}</div>
            <div className="text-[9px] text-slate-500">{f.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Hook to check if current user has access to a tier */
export function useTierAccess(requiredTier: SubscriptionTier = 'premium'): boolean {
  const { user } = useUserStore()
  const userTier = (user?.subscription_tier ?? 'free') as SubscriptionTier
  return TIER_RANK[userTier] >= TIER_RANK[requiredTier]
}
