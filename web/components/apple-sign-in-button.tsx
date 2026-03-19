'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AppleSignInButtonProps {
  redirectTo?: string
  label?: string
}

export default function AppleSignInButton({
  redirectTo = '/chat',
  label = 'Tiếp tục với Apple',
}: AppleSignInButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleAppleSignIn = async () => {
    setLoading(true)
    const supabase = createClient()

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
    const callbackUrl = `${siteUrl}/auth/callback?next=${encodeURIComponent(redirectTo)}`

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: callbackUrl,
      },
    })

    if (error) {
      console.error('Apple sign-in error:', error.message)
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleAppleSignIn}
      disabled={loading}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <span className="h-4 w-4 rounded-full border-2 border-slate-500 border-t-white animate-spin" />
      ) : (
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="currentColor">
          <path d="M13.71 5.04c-.08.06-1.55.89-1.55 2.73 0 2.13 1.87 2.88 1.93 2.9-.01.06-.3 1.03-1 2.04-.59.87-1.22 1.74-2.16 1.74s-1.19-.56-2.28-.56c-1.07 0-1.45.58-2.31.58s-1.46-.8-2.16-1.77C3.35 11.36 2.78 9.4 2.78 7.55c0-2.96 1.93-4.53 3.82-4.53.98 0 1.8.65 2.42.65.59 0 1.52-.69 2.63-.69.43 0 1.95.04 2.95 1.07h.01zM11.44.78c.45-.53.76-1.26.76-2 0-.1-.01-.21-.03-.3-.73.03-1.59.49-2.11 1.08-.41.47-.79 1.2-.79 1.94 0 .11.02.23.03.26.05.01.14.02.22.02.65 0 1.47-.44 1.92-1z" />
        </svg>
      )}
      {loading ? 'Đang chuyển hướng...' : label}
    </button>
  )
}
