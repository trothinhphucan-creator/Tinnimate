import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

// OAuth callback — Supabase redirects here after Google login
// Exchanges the one-time code for a user session, then redirects to the app
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/chat'

  // When running behind Nginx/Cloudflare, request.url origin is localhost:3000.
  // Prefer the explicit site URL env var, then the forwarded host header.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    ?? (() => {
      const proto = request.headers.get('x-forwarded-proto') ?? 'https'
      const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
      return host ? `${proto}://${host}` : new URL(request.url).origin
    })()

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${siteUrl}${next}`)
    }
  }

  // Code missing or exchange failed — send back to login with error hint
  return NextResponse.redirect(`${siteUrl}/login?error=auth_callback`)
}
