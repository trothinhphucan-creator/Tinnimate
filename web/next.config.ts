import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Allow images from Supabase storage
  images: {
    remotePatterns: [{ hostname: '*.supabase.co' }],
  },
  // Turbopack config (Next.js 16 default)
  turbopack: {},
  // Security headers + HTTPS enforcement
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
