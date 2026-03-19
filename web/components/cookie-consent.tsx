'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLangStore } from '@/stores/use-lang-store'
import { Cookie, X, Shield } from 'lucide-react'

const CONSENT_KEY = 'tinnimate_cookie_consent'

type ConsentState = {
  essential: boolean    // always true
  analytics: boolean
  functional: boolean
  timestamp: string
}

function getConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(CONSENT_KEY)
  if (!stored) return null
  try { return JSON.parse(stored) } catch { return null }
}

function saveConsent(consent: ConsentState) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(consent))
}

export function CookieConsent() {
  const { lang } = useLangStore()
  const isEn = lang === 'en'
  const [visible, setVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [functional, setFunctional] = useState(true)

  useEffect(() => {
    const consent = getConsent()
    if (!consent) {
      // Show banner after 1.5s delay for better UX
      const t = setTimeout(() => setVisible(true), 1500)
      return () => clearTimeout(t)
    }
  }, [])

  const handleAcceptAll = () => {
    const consent: ConsentState = {
      essential: true,
      analytics: true,
      functional: true,
      timestamp: new Date().toISOString(),
    }
    saveConsent(consent)
    setVisible(false)
  }

  const handleAcceptSelected = () => {
    const consent: ConsentState = {
      essential: true,
      analytics,
      functional,
      timestamp: new Date().toISOString(),
    }
    saveConsent(consent)
    setVisible(false)
  }

  const handleRejectAll = () => {
    const consent: ConsentState = {
      essential: true,
      analytics: false,
      functional: false,
      timestamp: new Date().toISOString(),
    }
    saveConsent(consent)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-[60] p-4 sm:p-6 animate-in slide-in-from-bottom duration-500">
      <div className="mx-auto max-w-2xl bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
        {/* Header */}
        <div className="p-5 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Cookie size={20} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {isEn ? 'Cookie Preferences' : 'Tùy chọn Cookie'}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  {isEn
                    ? 'We use cookies to improve your experience. You can customize your preferences.'
                    : 'Chúng tôi sử dụng cookie để cải thiện trải nghiệm. Bạn có thể tùy chỉnh.'}
                </p>
              </div>
            </div>
            <button onClick={handleRejectAll} className="p-1 hover:bg-white/5 rounded-lg transition-colors">
              <X size={16} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Details toggle */}
        {showDetails && (
          <div className="px-5 pb-3 space-y-2.5">
            {/* Essential — always on */}
            <div className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/5 rounded-xl">
              <div className="flex items-center gap-2.5">
                <Shield size={14} className="text-emerald-400" />
                <div>
                  <p className="text-xs font-medium text-white">{isEn ? 'Essential' : 'Thiết yếu'}</p>
                  <p className="text-[10px] text-slate-500">{isEn ? 'Authentication, security, basic functionality' : 'Xác thực, bảo mật, chức năng cơ bản'}</p>
                </div>
              </div>
              <div className="px-2 py-0.5 rounded text-[9px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {isEn ? 'Required' : 'Bắt buộc'}
              </div>
            </div>

            {/* Functional */}
            <label className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/5 rounded-xl cursor-pointer hover:bg-white/[0.05] transition-colors">
              <div className="flex items-center gap-2.5">
                <span className="text-sm">⚙️</span>
                <div>
                  <p className="text-xs font-medium text-white">{isEn ? 'Functional' : 'Chức năng'}</p>
                  <p className="text-[10px] text-slate-500">{isEn ? 'Language preference, theme, sound settings' : 'Ngôn ngữ, giao diện, cài đặt âm thanh'}</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={functional}
                onChange={e => setFunctional(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/30"
              />
            </label>

            {/* Analytics */}
            <label className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/5 rounded-xl cursor-pointer hover:bg-white/[0.05] transition-colors">
              <div className="flex items-center gap-2.5">
                <span className="text-sm">📊</span>
                <div>
                  <p className="text-xs font-medium text-white">{isEn ? 'Analytics' : 'Phân tích'}</p>
                  <p className="text-[10px] text-slate-500">{isEn ? 'Anonymous usage data to improve the app' : 'Dữ liệu ẩn danh để cải thiện ứng dụng'}</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={analytics}
                onChange={e => setAnalytics(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/30"
              />
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 pt-2 flex items-center gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors mr-auto underline underline-offset-2"
          >
            {showDetails
              ? (isEn ? 'Hide details' : 'Ẩn chi tiết')
              : (isEn ? 'Customize' : 'Tùy chỉnh')}
          </button>

          {showDetails && (
            <button
              onClick={handleAcceptSelected}
              className="px-4 py-2 text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-colors"
            >
              {isEn ? 'Save Preferences' : 'Lưu tùy chọn'}
            </button>
          )}

          <button
            onClick={handleAcceptAll}
            className="px-5 py-2 text-xs font-medium bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-lg transition-all shadow-lg shadow-blue-500/20"
          >
            {isEn ? 'Accept All' : 'Chấp nhận tất cả'}
          </button>
        </div>

        {/* Links */}
        <div className="px-5 pb-3 flex gap-4 text-[10px] text-slate-600">
          <Link href="/privacy" className="hover:text-blue-400 transition-colors">
            {isEn ? 'Privacy Policy' : 'Chính sách bảo mật'}
          </Link>
          <Link href="/terms" className="hover:text-blue-400 transition-colors">
            {isEn ? 'Terms of Service' : 'Điều khoản sử dụng'}
          </Link>
        </div>
      </div>
    </div>
  )
}
