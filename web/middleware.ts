import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Simple in-memory rate limiter (resets on server restart)
// Upgrade to Redis/Upstash for multi-instance production
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(key)
  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (record.count >= limit) return false
  record.count++
  return true
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  // Auth rate limit: 10 attempts per 15 minutes per IP
  if (['/login', '/signup', '/forgot-password'].includes(pathname)) {
    // Skip rate limit if already showing an error (prevents redirect loop:
    // /login → rate limit → /login?error=too_many_attempts → /login again → loop)
    const hasError = request.nextUrl.searchParams.has('error')
    if (!hasError && !checkRateLimit(`auth:${ip}`, 10, 15 * 60 * 1000)) {
      return NextResponse.redirect(
        new URL('/login?error=too_many_attempts', request.url)
      )
    }
  }

  // API chat rate limit: 30 requests per minute per IP
  if (pathname.startsWith('/api/chat')) {
    if (!checkRateLimit(`chat:${ip}`, 30, 60 * 1000)) {
      return new NextResponse(
        JSON.stringify({ error: 'Quá nhiều yêu cầu. Vui lòng đợi.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  // Skip auth session checks for public auth routes to prevent redirect loops
  if (pathname.startsWith('/auth/') || pathname === '/login' || pathname === '/signup') {
    return NextResponse.next({ request })
  }

  return updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|icons|sounds|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|woff2?)$).*)',
  ],
}
