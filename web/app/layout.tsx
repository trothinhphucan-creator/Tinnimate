import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'TinniMate — Trợ thủ giúp đẩy lùi ù tai',
  description: 'Ứng dụng hỗ trợ người bị ù tai với chatbot AI, liệu pháp âm thanh, và theo dõi tiến triển.',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TinniMate',
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
}

import { CookieConsentWrapper } from '@/components/cookie-consent-wrapper'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-slate-950 text-slate-100`}>
        {children}
        <CookieConsentWrapper />
      </body>
    </html>
  )
}
