'use client'

import Link from 'next/link'
import { LogIn, Eye } from 'lucide-react'
import { useUserStore } from '@/stores/use-user-store'
import { useLangStore } from '@/stores/use-lang-store'
import { useEffect, useState } from 'react'

interface AuthGateProps {
  /** Feature name in English */
  feature?: string
  /** Feature name in Vietnamese */
  featureVi?: string
  /** Emoji for the feature */
  emoji?: string
  /** The actual page content */
  children: React.ReactNode
  /** Preview items to show guests */
  previewItems?: { emoji: string; label: string }[]
}

/**
 * AuthGate — Wraps tool pages to require login.
 * 
 * Guests see a blurred preview of the content + a login prompt.
 * Logged-in users see the full content.
 */
export function AuthGate({
  feature = 'this feature',
  featureVi = 'tính năng này',
  emoji = '🔒',
  children,
  previewItems,
}: AuthGateProps) {
  const { user } = useUserStore()
  const { lang } = useLangStore()
  const isEn = lang === 'en'
  const [loaded, setLoaded] = useState(false)

  // Wait for user store to hydrate
  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (user) setLoaded(true)
  }, [user])

  // Still loading — show nothing to prevent flash
  if (!loaded) return null

  // Logged in — show full content
  if (user) return <>{children}</>

  // Guest — show preview + login CTA
  return (
    <div className="relative h-full overflow-hidden">
      {/* Blurred preview of actual content */}
      <div className="pointer-events-none select-none opacity-20 blur-[3px] scale-[0.98]">
        {children}
      </div>

      {/* Overlay with login prompt */}
      <div className="absolute inset-0 z-40 flex items-center justify-center bg-gradient-to-b from-slate-950/60 via-slate-950/90 to-slate-950/95 p-6">
        <div className="max-w-sm w-full text-center">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/15 to-violet-500/15 border border-blue-500/25 flex items-center justify-center text-4xl mx-auto mb-5 shadow-lg shadow-blue-500/5">
            {emoji}
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-white mb-2">
            {isEn ? `Preview: ${feature}` : `Xem trước: ${featureVi}`}
          </h2>

          {/* Description */}
          <p className="text-sm text-slate-400 mb-2 leading-relaxed">
            {isEn
              ? 'Sign up or log in to use this tool and all TinniMate features for free!'
              : 'Đăng ký hoặc đăng nhập để sử dụng công cụ này và tất cả tính năng TinniMate miễn phí!'}
          </p>

          {/* Preview badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-300 mb-6">
            <Eye size={12} />
            {isEn ? 'Preview mode — read only' : 'Chế độ xem trước — chỉ đọc'}
          </div>

          {/* Feature preview items */}
          {previewItems && previewItems.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-6">
              {previewItems.map((item) => (
                <div key={item.label} className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5">
                  <div className="text-lg mb-0.5">{item.emoji}</div>
                  <div className="text-[9px] text-slate-500 leading-tight">{item.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* CTA buttons */}
          <Link href="/signup"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-blue-500/25 mb-3">
            <LogIn size={16} />
            {isEn ? 'Sign Up Free' : 'Đăng ký miễn phí'}
          </Link>

          <Link href="/login"
            className="block text-xs text-slate-500 hover:text-slate-300 transition-colors">
            {isEn ? 'Already have an account? Log in' : 'Đã có tài khoản? Đăng nhập'}
          </Link>
        </div>
      </div>
    </div>
  )
}
