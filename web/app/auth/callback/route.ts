import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

// OAuth callback — Supabase redirects here after Google login
// Exchanges the one-time code for a user session, then redirects to the app
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/chat'

  // Supabase may redirect with error params (e.g. user denied access)
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // When running behind Nginx/Cloudflare, request.url origin is localhost:3000.
  // Prefer the explicit site URL env var, then the forwarded host header.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    ?? (() => {
      const proto = request.headers.get('x-forwarded-proto') ?? 'https'
      const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
      return host ? `${proto}://${host}` : new URL(request.url).origin
    })()

  // If Supabase returned an error (user cancelled, provider error, etc.)
  if (errorParam) {
    console.error('[auth/callback] OAuth error:', errorParam, errorDescription)
    return NextResponse.redirect(
      `${siteUrl}/login?error=${encodeURIComponent(errorParam)}&message=${encodeURIComponent(errorDescription || '')}`
    )
  }

  if (code) {
    // Debug: check if PKCE code-verifier cookie is present
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    const codeVerifierCookie = allCookies.find(c => c.name.includes('code-verifier'))
    console.log('[auth/callback] Cookies count:', allCookies.length,
      'Code verifier present:', !!codeVerifierCookie,
      'Cookie names:', allCookies.map(c => c.name).join(', '))

    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${siteUrl}${next}`)
    }
    console.error('[auth/callback] Code exchange failed:', error.message, error.status)
  } else {
    console.error('[auth/callback] No code param received. URL:', request.url)
  }

  // Code missing or exchange failed — send back to login with error hint
  return NextResponse.redirect(`${siteUrl}/login?error=auth_callback`)
}

