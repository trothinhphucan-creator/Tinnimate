'use client'

import Link from 'next/link'
import { MessageSquare, Music, Ear, Headphones, ClipboardList, Flame, Heart, TrendingUp, Zap } from 'lucide-react'
import { useLangStore } from '@/stores/use-lang-store'
import { t } from '@/lib/i18n'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts'

interface CheckIn {
  mood_score: number
  sleep_score: number
  tinnitus_loudness: number
  created_at: string
}

interface Assessment {
  quiz_type: string
  total_score: number
  created_at: string
}

interface DashboardClientProps {
  data: {
    name: string
    tier: string
    lastCheckin: CheckIn | null
    checkins: CheckIn[]
    assessments: Assessment[]
    therapyCount: number
    streak: number
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

/* eslint-disable @typescript-eslint/no-explicit-any */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-800 border border-slate-600/50 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export default function DashboardClient({ data }: DashboardClientProps) {
  const { lang } = useLangStore()
  const d = t(lang)
  const isEn = lang === 'en'

  const { name, lastCheckin, checkins, assessments, therapyCount, streak } = data

  // Format check-in data for line chart
  const checkinChartData = checkins.map(c => ({
    date: new Date(c.created_at).toLocaleDateString(isEn ? 'en-US' : 'vi-VN', { day: '2-digit', month: 'short' }),
    [isEn ? 'Mood' : 'Tâm trạng']: c.mood_score,
    [isEn ? 'Sleep' : 'Giấc ngủ']: c.sleep_score,
    [isEn ? 'Tinnitus' : 'Ù tai']: c.tinnitus_loudness,
  }))

  // Format assessment data for bar chart
  const assessmentChartData = assessments.map(a => ({
    label: `${a.quiz_type} ${new Date(a.created_at).toLocaleDateString(isEn ? 'en-US' : 'vi-VN', { day: '2-digit', month: 'short' })}`,
    score: a.total_score,
    quiz: a.quiz_type,
  }))

  const stats = [
    { icon: Headphones, label: d.dashboard.therapySessions, value: therapyCount.toString(), gradient: 'from-blue-500 to-cyan-400', glow: 'shadow-blue-500/20' },
    { icon: ClipboardList, label: d.dashboard.recentAssessments, value: assessments.length.toString(), gradient: 'from-violet-500 to-purple-400', glow: 'shadow-violet-500/20' },
    { icon: Flame, label: d.dashboard.streak, value: `${streak} ${d.dashboard.days}`, gradient: 'from-orange-500 to-amber-400', glow: 'shadow-orange-500/20' },
    { icon: Heart, label: d.dashboard.mood, value: lastCheckin ? `${lastCheckin.mood_score}/10` : '--', gradient: 'from-pink-500 to-rose-400', glow: 'shadow-pink-500/20' },
  ]

  const quickActions = [
    { icon: MessageSquare, label: d.dashboard.chatWithTinni, desc: d.dashboard.chatDesc, href: '/chat', gradient: 'from-blue-500 to-cyan-400' },
    { icon: Music, label: d.dashboard.soundTherapy, desc: d.dashboard.soundDesc, href: '/therapy', gradient: 'from-violet-500 to-purple-400' },
    { icon: Ear, label: d.dashboard.hearingTest, desc: d.dashboard.hearingDesc, href: '/hearing-test', gradient: 'from-emerald-500 to-teal-400' },
  ]

  const locale = lang === 'vi' ? 'vi-VN' : 'en-US'

  const moodKey = isEn ? 'Mood' : 'Tâm trạng'
  const sleepKey = isEn ? 'Sleep' : 'Giấc ngủ'
  const tinnitusKey = isEn ? 'Tinnitus' : 'Ù tai'

  return (
    <div className="h-full overflow-y-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl mx-auto">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[5%] right-[20%] w-[250px] h-[250px] rounded-full bg-blue-600/8 blur-[80px]" />
        <div className="absolute bottom-[30%] left-[10%] w-[200px] h-[200px] rounded-full bg-violet-600/8 blur-[80px]" />
      </div>

      {/* Welcome */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
            {d.dashboard.greeting}, <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">{name}</span>! 👋
          </h1>
          <p className="mt-1 text-slate-400 text-xs sm:text-sm">
            {isEn ? "Here's your journey overview" : 'Đây là tổng quan hành trình của bạn'}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/5 rounded-full">
          <Zap size={14} className="text-amber-400" />
          <span className="text-xs text-slate-400 capitalize">{data.tier}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {stats.map(s => (
          <div key={s.label} className={`relative bg-white/[0.02] backdrop-blur border border-white/5 rounded-2xl p-4 sm:p-5 hover:bg-white/[0.04] transition-all hover:-translate-y-0.5 hover:shadow-lg ${s.glow}`}>
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-2 sm:mb-3 shadow-lg ${s.glow}`}>
              <s.icon size={18} className="text-white" />
            </div>
            <div className="text-[10px] sm:text-xs text-slate-500 mb-1">{s.label}</div>
            <div className="text-xl sm:text-2xl font-bold text-white">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid md:grid-cols-2 gap-4 mb-6 sm:mb-8">
        {/* Check-in Trends Chart */}
        <div className="bg-white/[0.02] backdrop-blur border border-white/5 rounded-2xl p-4 sm:p-5">
          <h2 className="font-semibold text-white flex items-center gap-2 mb-4 text-sm">
            <TrendingUp size={16} className="text-blue-400" />
            {isEn ? 'Daily Check-in Trends' : 'Xu Hướng Check-in'}
          </h2>
          {checkinChartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={checkinChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={25} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey={moodKey} stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey={sleepKey} stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey={tinnitusKey} stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-center">
              <p className="text-sm text-slate-500 mb-3">{isEn ? 'Check in daily to see trends!' : 'Check-in hàng ngày để xem xu hướng!'}</p>
              <Link href="/chat" className="inline-flex px-4 py-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-xs rounded-lg">
                {d.dashboard.startNow} →
              </Link>
            </div>
          )}
          {checkinChartData.length > 1 && (
            <div className="flex justify-center gap-4 mt-2 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 rounded-full" />{moodKey}</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-violet-500 rounded-full" />{sleepKey}</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-500 rounded-full" />{tinnitusKey}</span>
            </div>
          )}
        </div>

        {/* Assessment History Chart */}
        <div className="bg-white/[0.02] backdrop-blur border border-white/5 rounded-2xl p-4 sm:p-5">
          <h2 className="font-semibold text-white flex items-center gap-2 mb-4 text-sm">
            <ClipboardList size={16} className="text-violet-400" />
            {isEn ? 'Assessment History' : 'Lịch Sử Đánh Giá'}
          </h2>
          {assessmentChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={assessmentChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="score" fill="url(#barGrad)" radius={[4, 4, 0, 0]} name={isEn ? 'Score' : 'Điểm'} />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-center">
              <p className="text-sm text-slate-500 mb-3">{d.dashboard.noAssessments}</p>
              <Link href="/chat" className="inline-flex px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs rounded-lg">
                {d.dashboard.startNow} →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Last Check-in Detail */}
      <div className="grid md:grid-cols-2 gap-4 mb-6 sm:mb-8">
        <div className="bg-white/[0.02] backdrop-blur border border-white/5 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2 text-sm">
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

        {/* Streak Card */}
        <div className="bg-white/[0.02] backdrop-blur border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center">
          <div className="text-5xl mb-3">{streak > 0 ? '🔥' : '💪'}</div>
          <div className="text-3xl font-bold text-white">{streak}</div>
          <div className="text-xs text-slate-400 mt-1">
            {isEn ? 'day streak' : 'ngày liên tiếp'}
          </div>
          <p className="text-[10px] text-slate-600 mt-3 max-w-[200px]">
            {isEn
              ? streak > 0 ? 'Keep going! Consistency is key to managing tinnitus.' : 'Start checking in daily to build your streak!'
              : streak > 0 ? 'Tiếp tục nhé! Kiên trì là chìa khóa quản lý ù tai.' : 'Bắt đầu check-in hàng ngày để xây dựng streak!'}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-semibold text-sm text-slate-400 uppercase tracking-wider mb-3">{d.dashboard.quickActions}</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {quickActions.map(a => (
            <Link key={a.href} href={a.href}
              className="group flex items-center gap-3 sm:gap-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-2xl p-3 sm:p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
              <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${a.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                <a.icon size={20} className="text-white" />
              </div>
              <div>
                <div className="font-medium text-xs sm:text-sm text-white group-hover:text-blue-300 transition-colors">{a.label}</div>
                <div className="text-[10px] sm:text-xs text-slate-500">{a.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
