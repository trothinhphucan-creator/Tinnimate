'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        if (authError.message.includes('Email not confirmed')) {
          setError('Vui lòng xác nhận email trước khi đăng nhập. Kiểm tra hộp thư của bạn.')
        } else if (authError.message.includes('Invalid login credentials')) {
          setError('Email hoặc mật khẩu không đúng. Kiểm tra lại hoặc đăng ký tài khoản mới.')
        } else {
          setError(authError.message)
        }
        return
      }
      if (data.session) {
        // Navigate to chat after successful login
        window.location.href = '/chat'
      }
    } catch {
      setError('Đã xảy ra lỗi. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#020617] px-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[100px]" />

      <div className="relative w-full max-w-md">
        <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/10 via-violet-500/5 to-transparent blur-2xl rounded-3xl" />

        <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4 shadow-lg shadow-blue-500/20">T</div>
            <h1 className="text-2xl font-bold text-white">Chào mừng trở lại</h1>
            <p className="mt-1 text-slate-400 text-sm">Đăng nhập vào TinniMate</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-slate-300">Email</label>
              <input
                id="email" type="email" value={email} required
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 focus:bg-white/[0.05] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-slate-300">Mật khẩu</label>
                <Link href="/forgot-password" className="text-xs text-slate-500 hover:text-blue-400 transition-colors">
                  Quên mật khẩu?
                </Link>
              </div>
              <input
                id="password" type="password" value={password} required
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 focus:bg-white/[0.05] transition-all"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit" disabled={loading}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 px-4 py-3 font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-blue-500/20 mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Đang đăng nhập...
                </span>
              ) : 'Đăng nhập'}
            </button>
          </form>

          {/* OAuth options — only on web (not mobile app) */}
          <div id="oauth-section" className="hidden">
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-xs text-slate-500">hoặc</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            <div className="space-y-2.5 text-xs text-center text-slate-600">
              Đăng nhập bằng Google/Apple có sẵn trên web
            </div>
          </div>

          <p className="text-center text-sm text-slate-400 mt-6">
            Chưa có tài khoản?{' '}
            <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Đăng ký</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
