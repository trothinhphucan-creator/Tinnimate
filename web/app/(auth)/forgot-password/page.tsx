'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
      })
      if (authError) { setError(authError.message); return }
      setSuccess(true)
    } catch {
      setError('Đã xảy ra lỗi. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-8 flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">TinniMate 💙</h1>
          <p className="mt-1 text-slate-400 text-sm">Đặt lại mật khẩu của bạn</p>
        </div>

        {success ? (
          <div className="flex flex-col gap-4">
            <p className="rounded-lg bg-green-500/10 border border-green-500/30 px-4 py-2.5 text-sm text-green-400">
              Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.
            </p>
            <Link
              href="/login"
              className="text-center rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              Quay lại đăng nhập
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-slate-300">Email</label>
              <input
                id="email" type="email" value={email} required
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2.5 text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit" disabled={loading}
              className="rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Đang gửi...' : 'Gửi email đặt lại mật khẩu'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-slate-400">
          Nhớ mật khẩu?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">Đăng nhập</Link>
        </p>
      </div>
    </div>
  )
}
