import type { Metadata } from 'next'
import { Manrope, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-manrope',
  weight: ['400', '500', '600', '700', '800'],
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-plus-jakarta',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'TinniMate — Trợ thủ giúp đẩy lùi ù tai',
  description: 'Ứng dụng hỗ trợ người bị ù tai với chatbot AI, liệu pháp âm thanh, và theo dõi tiến triển.',
  manifest: '/manifest.json',
  themeColor: '#0b1515',
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
      <body className={`${manrope.variable} ${plusJakarta.variable} font-sans antialiased bg-[#151120] text-[#E7DFF5]`}>
        {children}
        <CookieConsentWrapper />
      </body>
    </html>
  )
}
