import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Allow images from Supabase storage
  images: {
    remotePatterns: [{ hostname: '*.supabase.co' }],
  },
  // Turbopack config (Next.js 16 default)
  turbopack: {},
}

export default nextConfig
