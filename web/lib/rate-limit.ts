/**
 * rate-limit.ts
 * Multi-instance safe rate limiter.
 * - Production: Upstash Redis (requires UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
 * - Dev / fallback: in-memory Map with TTL (single-process only)
 */

// ── In-memory fallback ─────────────────────────────────────────────────────
interface MemEntry { count: number; resetAt: number }
const memStore = new Map<string, MemEntry>()

function memCheck(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now()
  let entry = memStore.get(key)

  if (!entry || entry.resetAt < now) {
    entry = { count: 1, resetAt: now + windowMs }
    memStore.set(key, entry)
    return { allowed: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) return { allowed: false, remaining: 0 }
  entry.count++
  return { allowed: true, remaining: limit - entry.count }
}

// ── Upstash Redis (lazy init) ──────────────────────────────────────────────
let _redis: import('@upstash/redis').Redis | null = null
let _limiter: import('@upstash/ratelimit').Ratelimit | null = null

function getUpstashLimiter() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null

  if (!_limiter) {
    // Dynamic import to avoid build errors when env vars are missing
    const { Redis } = require('@upstash/redis')
    const { Ratelimit } = require('@upstash/ratelimit')
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    _limiter = new Ratelimit({
      redis: _redis,
      limiter: Ratelimit.slidingWindow(
        parseInt(process.env.GUEST_RATE_LIMIT ?? '2'),
        '24 h'
      ),
      prefix: 'tinnimate:guest',
    })
  }
  return _limiter
}

// ── Public API ─────────────────────────────────────────────────────────────
const GUEST_LIMIT = parseInt(process.env.GUEST_RATE_LIMIT ?? '2')
const WINDOW_MS   = 24 * 60 * 60 * 1000 // 24h

export async function checkGuestRateLimit(
  ip: string
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const limiter = getUpstashLimiter()
    if (limiter) {
      const { success, remaining } = await limiter.limit(ip)
      return { allowed: success, remaining }
    }
  } catch (err) {
    // Redis unreachable — fallback to memory (never hard-fail)
    console.warn('[rate-limit] Upstash error, using in-memory fallback:', err)
  }

  return memCheck(`guest:${ip}`, GUEST_LIMIT, WINDOW_MS)
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}
