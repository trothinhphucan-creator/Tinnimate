'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import EngagementTab from './engagement-tab'
import RevenueTab from './revenue-tab'

const TABS = ['Engagement', 'Revenue'] as const
type Tab = typeof TABS[number]

export default function AdminReportsPage() {
  const [tab, setTab] = useState<Tab>('Engagement')
  const [activityData, setActivityData] = useState<Record<string, unknown> | null>(null)
  const [revenueData, setRevenueData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [secondsAgo, setSecondsAgo] = useState(0)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [actRes, revRes] = await Promise.all([
        fetch('/api/admin/reports/activity'),
        fetch('/api/admin/reports/revenue'),
      ])
      const [act, rev] = await Promise.all([actRes.json(), revRes.json()])
      setActivityData(act)
      setRevenueData(rev)
      setLastUpdated(new Date())
      setSecondsAgo(0)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    const t = setInterval(() => setSecondsAgo(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [lastUpdated])

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">📊 Reports</h1>
          <p className="text-slate-400 text-sm">Engagement and revenue analytics</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[11px] text-slate-600">Updated {secondsAgo}s ago</span>
          )}
          <button onClick={fetchAll} disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-white/10 rounded-lg text-xs text-slate-300 hover:text-white disabled:opacity-40">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-white/[0.03] border border-white/5 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {loading && !activityData ? (
        <div className="flex items-center justify-center py-24 text-slate-500">Loading...</div>
      ) : (
        <>
          {tab === 'Engagement' && activityData && (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <EngagementTab data={activityData as any} />
          )}
          {tab === 'Revenue' && revenueData && (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <RevenueTab data={revenueData as any} />
          )}
        </>
      )}
    </div>
  )
}
