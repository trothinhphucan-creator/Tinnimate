'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="vi" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-3xl">
            😔
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Có lỗi xảy ra</h1>
            <p className="text-slate-400 text-sm mt-2">
              Tinni gặp sự cố tạm thời. Bạn có thể thử lại hoặc quay về trang chủ.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="px-5 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors"
            >
              Thử lại
            </button>
            <Link
              href="/"
              className="px-5 py-2.5 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-colors"
            >
              Về trang chủ
            </Link>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-slate-600 font-mono bg-white/5 p-3 rounded-lg text-left break-all">
              {error.message}
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
