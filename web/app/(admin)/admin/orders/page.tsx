'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { DollarSign, XCircle, Clock, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react'

interface OrderRow {
  id: string
  user_id?: string
  gateway: string
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  stripe_session_id?: string
  metadata?: Record<string, unknown>
  created_at: string
  profiles?: { name?: string; email?: string } | null
}

interface Stats { paid: number; failed: number; pending: number; refunded: number; total_paid_usd: number }

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  paid:     { bg: 'bg-emerald-600/20', text: 'text-emerald-400' },
  pending:  { bg: 'bg-amber-600/20',   text: 'text-amber-400'   },
  failed:   { bg: 'bg-red-600/20',     text: 'text-red-400'     },
  refunded: { bg: 'bg-slate-600/20',   text: 'text-slate-400'   },
}

const GATEWAY_BADGE: Record<string, { bg: string; text: string }> = {
  stripe: { bg: 'bg-blue-600/20',   text: 'text-blue-400'   },
  momo:   { bg: 'bg-purple-600/20', text: 'text-purple-400' },
  vnpay:  { bg: 'bg-green-600/20',  text: 'text-green-400'  },
}

const TABS = ['all', 'paid', 'pending', 'failed', 'refunded'] as const
type Tab = typeof TABS[number]

function OrderMetadataRow({ order }: { order: OrderRow }) {
  if (!order.metadata || Object.keys(order.metadata).length === 0) {
    return <p className="text-slate-600 text-xs italic">No metadata</p>
  }
  return (
    <pre className="text-[10px] text-slate-300 bg-slate-900 border border-white/5 rounded p-3 overflow-x-auto max-h-48">
      {JSON.stringify(order.metadata, null, 2)}
    </pre>
  )
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [stats, setStats] = useState<Stats>({ paid: 0, failed: 0, pending: 0, refunded: 0, total_paid_usd: 0 })
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('all')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<string | null>(null)
  const limit = 20

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: tab, page: String(page), limit: String(limit) })
      const res = await fetch(`/api/admin/orders?${params}`)
      const data = await res.json()
      if (data.orders) setOrders(data.orders)
      if (data.total !== undefined) setTotal(data.total)
      if (data.stats) setStats(data.stats)
    } catch {}
    setLoading(false)
  }, [tab, page])

  useEffect(() => { fetchData() }, [fetchData])

  const totalPages = Math.ceil(total / limit)
  const toggleExpand = (id: string) => setExpanded(prev => prev === id ? null : id)

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">💰 Payment Orders</h1>
        <p className="text-slate-400 text-sm">Track all payment transactions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: `Paid (USD $${stats.total_paid_usd.toFixed(2)})`, value: stats.paid,     icon: <DollarSign size={16} className="text-emerald-400" />, bg: 'from-emerald-600/10 to-emerald-600/5' },
          { label: 'Pending',                                          value: stats.pending,  icon: <Clock      size={16} className="text-amber-400"   />, bg: 'from-amber-600/10 to-amber-600/5'    },
          { label: 'Failed',                                           value: stats.failed,   icon: <XCircle    size={16} className="text-red-400"     />, bg: 'from-red-600/10 to-red-600/5'        },
          { label: 'Refunded',                                         value: stats.refunded, icon: <RotateCcw  size={16} className="text-slate-400"   />, bg: 'from-slate-600/10 to-slate-600/5'    },
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
          <button key={t} onClick={() => { setTab(t); setPage(1); setExpanded(null) }}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors capitalize ${tab === t ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                {['', 'Order ID', 'User', 'Amount', 'Gateway', 'Status', 'Created'].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-xs text-slate-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No orders found</td></tr>
              ) : orders.map(o => {
                const statusBadge = STATUS_BADGE[o.status] ?? STATUS_BADGE.pending
                const gwBadge = GATEWAY_BADGE[o.gateway.toLowerCase()] ?? { bg: 'bg-slate-600/20', text: 'text-slate-400' }
                const isExpanded = expanded === o.id
                return (
                  <>
                    <tr key={o.id}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => toggleExpand(o.id)}>
                      <td className="px-3 py-3 text-slate-500">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[10px] text-slate-400" title={o.id}>{o.id.slice(0, 8)}…</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-white font-medium">{o.profiles?.name ?? 'Unknown'}</p>
                        <p className="text-[10px] text-slate-500">{o.profiles?.email ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-white font-medium">
                        {o.amount.toLocaleString()} {o.currency.toUpperCase()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${gwBadge.bg} ${gwBadge.text}`}>
                          {o.gateway}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(o.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${o.id}-meta`} className="border-b border-white/5 bg-white/[0.01]">
                        <td colSpan={7} className="px-6 py-3">
                          <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Metadata</p>
                          <OrderMetadataRow order={o} />
                        </td>
                      </tr>
                    )}
                  </>
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
