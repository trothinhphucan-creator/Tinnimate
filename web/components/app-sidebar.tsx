'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home, Music, MessageSquare, Target, Wind,
  User, CreditCard, LogOut, Globe, Moon, Layers, Brain, BarChart2, Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/use-user-store'
import { useLangStore } from '@/stores/use-lang-store'
import { t } from '@/lib/i18n'

const NAV = [
  { href: '/dashboard',     label: 'Trang chủ',   icon: Home },
  { href: '/therapy',       label: 'Âm thanh',    icon: Music },
  { href: '/chat',          label: 'Chat Tinni',  icon: MessageSquare },
  { href: '/zen',           label: 'Zentones ✨', icon: Sparkles },
  { href: '/mixer',         label: 'Mixer',       icon: Layers },
  { href: '/notch-therapy', label: 'Notch',       icon: Target },
  { href: '/breathing-web', label: 'Thở',         icon: Wind },
  { href: '/dashboard#stats', label: 'Báo cáo',  icon: BarChart2 },
  { href: '/cbti',          label: 'CBT-i',       icon: Brain },
  { href: '/sleep',         label: 'Ngủ',         icon: Moon },
  { href: '/profile',       label: 'Hồ sơ',       icon: User },
  { href: '/pricing',       label: 'Bảng giá',    icon: CreditCard },
]

interface AppSidebarProps {
  onNavigate?: () => void
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, clearUser } = useUserStore()
  const { lang, toggle } = useLangStore()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    clearUser()
    router.push('/login')
  }

  const tierLabel = (user as any)?.subscription_tier ?? 'free'
  const isPro = tierLabel !== 'free'

  return (
    <div className="flex h-full w-full flex-col bg-[#061010] border-r border-[#3f4848]/30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#3f4848]/30">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          {/* Aurora Orb mini */}
          <div className="relative w-8 h-8 flex-shrink-0">
            <div className="aurora-orb-glow absolute inset-0 rounded-full bg-[#94d3c1]/50 blur-md" />
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20 shadow-lg shadow-[#94d3c1]/30">
              <div className="aurora-orb-blob absolute inset-[-30%] rounded-full"
                style={{ background: 'conic-gradient(from 0deg, #024e41, #94d3c1, #ffb954, #9ad2c0, #024e41)' }} />
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-full" />
            </div>
          </div>
          <span className="font-bold text-sm text-white tracking-wide">TinniMate</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1 scrollbar-hide">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href.split('#')[0] + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? 'bg-[#024e41]/40 text-[#94d3c1] border border-[#94d3c1]/20'
                  : 'text-[#bfc8c8] hover:bg-white/[0.04] hover:text-[#dae5e4]'
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer: tier badge + lang + logout */}
      <div className="px-3 py-4 border-t border-[#3f4848]/30 flex flex-col gap-2">
        {/* Tier badge */}
        <div className={`mx-2 mb-1 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          isPro
            ? 'bg-[#ffb954]/10 border border-[#ffb954]/20 text-[#ffb954]'
            : 'bg-[#94d3c1]/10 border border-[#94d3c1]/20 text-[#94d3c1]'
        }`}>
          {isPro ? '⭐' : '🆓'}
          <span>{isPro ? 'Premium' : 'Free'}</span>
          {!isPro && (
            <Link href="/pricing" className="ml-auto text-[#94d3c1] hover:text-[#afefdd] text-[10px] font-bold">
              Nâng cấp →
            </Link>
          )}
        </div>

        <button
          onClick={toggle}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[#bfc8c8] hover:bg-white/[0.04] hover:text-[#dae5e4] transition-all duration-300 w-full text-left"
        >
          <Globe size={17} />
          {lang === 'vi' ? '🇬🇧 English' : '🇻🇳 Tiếng Việt'}
        </button>
        {user && (
          <p className="px-3 text-xs text-[#899392] truncate">{user.email}</p>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#bfc8c8] hover:bg-white/[0.04] hover:text-[#ffb4ab] transition-all duration-300 w-full text-left"
        >
          <LogOut size={17} />
          Đăng xuất
        </button>
      </div>
    </div>
  )
}
