'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { MessageSquare, BarChart2, Music, Ear, User, CreditCard, LogOut, Globe, BookOpen, Moon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/use-user-store'
import { useLangStore } from '@/stores/use-lang-store'
import { t } from '@/lib/i18n'

const NAV_KEYS = [
  { href: '/chat', key: 'chat' as const, icon: MessageSquare },
  { href: '/dashboard', key: 'dashboard' as const, icon: BarChart2 },
  { href: '/therapy', key: 'therapy' as const, icon: Music },
  { href: '/journal', key: 'journal' as const, icon: BookOpen },
  { href: '/hearing-test', key: 'hearingTest' as const, icon: Ear },
  { href: '/sleep', key: 'sleepMode' as const, icon: Moon },
  { href: '/profile', key: 'profile' as const, icon: User },
  { href: '/pricing', key: 'pricing' as const, icon: CreditCard },
]

interface AppSidebarProps {
  onNavigate?: () => void
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, clearUser } = useUserStore()
  const { lang, toggle } = useLangStore()
  const d = t(lang)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    clearUser()
    router.push('/login')
  }

  return (
    <div className="flex h-full w-full flex-col bg-slate-900 border-r border-slate-800">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <span className="text-lg font-bold tracking-tight">Tinni 💙</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
        {NAV_KEYS.map(({ href, key, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-slate-800 text-blue-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <Icon size={18} />
              {d.sidebar[key]}
            </Link>
          )
        })}
      </nav>

      {/* Language toggle + User + logout */}
      <div className="px-3 py-4 border-t border-slate-800 flex flex-col gap-2">
        <button
          onClick={toggle}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors w-full text-left"
        >
          <Globe size={18} />
          {lang === 'vi' ? '🇬🇧 English' : '🇻🇳 Tiếng Việt'}
        </button>
        {user && (
          <p className="px-3 text-xs text-slate-500 truncate">{user.email}</p>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors w-full text-left"
        >
          <LogOut size={18} />
          {d.sidebar.logout}
        </button>
      </div>
    </div>
  )
}
