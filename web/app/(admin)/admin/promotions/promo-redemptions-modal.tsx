'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { Promotion, PromotionRedemption } from '@/types'

interface PromoRedemptionsModalProps {
  promo: Promotion
  onClose: () => void
}

export function PromoRedemptionsModal({ promo, onClose }: PromoRedemptionsModalProps) {
  const [redemptions, setRedemptions] = useState<PromotionRedemption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/promotions/${promo.id}/redemptions`)
      .then(r => r.json())
      .then(d => { if (d.redemptions) setRedemptions(d.redemptions) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [promo.id])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h3 className="text-sm font-semibold text-white">Redemptions</h3>
            <p className="text-xs text-slate-500 font-mono">{promo.code}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={18} /></button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <p className="text-slate-500 text-sm text-center py-8">Loading...</p>
          ) : redemptions.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No redemptions yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="text-left px-4 py-2 text-xs text-slate-400 font-medium">User</th>
                  <th className="text-left px-4 py-2 text-xs text-slate-400 font-medium">Email</th>
                  <th className="text-left px-4 py-2 text-xs text-slate-400 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {redemptions.map(r => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="px-4 py-2.5 text-xs text-white">{(r.profile as { name?: string; email?: string } | undefined)?.name ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">{(r.profile as { name?: string; email?: string } | undefined)?.email ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">{new Date(r.redeemed_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
