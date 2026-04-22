'use client'

import { useState } from 'react'
import { Copy, Check, RefreshCw } from 'lucide-react'
import type { UserDetail } from '@/types'

interface Props {
  profile: UserDetail
  userId: string
  onSaved: () => void
}

export function ProfileTab({ profile, userId, onSaved }: Props) {
  const [tier, setTier] = useState(profile.subscription_tier)
  const [isAdmin, setIsAdmin] = useState(profile.is_admin)
  const [notes, setNotes] = useState(profile.admin_notes ?? '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [resetLink, setResetLink] = useState('')
  const [resetting, setResetting] = useState(false)
  const [copied, setCopied] = useState(false)

  const save = async () => {
    setSaving(true); setMsg('')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, subscription_tier: tier, is_admin: isAdmin, notes }),
      })
      setMsg(res.ok ? '✅ Saved' : '❌ Error saving')
      if (res.ok) onSaved()
    } catch { setMsg('❌ Network error') }
    setSaving(false)
  }

  const resetPassword = async () => {
    setResetting(true); setResetLink('')
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, { method: 'POST' })
      const data = await res.json()
      if (data.link) setResetLink(data.link)
      else setMsg('❌ ' + (data.error ?? 'Failed'))
    } catch { setMsg('❌ Network error') }
    setResetting(false)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(resetLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Read-only identity */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/[0.03] rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-1">Name</p>
          <p className="text-sm text-white">{profile.name ?? '—'}</p>
        </div>
        <div className="bg-white/[0.03] rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-1">Email (read-only)</p>
          <p className="text-sm text-slate-400">{profile.email ?? '—'}</p>
        </div>
      </div>

      {/* Editable fields */}
      <div>
        <label className="text-xs text-slate-500 block mb-1">Subscription Tier</label>
        <select value={tier} onChange={e => setTier(e.target.value as UserDetail['subscription_tier'])}
          className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white">
          <option value="free">🆓 Free</option>
          <option value="premium">⭐ Premium</option>
          <option value="pro">💎 Pro</option>
          <option value="ultra">⚡ Ultra</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs text-slate-400">Is Admin</label>
        <button onClick={() => setIsAdmin(v => !v)}
          className={`w-10 h-5 rounded-full transition-colors ${isAdmin ? 'bg-blue-600' : 'bg-slate-700'}`}>
          <span className={`block w-4 h-4 mx-0.5 rounded-full bg-white transition-transform ${isAdmin ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
        <span className="text-xs text-slate-500">{isAdmin ? 'Admin' : 'User'}</span>
      </div>

      <div>
        <label className="text-xs text-slate-500 block mb-1">Admin Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
          className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white resize-none"
          placeholder="Internal notes..." />
      </div>

      {msg && <p className="text-xs">{msg}</p>}
      <button onClick={save} disabled={saving}
        className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-500 disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Changes'}
      </button>

      {/* Password reset */}
      <div className="border-t border-white/5 pt-4">
        <p className="text-xs text-slate-500 mb-2">Generate password reset link (shown here, not emailed)</p>
        <button onClick={resetPassword} disabled={resetting}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white hover:bg-slate-700 disabled:opacity-50">
          <RefreshCw size={14} className={resetting ? 'animate-spin' : ''} />
          {resetting ? 'Generating...' : 'Reset Password'}
        </button>
        {resetLink && (
          <div className="mt-2 flex items-center gap-2">
            <input readOnly value={resetLink}
              className="flex-1 px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-slate-400 font-mono truncate" />
            <button onClick={copyLink} className="p-1.5 bg-slate-800 border border-white/10 rounded-lg text-slate-400 hover:text-white">
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
