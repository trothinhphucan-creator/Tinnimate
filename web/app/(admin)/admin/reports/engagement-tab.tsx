'use client'

import { SparkLine, BarChart } from '@/components/admin/svg-sparkline-chart'
import { Users, Activity, MessageSquare, UserPlus } from 'lucide-react'

interface DayCount { date: string; count: number }
interface AssessmentRow { quiz_type: string; avg_score: number; count: number }
interface TherapyRow { sound_type: string; count: number; avg_duration_sec: number }

interface ActivityData {
  dau: DayCount[]
  messages: DayCount[]
  signups: DayCount[]
  tierBreakdown: Record<string, number>
  totalUsers: number
  active7d: number
  assessments: AssessmentRow[]
  therapyUsage: TherapyRow[]
}

interface Props { data: ActivityData }

const TIER_COLORS: Record<string, string> = {
  free: 'bg-slate-500',
  premium: 'bg-amber-500',
  pro: 'bg-violet-500',
  ultra: 'bg-cyan-400',
}

function toChartArrays(series: DayCount[]): { vals: number[]; labels: string[] } {
  return {
    vals: series.map(d => d.count),
    labels: series.map(d => d.date),
  }
}

function fmtDuration(sec: number) {
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`
}

export default function EngagementTab({ data }: Props) {
  const { dau, messages, signups, tierBreakdown, totalUsers, active7d, assessments, therapyUsage } = data

  // Today messages count (last item in series if today)
  const todayMsg = messages.at(-1)?.count ?? 0

  // Signups this week (last 7 days sum)
  const weekSignups = signups.slice(-7).reduce((s, d) => s + d.count, 0)

  const totalTierCount = Object.values(tierBreakdown).reduce((s, v) => s + v, 0) || 1
  const tiers = ['free', 'premium', 'pro', 'ultra']

  const dauChart = toChartArrays(dau)
  const msgChart = toChartArrays(messages)
  const signupChart = toChartArrays(signups)

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Users', value: totalUsers, icon: <Users size={15} className="text-blue-400" />, sub: 'all time' },
          { label: 'Active 7d', value: active7d, icon: <Activity size={15} className="text-emerald-400" />, sub: 'unique users' },
          { label: 'Messages Today', value: todayMsg, icon: <MessageSquare size={15} className="text-violet-400" />, sub: 'user messages' },
          { label: 'Signups (7d)', value: weekSignups, icon: <UserPlus size={15} className="text-amber-400" />, sub: 'new accounts' },
        ].map(k => (
          <div key={k.label} className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">{k.icon}<span className="text-[10px] text-slate-500">{k.label}</span></div>
            <p className="text-2xl font-bold text-white">{k.value.toLocaleString()}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { title: 'DAU — 30 days', vals: dauChart.vals, labels: dauChart.labels, color: '#3b82f6' },
          { title: 'Messages / day', vals: msgChart.vals, labels: msgChart.labels, color: '#8b5cf6' },
          { title: 'New signups / day', vals: signupChart.vals, labels: signupChart.labels, color: '#10b981' },
        ].map(chart => (
          <div key={chart.title} className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
            <p className="text-xs font-medium text-slate-400 mb-3">{chart.title}</p>
            <SparkLine data={chart.vals} labels={chart.labels} color={chart.color} width={360} height={72} />
          </div>
        ))}
      </div>

      {/* Tier breakdown */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
        <p className="text-xs font-medium text-slate-400 mb-3">Subscription Tier Breakdown</p>
        <div className="space-y-2">
          {tiers.map(tier => {
            const count = tierBreakdown[tier] ?? 0
            const pct = Math.round((count / totalTierCount) * 100)
            return (
              <div key={tier} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-16 capitalize">{tier}</span>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full ${TIER_COLORS[tier] ?? 'bg-slate-500'} rounded-full`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-slate-300 w-10 text-right">{count}</span>
                <span className="text-[10px] text-slate-600 w-8 text-right">{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Assessments + Therapy side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Assessments table */}
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-400 mb-3">Assessments — last 30d</p>
          {assessments.length === 0 ? (
            <p className="text-xs text-slate-600">No assessment data</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-2 text-slate-500 font-medium">Type</th>
                  <th className="text-right py-2 text-slate-500 font-medium">Avg Score</th>
                  <th className="text-right py-2 text-slate-500 font-medium">Count</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map(a => (
                  <tr key={a.quiz_type} className="border-b border-white/[0.03]">
                    <td className="py-2 text-slate-300">{a.quiz_type}</td>
                    <td className="py-2 text-right text-white font-mono">{a.avg_score}</td>
                    <td className="py-2 text-right text-slate-400">{a.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Therapy usage */}
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-400 mb-3">Top Therapy Sounds — last 30d</p>
          {therapyUsage.length === 0 ? (
            <p className="text-xs text-slate-600">No therapy session data</p>
          ) : (
            <>
              <BarChart
                data={therapyUsage.map(t => t.count)}
                labels={therapyUsage.map(t => t.sound_type)}
                color="#06b6d4"
                width={340}
                height={72}
              />
              <table className="w-full text-xs mt-3">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left py-1.5 text-slate-500 font-medium">Sound</th>
                    <th className="text-right py-1.5 text-slate-500 font-medium">Sessions</th>
                    <th className="text-right py-1.5 text-slate-500 font-medium">Avg Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {therapyUsage.map(t => (
                    <tr key={t.sound_type} className="border-b border-white/[0.03]">
                      <td className="py-1.5 text-slate-300 capitalize">{t.sound_type.replace(/_/g, ' ')}</td>
                      <td className="py-1.5 text-right text-white">{t.count}</td>
                      <td className="py-1.5 text-right text-slate-400">{fmtDuration(t.avg_duration_sec)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
