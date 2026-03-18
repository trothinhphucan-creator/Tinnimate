'use client'

import Link from 'next/link'
import { MessageSquare, Music, Ear, Headphones, ClipboardList, Flame, Heart, TrendingUp, Zap } from 'lucide-react'
import { useLangStore } from '@/stores/use-lang-store'
import { t } from '@/lib/i18n'

interface DashboardClientProps {
  data: {
    name: string
    tier: string
    lastCheckin: { mood_score: number; sleep_score: number; tinnitus_loudness: number; created_at: string } | null
    assessments: { quiz_type: string; total_score: number; created_at: string }[]
    therapyCount: number
  }
}

function GradientBar({ label, value, max = 10, gradient }: { label: string; value: number; max?: number; gradient: string }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-medium">{value}/{max}</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function DashboardClient({ data }: DashboardClientProps) {
  const { lang } = useLangStore()
  const d = t(lang)

  const { name, lastCheckin, assessments, therapyCount } = data

  const stats = [
    { icon: Headphones, label: d.dashboard.therapySessions, value: therapyCount.toString(), gradient: 'from-blue-500 to-cyan-400', glow: 'shadow-blue-500/20' },
    { icon: ClipboardList, label: d.dashboard.recentAssessments, value: assessments.length.toString(), gradient: 'from-violet-500 to-purple-400', glow: 'shadow-violet-500/20' },
    { icon: Flame, label: d.dashboard.streak, value: `0 ${d.dashboard.days}`, gradient: 'from-orange-500 to-amber-400', glow: 'shadow-orange-500/20' },
    { icon: Heart, label: d.dashboard.mood, value: lastCheckin ? `${lastCheckin.mood_score}/10` : '--', gradient: 'from-pink-500 to-rose-400', glow: 'shadow-pink-500/20' },
  ]

  const quickActions = [
    { icon: MessageSquare, label: d.dashboard.chatWithTinni, desc: d.dashboard.chatDesc, href: '/chat', gradient: 'from-blue-500 to-cyan-400' },
    { icon: Music, label: d.dashboard.soundTherapy, desc: d.dashboard.soundDesc, href: '/therapy', gradient: 'from-violet-500 to-purple-400' },
    { icon: Ear, label: d.dashboard.hearingTest, desc: d.dashboard.hearingDesc, href: '/hearing-test', gradient: 'from-emerald-500 to-teal-400' },
  ]

  const locale = lang === 'vi' ? 'vi-VN' : 'en-US'

  return (
    <div className="h-full overflow-y-auto px-6 py-8 max-w-4xl mx-auto">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[5%] right-[20%] w-[250px] h-[250px] rounded-full bg-blue-600/8 blur-[80px]" />
        <div className="absolute bottom-[30%] left-[10%] w-[200px] h-[200px] rounded-full bg-violet-600/8 blur-[80px]" />
      </div>

      {/* Welcome */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {d.dashboard.greeting}, <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">{name}</span>! 👋
          </h1>
          <p className="mt-1 text-slate-400 text-sm">
            {lang === 'vi' ? 'Đây là tổng quan hành trình của bạn' : "Here's your journey overview"}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/5 rounded-full">
          <Zap size={14} className="text-amber-400" />
          <span className="text-xs text-slate-400 capitalize">{data.tier}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className={`relative bg-white/[0.02] backdrop-blur border border-white/5 rounded-2xl p-5 hover:bg-white/[0.04] transition-all hover:-translate-y-0.5 hover:shadow-lg ${s.glow}`}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-3 shadow-lg ${s.glow}`}>
              <s.icon size={18} className="text-white" />
            </div>
            <div className="text-xs text-slate-500 mb-1">{s.label}</div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Check-in + Assessments */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white/[0.02] backdrop-blur border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-400" />
              {d.dashboard.todayCheckin}
            </h2>
            {lastCheckin && (
              <span className="text-xs text-slate-500">
                {new Date(lastCheckin.created_at).toLocaleDateString(locale)}
              </span>
            )}
          </div>
          {lastCheckin ? (
            <div className="space-y-3">
              <GradientBar label={`😊 ${d.dashboard.mood}`} value={lastCheckin.mood_score} gradient="from-blue-500 to-cyan-400" />
              <GradientBar label={`😴 ${d.dashboard.sleep}`} value={lastCheckin.sleep_score} gradient="from-violet-500 to-purple-400" />
              <GradientBar label={`🔔 ${d.dashboard.tinnitusLoudness}`} value={lastCheckin.tinnitus_loudness} gradient="from-amber-500 to-orange-400" />
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-slate-500 mb-3">{d.dashboard.noCheckin}</p>
              <Link href="/chat" className="inline-flex px-4 py-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-xs rounded-lg">
                {d.dashboard.startNow} →
              </Link>
            </div>
          )}
        </div>

        <div className="bg-white/[0.02] backdrop-blur border border-white/5 rounded-2xl p-5">
          <h2 className="font-semibold text-white flex items-center gap-2 mb-4">
            <ClipboardList size={16} className="text-violet-400" />
            {d.dashboard.recentAssessments}
          </h2>
          {assessments.length > 0 ? (
            <div className="space-y-2">
              {assessments.map((a, i) => (
                <div key={i} className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-white">{a.quiz_type}</div>
                    <div className="text-xs text-slate-500">{new Date(a.created_at).toLocaleDateString(locale)}</div>
                  </div>
                  <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">{a.total_score}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-slate-500 mb-3">{d.dashboard.noAssessments}</p>
              <Link href="/chat" className="inline-flex px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs rounded-lg">
                {d.dashboard.startNow} →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-semibold text-sm text-slate-400 uppercase tracking-wider mb-3">{d.dashboard.quickActions}</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {quickActions.map(a => (
            <Link key={a.href} href={a.href}
              className="group flex items-center gap-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${a.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                <a.icon size={20} className="text-white" />
              </div>
              <div>
                <div className="font-medium text-sm text-white group-hover:text-blue-300 transition-colors">{a.label}</div>
                <div className="text-xs text-slate-500">{a.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
