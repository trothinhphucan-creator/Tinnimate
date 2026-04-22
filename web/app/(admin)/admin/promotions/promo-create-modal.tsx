'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface PromoCreateModalProps {
  onClose: () => void
  onCreated: () => void
}

const KINDS = ['percent', 'fixed', 'trial_extend', 'tier_grant'] as const
const TIERS = ['free', 'premium', 'pro', 'ultra'] as const

export function PromoCreateModal({ onClose, onCreated }: PromoCreateModalProps) {
  const [code, setCode] = useState('')
  const [kind, setKind] = useState<typeof KINDS[number]>('percent')
  const [value, setValue] = useState('')
  const [tierGrant, setTierGrant] = useState<typeof TIERS[number]>('premium')
  const [maxUses, setMaxUses] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const needsValue = kind === 'percent' || kind === 'fixed'
  const needsTier = kind === 'tier_grant'
  const needsExtend = kind === 'trial_extend'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setErr('')
    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.toUpperCase().trim(),
          kind,
          value: (needsValue || needsExtend) && value ? Number(value) : undefined,
          tier_grant: needsTier ? tierGrant : undefined,
          max_uses: maxUses ? Number(maxUses) : undefined,
          starts_at: startsAt || undefined,
          ends_at: endsAt || undefined,
          notes: notes || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Error'); setSaving(false); return }
      onCreated()
      onClose()
    } catch { setErr('Network error') }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">Create Promotion</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Code</label>
            <input
              required value={code} onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="SUMMER25" pattern="[A-Z0-9-]+"
              className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white font-mono placeholder:text-slate-600 uppercase"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Kind</label>
            <select value={kind} onChange={e => setKind(e.target.value as typeof KINDS[number])}
              className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white">
              {KINDS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          {(needsValue || needsExtend) && (
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                {kind === 'percent' ? 'Percent (%)' : kind === 'fixed' ? 'Amount (USD)' : 'Days to extend'}
              </label>
              <input type="number" min={0} value={value} onChange={e => setValue(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white" />
            </div>
          )}
          {needsTier && (
            <div>
              <label className="text-xs text-slate-400 block mb-1">Grant Tier</label>
              <select value={tierGrant} onChange={e => setTierGrant(e.target.value as typeof TIERS[number])}
                className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white">
                {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Max Uses (optional)</label>
              <input type="number" min={1} value={maxUses} onChange={e => setMaxUses(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white" />
            </div>
            <div />
            <div>
              <label className="text-xs text-slate-400 block mb-1">Starts At</label>
              <input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Ends At</label>
              <input type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white resize-none" />
          </div>
          {err && <p className="text-xs text-red-400">{err}</p>}
          <button type="submit" disabled={saving}
            className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-500 disabled:opacity-50">
            {saving ? 'Creating...' : 'Create Promotion'}
          </button>
        </form>
      </div>
    </div>
  )
}
