'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useCapacitorAuth } from '@/hooks/useCapacitorAuth'

export default function LoginPage() {
  // Handle OAuth deep link callback (when app is re-opened via tinnimate:// scheme)
  useCapacitorAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        if (authError.message.includes('Email not confirmed')) {
          setError('Vui lòng xác nhận email trước. Kiểm tra hộp thư của bạn.')
        } else if (authError.message.includes('Invalid login credentials')) {
          setError('Email hoặc mật khẩu không đúng.')
        } else {
          setError(authError.message)
        }
        return
      }
      if (data.session) {
        window.location.href = '/chat'
      }
    } catch {
      setError('Đã xảy ra lỗi. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setError('')
    setOauthLoading(provider)
    try {
      const supabase = createClient()
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin

      // Use custom URL scheme for mobile deep link redirect
      // iOS will intercept tinnimate:// and open the app, where we handle the code exchange
      const isInCapacitor = typeof window !== 'undefined' &&
        (navigator.userAgent.includes('TinniMateApp') || !!(window as any).Capacitor)
      const redirectTo = isInCapacitor
        ? `tinnimate://auth/callback`
        : `${siteUrl}/auth/callback?next=/chat`

      // Open OAuth in in-app browser if inside Capacitor (shares cookies with WebView)
      if (isInCapacitor) {
        try {
          const { Browser } = await import('@capacitor/browser')
          const { data } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
              redirectTo,
              skipBrowserRedirect: true,
              ...(provider === 'google' && {
                queryParams: { access_type: 'offline', prompt: 'select_account' },
              }),
            },
          })
          if (data.url) {
            await Browser.open({ url: data.url, windowName: '_self' })
            setOauthLoading(null)
            return
          }
        } catch {
          // Fallback to normal flow if @capacitor/browser fails
        }
      }

      // Web flow
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          ...(provider === 'google' && {
            queryParams: { access_type: 'offline', prompt: 'consent' },
          }),
        },
      })
      if (error) {
        setError(`Đăng nhập với ${provider === 'google' ? 'Google' : 'Apple'} thất bại.`)
        setOauthLoading(null)
      }
    } catch {
      setError('Đã xảy ra lỗi. Vui lòng thử lại.')
      setOauthLoading(null)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#020617] px-4 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/8 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/8 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-blue-500/4 blur-[80px] pointer-events-none" />

      <div className="relative w-full max-w-[400px]">
        {/* Glow behind card */}
        <div className="absolute -inset-px bg-gradient-to-br from-blue-500/20 via-violet-500/10 to-transparent blur-2xl rounded-3xl" />

        <div className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/8 rounded-2xl overflow-hidden shadow-2xl">
          {/* Top gradient bar */}
          <div className="h-[2px] bg-gradient-to-r from-blue-500 via-violet-500 to-blue-500" />

          <div className="p-8">
            {/* Logo + Header */}
            <div className="text-center mb-8">
              <div className="relative w-14 h-14 mx-auto mb-4">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/30" />
                <div className="relative flex items-center justify-center w-full h-full">
                  <Image
                    src="/logo.png"
                    alt="TinniMate"
                    width={40}
                    height={40}
                    className="rounded-xl object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Chào mừng trở lại</h1>
              <p className="text-slate-400 text-sm mt-1.5">Đăng nhập vào TinniMate</p>
            </div>

            {/* OAuth Buttons */}
            <div className="space-y-2.5 mb-6">
              {/* Google */}
              <button
                onClick={() => handleOAuth('google')}
                disabled={!!oauthLoading || loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {oauthLoading === 'google' ? (
                  <span className="h-4 w-4 rounded-full border-2 border-slate-500 border-t-white animate-spin" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                    <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
                    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
                  </svg>
                )}
                <span>{oauthLoading === 'google' ? 'Đang chuyển hướng...' : 'Tiếp tục với Google'}</span>
              </button>

              {/* Apple */}
              <button
                onClick={() => handleOAuth('apple')}
                disabled={!!oauthLoading || loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {oauthLoading === 'apple' ? (
                  <span className="h-4 w-4 rounded-full border-2 border-slate-500 border-t-white animate-spin" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516.024.034 1.52.087 2.475-1.258.955-1.345.762-2.391.728-2.43zm3.314 11.733c-.048-.048-2.11-1.407-2.084-3.43.024-2.023 1.38-2.905 1.427-2.953.047-.048-1.225-1.627-2.475-1.594-1.25.033-1.703.63-2.298.63-.594 0-1.13-.63-2.225-.63-1.095 0-2.274 1.12-2.274 3.432 0 2.311 1.606 5.83 2.38 6.69.774.86 1.5.9 2.131.9.63 0 1.19-.605 2.036-.605.845 0 1.24.545 2.131.545.89 0 1.62-1.056 2.083-1.87.463-.814.71-1.822.71-1.822s-1.487-.582-1.542-2.313z" />
                  </svg>
                )}
                <span>{oauthLoading === 'apple' ? 'Đang chuyển hướng...' : 'Tiếp tục với Apple'}</span>
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-xs text-slate-600 font-medium">hoặc dùng email</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  required
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/40 focus:bg-white/[0.05] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Mật khẩu</label>
                  <Link href="/forgot-password" className="text-xs text-slate-500 hover:text-blue-400 transition-colors">
                    Quên mật khẩu?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  required
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/40 focus:bg-white/[0.05] transition-all"
                />
              </div>

              {(error || info) && (
                <p className={`rounded-xl px-4 py-3 text-sm ${
                  error
                    ? 'bg-red-500/8 border border-red-500/20 text-red-400'
                    : 'bg-blue-500/8 border border-blue-500/20 text-blue-400'
                }`}>
                  {error || info}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !!oauthLoading}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Đang đăng nhập...
                  </span>
                ) : 'Đăng nhập'}
              </button>
            </form>

            {/* Footer */}
            <p className="text-center text-sm text-slate-500 mt-6">
              Chưa có tài khoản?{' '}
              <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Đăng ký miễn phí
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom text */}
        <p className="text-center text-xs text-slate-700 mt-5">
          Bằng cách đăng nhập, bạn đồng ý với{' '}
          <Link href="/terms" className="text-slate-600 hover:text-slate-400 transition-colors">Điều khoản</Link>
          {' '}và{' '}
          <Link href="/privacy" className="text-slate-600 hover:text-slate-400 transition-colors">Chính sách bảo mật</Link>
        </p>
      </div>
    </div>
  )
}
