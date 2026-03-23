import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Refreshes Supabase session in middleware
export async function updateSession(request: NextRequest) {
  // Skip auth checks when Supabase is not configured (local dev without .env.local)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            // Ensure cookies persist with proper options
            supabaseResponse.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 60 * 60 * 24 * 7, // 7 days
            })
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect /admin routes — require is_admin flag
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user || user.app_metadata?.is_admin !== true) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
  }

  // Protect /app routes — require auth (except /chat which allows guest mode)
  if (request.nextUrl.pathname.startsWith('/(app)') ||
      ['/dashboard', '/therapy', '/hearing-test', '/profile', '/pricing'].includes(request.nextUrl.pathname)) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
