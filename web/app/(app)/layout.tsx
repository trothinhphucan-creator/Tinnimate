'use client'

import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import { AppSidebar } from '@/components/app-sidebar'
import { TinniFloatingBubble } from '@/components/tinni-floating-bubble'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/use-user-store'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { setUser, clearUser } = useUserStore()

  // Hydrate user store from Supabase session
  useEffect(() => {
    const supabase = createClient()

    const loadUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { clearUser(); return }

      // Fetch full profile from users table
      const { data: profile } = await supabase
        .from('users')
        .select('id, email, name, subscription_tier, is_admin, created_at')
        .eq('id', authUser.id)
        .single()

      if (profile) {
        setUser(profile)
        // Clear guest state when logged in
        localStorage.removeItem('tinni_guest_count')
      } else {
        // Fallback: use auth user data
        setUser({
          id: authUser.id,
          email: authUser.email ?? '',
          subscription_tier: 'free',
          is_admin: false,
          created_at: authUser.created_at,
        })
        localStorage.removeItem('tinni_guest_count')
      }
    }

    loadUser()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadUser()
      } else if (event === 'SIGNED_OUT') {
        clearUser()
      }
    })

    return () => subscription.unsubscribe()
  }, [setUser, clearUser])

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-[15px]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[220px] shrink-0">
        <AppSidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[220px] transform transition-transform duration-200 md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <AppSidebar onNavigate={() => setSidebarOpen(false)} />
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="flex items-center h-14 px-4 border-b border-slate-800 md:hidden shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <span className="ml-3 font-semibold">TinniMate 💙</span>
        </header>

        <main className="flex-1 overflow-hidden">
          {children}
        </main>
        <TinniFloatingBubble />
      </div>
    </div>
  )
}
