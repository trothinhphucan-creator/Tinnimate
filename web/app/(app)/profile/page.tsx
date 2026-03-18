'use client'

import { useState } from 'react'
import { User, Bell, Shield, LogOut, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/use-user-store'
import { useRouter } from 'next/navigation'

// User profile & settings page
export default function ProfilePage() {
  const { user, clearUser } = useUserStore()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    clearUser()
    router.push('/')
  }

  const tier = user?.subscription_tier ?? 'free'
  const tierLabel = { free: 'Miễn phí', premium: 'Premium', pro: 'Pro' }[tier]
  const tierColor = { free: 'text-slate-400', premium: 'text-blue-400', pro: 'text-purple-400' }[tier]

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-8">👤 Hồ sơ & Cài đặt</h1>

      {/* Profile card */}
      <div className="bg-slate-800 rounded-2xl p-6 mb-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl flex-shrink-0">
          {user?.name?.charAt(0).toUpperCase() ?? <User size={28} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white truncate">{user?.name ?? 'Người dùng'}</div>
          <div className="text-slate-400 text-sm truncate">{user?.email}</div>
          <div className={`text-sm font-medium mt-1 ${tierColor}`}>
            ✦ {tierLabel}
          </div>
        </div>
        <ChevronRight size={18} className="text-slate-500 flex-shrink-0" />
      </div>

      {/* Settings sections */}
      <div className="space-y-2">
        <SectionHeader label="Tài khoản" />

        <SettingRow icon={<Shield size={18} />} label="Gói đăng ký"
          value={tierLabel} onClick={() => router.push('/pricing')} />
        <SettingRow icon={<User size={18} />} label="Thông tin cá nhân"
          value="Chỉnh sửa" onClick={() => {}} />

        <SectionHeader label="Ứng dụng" />

        <SettingRow icon={<Bell size={18} />} label="Thông báo"
          value="Bật" onClick={() => {}} />

        <SectionHeader label="Khác" />

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 p-4 bg-slate-800 hover:bg-red-900/30 rounded-xl text-red-400 hover:text-red-300 transition-colors">
          <LogOut size={18} />
          <span className="font-medium">{loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
        </button>
      </div>

      {/* Tinnitus profile summary */}
      <div className="mt-6 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
        <div className="text-sm font-medium text-slate-300 mb-3">Hồ sơ ù tai</div>
        <p className="text-slate-500 text-sm">
          Chưa có hồ sơ. Chat với Tinni và hoàn thành chẩn đoán để tạo hồ sơ cá nhân.
        </p>
      </div>
    </div>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="pt-2 pb-1 px-1">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
    </div>
  )
}

function SettingRow({ icon, label, value, onClick }: {
  icon: React.ReactNode
  label: string
  value: string
  onClick: () => void
}) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 p-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-left">
      <span className="text-slate-400">{icon}</span>
      <span className="flex-1 text-white font-medium">{label}</span>
      <span className="text-slate-400 text-sm">{value}</span>
      <ChevronRight size={16} className="text-slate-600" />
    </button>
  )
}
