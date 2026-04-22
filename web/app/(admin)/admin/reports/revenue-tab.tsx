'use client'

import { BarChart } from '@/components/admin/svg-sparkline-chart'
import { CreditCard, TrendingUp, Tag, XCircle, Clock } from 'lucide-react'

interface GatewayRow { gateway: string; total_usd: number; total_vnd: number; count: number }
interface MonthRow { month: string; total_vnd: number; total_usd: number; count: number }

interface RevenueData {
  totalRevenue: { usd: number; vnd: number }
  revenueByGateway: GatewayRow[]
  revenueByMonth: MonthRow[]
  activeSubscriptions: number
  canceledLast30d: number
  trialingSubscriptions: number
  totalPromos: number
  totalRedemptions: number
}

interface Props { data: RevenueData }

const GATEWAY_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  stripe: { color: 'text-blue-400', bg: 'bg-blue-600/10', border: 'border-blue-500/20' },
  momo:   { color: 'text-purple-400', bg: 'bg-purple-600/10', border: 'border-purple-500/20' },
  vnpay:  { color: 'text-green-400', bg: 'bg-green-600/10', border: 'border-green-500/20' },
}

function fmtVnd(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M ₫`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K ₫`
  return `${v} ₫`
}

function fmtUsd(v: number) {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function RevenueTab({ data }: Props) {
  const {
    totalRevenue, revenueByGateway, revenueByMonth,
    activeSubscriptions, canceledLast30d, trialingSubscriptions,
    totalPromos, totalRedemptions,
  } = data

  const monthVals = revenueByMonth.map(m => m.total_vnd + m.total_usd * 24000)
  const monthLabels = revenueByMonth.map(m => m.month)

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Total Revenue',
            value: fmtVnd(totalRevenue.vnd),
            sub: totalRevenue.usd > 0 ? `+ ${fmtUsd(totalRevenue.usd)}` : '90 days',
            icon: <TrendingUp size={15} className="text-emerald-400" />,
          },
          {
            label: 'Active Subs',
            value: activeSubscriptions,
            sub: 'currently active',
            icon: <CreditCard size={15} className="text-blue-400" />,
          },
          {
            label: 'Trialing',
            value: trialingSubscriptions,
            sub: 'in trial period',
            icon: <Clock size={15} className="text-amber-400" />,
          },
          {
            label: 'Canceled (30d)',
            value: canceledLast30d,
            sub: 'last 30 days',
            icon: <XCircle size={15} className="text-red-400" />,
          },
        ].map(k => (
          <div key={k.label} className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">{k.icon}<span className="text-[10px] text-slate-500">{k.label}</span></div>
            <p className="text-2xl font-bold text-white">{k.value}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue by gateway */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
        <p className="text-xs font-medium text-slate-400 mb-3">Revenue by Gateway — 90 days</p>
        {revenueByGateway.length === 0 ? (
          <p className="text-xs text-slate-600">No payment data</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {revenueByGateway.map(g => {
              const style = GATEWAY_STYLE[g.gateway] ?? { color: 'text-slate-400', bg: 'bg-slate-700/20', border: 'border-slate-700/30' }
              return (
                <div key={g.gateway} className={`${style.bg} border ${style.border} rounded-xl p-4`}>
                  <p className={`text-sm font-semibold capitalize ${style.color}`}>{g.gateway}</p>
                  {g.total_vnd > 0 && <p className="text-lg font-bold text-white mt-1">{fmtVnd(g.total_vnd)}</p>}
                  {g.total_usd > 0 && <p className="text-lg font-bold text-white mt-1">{fmtUsd(g.total_usd)}</p>}
                  <p className="text-[10px] text-slate-500 mt-1">{g.count} transactions</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Revenue by month chart */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
        <p className="text-xs font-medium text-slate-400 mb-3">Revenue by Month (VND equivalent)</p>
        {revenueByMonth.length === 0 ? (
          <p className="text-xs text-slate-600">No monthly data</p>
        ) : (
          <>
            <BarChart data={monthVals} labels={monthLabels} color="#10b981" width={600} height={100} />
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left py-2 text-slate-500 font-medium">Month</th>
                    <th className="text-right py-2 text-slate-500 font-medium">VND</th>
                    <th className="text-right py-2 text-slate-500 font-medium">USD</th>
                    <th className="text-right py-2 text-slate-500 font-medium">Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueByMonth.map(m => (
                    <tr key={m.month} className="border-b border-white/[0.03]">
                      <td className="py-2 text-slate-300">{m.month}</td>
                      <td className="py-2 text-right text-white font-mono">{m.total_vnd > 0 ? fmtVnd(m.total_vnd) : '—'}</td>
                      <td className="py-2 text-right text-white font-mono">{m.total_usd > 0 ? fmtUsd(m.total_usd) : '—'}</td>
                      <td className="py-2 text-right text-slate-400">{m.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Promotions summary */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Tag size={14} className="text-amber-400" />
          <p className="text-xs font-medium text-slate-400">Promotions Summary</p>
        </div>
        <div className="flex gap-6">
          <div>
            <p className="text-2xl font-bold text-white">{totalPromos}</p>
            <p className="text-[10px] text-slate-500">Active promos</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{totalRedemptions}</p>
            <p className="text-[10px] text-slate-500">Total redemptions</p>
          </div>
        </div>
      </div>
    </div>
  )
}
