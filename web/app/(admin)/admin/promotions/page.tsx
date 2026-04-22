'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { Copy, Check, Tag, Users, Plus, PowerOff } from 'lucide-react'
import type { Promotion } from '@/types'
import { PromoCreateModal } from './promo-create-modal'
import { PromoRedemptionsModal } from './promo-redemptions-modal'

const KIND_BADGE: Record<string, { bg: string; text: string }> = {
  percent:      { bg: 'bg-amber-600/20',   text: 'text-amber-400'   },
  fixed:        { bg: 'bg-emerald-600/20', text: 'text-emerald-400' },
  trial_extend: { bg: 'bg-violet-600/20',  text: 'text-violet-400'  },
  tier_grant:   { bg: 'bg-cyan-600/20',    text: 'text-cyan-400'    },
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button onClick={copy} className="p-1 text-slate-500 hover:text-white transition-colors" title="Copy code">
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
    </button>
  )
}

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [stats, setStats] = useState({ active: 0, redemptions_this_month: 0 })
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [redemptionsPromo, setRedemptionsPromo] = useState<Promotion | null>(null)
  const [deactivating, setDeactivating] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/promotions')
      const data = await res.json()
      if (data.promotions) setPromotions(data.promotions)
      if (data.stats) setStats(data.stats)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const deactivate = async (promo: Promotion, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!promo.is_active) return
    if (!confirm(`Deactivate ${promo.code}?`)) return
    setDeactivating(promo.id)
    await fetch(`/api/admin/promotions/${promo.id}`, {
      method: 'DELETE',
    }).catch(() => {})
    setDeactivating(null)
    fetchData()
  }

  const formatValue = (p: Promotion) => {
    if (p.kind === 'percent') return `${p.value ?? 0}%`
    if (p.kind === 'fixed') return `$${p.value ?? 0}`
    if (p.kind === 'trial_extend') return `+${p.value ?? 0}d`
    if (p.kind === 'tier_grant') return p.tier_grant ?? '—'
    return '—'
  }

  return (
    <div className="p-6 lg:p-8">
      {showCreate && <PromoCreateModal onClose={() => setShowCreate(false)} onCreated={fetchData} />}
      {redemptionsPromo && <PromoRedemptionsModal promo={redemptionsPromo} onClose={() => setRedemptionsPromo(null)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">🏷️ Promotions</h1>
          <p className="text-slate-400 text-sm">Manage promo codes and track redemptions</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-500">
          <Plus size={14} /> Create Promo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: 'Active Promos', value: stats.active, icon: <Tag size={16} className="text-blue-400" />, bg: 'from-blue-600/10 to-blue-600/5' },
          { label: 'Redemptions This Month', value: stats.redemptions_this_month, icon: <Users size={16} className="text-emerald-400" />, bg: 'from-emerald-600/10 to-emerald-600/5' },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.bg} border border-white/5 rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-[10px] text-slate-500">{s.label}</span></div>
            <p className="text-xl font-bold text-white">{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                {['Code', 'Kind', 'Value', 'Uses', 'Status', 'Expires', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-slate-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : promotions.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No promotions yet</td></tr>
              ) : promotions.map(p => {
                const badge = KIND_BADGE[p.kind] ?? KIND_BADGE.fixed
                const usesLabel = p.max_uses ? `${p.used_count}/${p.max_uses}` : `${p.used_count}/∞`
                return (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs text-white">{p.code}</span>
                        <CopyButton text={p.code} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${badge.bg} ${badge.text}`}>{p.kind}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-white">{formatValue(p)}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{usesLabel}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${p.is_active ? 'bg-emerald-600/20 text-emerald-400' : 'bg-slate-600/20 text-slate-400'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {p.ends_at ? new Date(p.ends_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setRedemptionsPromo(p)}
                          className="px-2 py-1 text-[10px] text-slate-400 hover:text-white bg-white/5 rounded transition-colors">
                          Redemptions
                        </button>
                        {p.is_active && (
                          <button onClick={e => deactivate(p, e)} disabled={deactivating === p.id}
                            className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-40"
                            title="Deactivate">
                            <PowerOff size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
