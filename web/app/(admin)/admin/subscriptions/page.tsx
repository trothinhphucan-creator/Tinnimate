'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { Activity, XCircle, Clock, AlertTriangle } from 'lucide-react'

interface SubRow {
  id: string
  user_id: string
  stripe_subscription_id?: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  current_period_end?: string
  created_at: string
  profiles?: { name?: string; email?: string } | null
}

interface Stats { active: number; canceled: number; trialing: number; past_due: number }

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  active:   { bg: 'bg-emerald-600/20', text: 'text-emerald-400' },
  trialing: { bg: 'bg-blue-600/20',    text: 'text-blue-400'    },
  past_due: { bg: 'bg-amber-600/20',   text: 'text-amber-400'   },
  canceled: { bg: 'bg-slate-600/20',   text: 'text-slate-400'   },
}

const TABS = ['all', 'active', 'trialing', 'past_due', 'canceled'] as const
type Tab = typeof TABS[number]

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<SubRow[]>([])
  const [stats, setStats] = useState<Stats>({ active: 0, canceled: 0, trialing: 0, past_due: 0 })
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('all')
  const [page, setPage] = useState(1)
  const limit = 20

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: tab, page: String(page), limit: String(limit) })
      const res = await fetch(`/api/admin/subscriptions?${params}`)
      const data = await res.json()
      if (data.subscriptions) setSubs(data.subscriptions)
      if (data.total !== undefined) setTotal(data.total)
      if (data.stats) setStats(data.stats)
    } catch {}
    setLoading(false)
  }, [tab, page])

  useEffect(() => { fetchData() }, [fetchData])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">💳 Subscriptions</h1>
        <p className="text-slate-400 text-sm">Monitor all subscription statuses</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Active',   value: stats.active,   icon: <Activity   size={16} className="text-emerald-400" />, bg: 'from-emerald-600/10 to-emerald-600/5' },
          { label: 'Trialing', value: stats.trialing, icon: <Clock      size={16} className="text-blue-400"    />, bg: 'from-blue-600/10 to-blue-600/5'     },
          { label: 'Past Due', value: stats.past_due, icon: <AlertTriangle size={16} className="text-amber-400" />, bg: 'from-amber-600/10 to-amber-600/5'   },
          { label: 'Canceled', value: stats.canceled, icon: <XCircle    size={16} className="text-slate-400"   />, bg: 'from-slate-600/10 to-slate-600/5'   },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.bg} border border-white/5 rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-[10px] text-slate-500">{s.label}</span></div>
            <p className="text-xl font-bold text-white">{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 bg-white/[0.02] border border-white/5 rounded-lg p-1 w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => { setTab(t); setPage(1) }}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors capitalize ${tab === t ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                {['User', 'Status', 'Renewal', 'Stripe Sub ID', 'Created'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-slate-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : subs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No subscriptions found</td></tr>
              ) : subs.map(s => {
                const badge = STATUS_BADGE[s.status] ?? STATUS_BADGE.canceled
                const name = s.profiles?.name ?? 'No name'
                const email = s.profiles?.email ?? '—'
                const subId = s.stripe_subscription_id
                return (
                  <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-xs text-white font-medium">{name}</p>
                      <p className="text-[10px] text-slate-500">{email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${badge.bg} ${badge.text}`}>
                        {s.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {subId ? (
                        <span className="font-mono text-[10px] text-slate-400" title={subId}>
                          {subId.slice(0, 20)}…
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
          <span>Showing {(page-1)*limit+1}–{Math.min(page*limit, total)} of {total}</span>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 bg-slate-800 border border-white/10 rounded text-white disabled:opacity-30">Prev</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pg = page <= 3 ? i + 1 : page + i - 2
              if (pg < 1 || pg > totalPages) return null
              return (
                <button key={pg} onClick={() => setPage(pg)}
                  className={`w-8 py-1.5 rounded text-center ${page === pg ? 'bg-blue-600 text-white' : 'bg-slate-800 border border-white/10 text-slate-400'}`}>
                  {pg}
                </button>
              )
            })}
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 bg-slate-800 border border-white/10 rounded text-white disabled:opacity-30">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
