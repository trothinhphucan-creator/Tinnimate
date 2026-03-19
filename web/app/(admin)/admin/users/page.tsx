export const dynamic = "force-dynamic"
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, ChevronDown, ChevronUp, Users, Crown, Star, Zap, Activity, X, Shield, ShieldOff } from 'lucide-react'

interface UserRow {
  id: string
  name: string | null
  email: string | null
  subscription_tier: string
  tinnitus_type: string | null
  tinnitus_frequency: number | null
  tinnitus_ear: string | null
  is_admin: boolean
  created_at: string
  streak_count: number | null
  last_checkin_date: string | null
}

interface Stats {
  total: number
  free: number
  premium: number
  pro: number
  active_7d: number
}

const TIER_BADGE: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  free: { bg: 'bg-slate-700/50', text: 'text-slate-300', icon: <Users size={10} /> },
  premium: { bg: 'bg-amber-600/20', text: 'text-amber-400', icon: <Star size={10} /> },
  pro: { bg: 'bg-violet-600/20', text: 'text-violet-400', icon: <Crown size={10} /> },
}

export default function AdminCRMPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, free: 0, premium: 0, pro: 0, active_7d: 0 })
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('all')
  const [sortField, setSortField] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)
  const [editTier, setEditTier] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const limit = 20

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        search, tier: tierFilter, sort: sortField, order: sortOrder,
        page: String(page), limit: String(limit),
      })
      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      if (data.users) {
        setUsers(data.users)
        setTotalCount(data.total)
        if (data.stats) setStats(data.stats)
      }
    } catch {}
    setLoading(false)
  }, [search, tierFilter, sortField, sortOrder, page])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // Debounced search
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const toggleSort = (field: string) => {
    if (sortField === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortOrder('desc') }
    setPage(1)
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null
    return sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
  }

  const totalPages = Math.ceil(totalCount / limit)

  const saveUser = async () => {
    if (!selectedUser) return
    setSaving(true); setMsg('')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedUser.id, subscription_tier: editTier }),
      })
      if (res.ok) { setMsg('✅ Saved'); fetchUsers() }
      else setMsg('❌ Error')
    } catch { setMsg('❌ Network error') }
    setSaving(false)
  }

  const toggleAdmin = async (userId: string, current: boolean) => {
    try {
      await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, is_admin: !current }),
      })
      fetchUsers()
    } catch {}
  }

  const daysSince = (date: string | null) => {
    if (!date) return '—'
    const d = Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
    if (d === 0) return 'Today'
    if (d === 1) return '1d ago'
    return `${d}d ago`
  }

  return (
    <div className="p-6 lg:p-8">
      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedUser(null)}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="text-sm font-semibold text-white">User Details</h3>
              <button onClick={() => setSelectedUser(null)} className="text-slate-500 hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg">
                  {(selectedUser.name ?? selectedUser.email ?? '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-medium">{selectedUser.name ?? 'No name'}</p>
                  <p className="text-xs text-slate-400">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white/[0.03] rounded-lg p-3">
                  <span className="text-slate-500">ID</span>
                  <p className="text-white font-mono text-[10px] break-all">{selectedUser.id}</p>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-3">
                  <span className="text-slate-500">Joined</span>
                  <p className="text-white">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-3">
                  <span className="text-slate-500">Tinnitus</span>
                  <p className="text-white">{selectedUser.tinnitus_type ?? '—'} {selectedUser.tinnitus_frequency ? `${selectedUser.tinnitus_frequency}Hz` : ''}</p>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-3">
                  <span className="text-slate-500">Streak</span>
                  <p className="text-white">🔥 {selectedUser.streak_count ?? 0} days</p>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-3">
                  <span className="text-slate-500">Last Active</span>
                  <p className="text-white">{daysSince(selectedUser.last_checkin_date)}</p>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-3">
                  <span className="text-slate-500">Ear</span>
                  <p className="text-white">{selectedUser.tinnitus_ear ?? '—'}</p>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1">Subscription Tier</label>
                <select value={editTier} onChange={e => setEditTier(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white">
                  <option value="free">🆓 Free</option>
                  <option value="premium">⭐ Premium</option>
                  <option value="pro">💎 Pro</option>
                </select>
              </div>
              {msg && <p className="text-xs">{msg}</p>}
              <button onClick={saveUser} disabled={saving}
                className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-500 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">👥 CRM — User Management</h1>
        <p className="text-slate-400 text-sm">View, search, filter and manage all users</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total Users', value: stats.total, icon: <Users size={16} className="text-blue-400" />, bg: 'from-blue-600/10 to-blue-600/5' },
          { label: 'Free', value: stats.free, icon: <Users size={16} className="text-slate-400" />, bg: 'from-slate-600/10 to-slate-600/5' },
          { label: 'Premium', value: stats.premium, icon: <Star size={16} className="text-amber-400" />, bg: 'from-amber-600/10 to-amber-600/5' },
          { label: 'Pro', value: stats.pro, icon: <Crown size={16} className="text-violet-400" />, bg: 'from-violet-600/10 to-violet-600/5' },
          { label: 'Active (7d)', value: stats.active_7d, icon: <Activity size={16} className="text-emerald-400" />, bg: 'from-emerald-600/10 to-emerald-600/5' },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.bg} border border-white/5 rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-[10px] text-slate-500">{s.label}</span></div>
            <p className="text-xl font-bold text-white">{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Conversion rate */}
      {stats.total > 0 && (
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 mb-6 flex items-center gap-4">
          <Zap size={14} className="text-amber-400" />
          <span className="text-xs text-slate-400">Conversion Rate:</span>
          <span className="text-xs font-semibold text-white">{((stats.premium + stats.pro) / stats.total * 100).toFixed(1)}%</span>
          <span className="text-[10px] text-slate-600">({stats.premium + stats.pro} paying / {stats.total} total)</span>
          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden ml-2">
            <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: `${(stats.premium + stats.pro) / stats.total * 100}%` }} />
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-600" />
        </div>
        <select value={tierFilter} onChange={e => { setTierFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white">
          <option value="all">All Tiers</option>
          <option value="free">🆓 Free</option>
          <option value="premium">⭐ Premium</option>
          <option value="pro">💎 Pro</option>
        </select>
      </div>

      {/* User table */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                {[
                  { field: 'name', label: 'User' },
                  { field: 'subscription_tier', label: 'Plan' },
                  { field: 'tinnitus_type', label: 'Tinnitus' },
                  { field: 'streak_count', label: 'Streak' },
                  { field: 'last_checkin_date', label: 'Last Active' },
                  { field: 'created_at', label: 'Joined' },
                ].map(col => (
                  <th key={col.field}
                    onClick={() => toggleSort(col.field)}
                    className="text-left px-4 py-3 text-xs text-slate-400 font-medium cursor-pointer hover:text-white select-none">
                    <span className="flex items-center gap-1">{col.label} <SortIcon field={col.field} /></span>
                  </th>
                ))}
                <th className="px-4 py-3 text-xs text-slate-400 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No users found</td></tr>
              ) : users.map(u => {
                const badge = TIER_BADGE[u.subscription_tier] ?? TIER_BADGE.free
                return (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => { setSelectedUser(u); setEditTier(u.subscription_tier); setMsg('') }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 flex-shrink-0">
                          {(u.name ?? u.email ?? '?')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-xs font-medium truncate max-w-[140px]">
                            {u.name ?? 'No name'}
                            {u.is_admin && <span className="ml-1 text-[9px] text-blue-400">ADMIN</span>}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${badge.bg} ${badge.text}`}>
                        {badge.icon} {u.subscription_tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {u.tinnitus_type ?? '—'}
                      {u.tinnitus_frequency ? <span className="ml-1 text-slate-600">{u.tinnitus_frequency}Hz</span> : ''}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {u.streak_count ? <span className="text-orange-400">🔥 {u.streak_count}</span> : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{daysSince(u.last_checkin_date)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <button onClick={() => toggleAdmin(u.id, u.is_admin)} title={u.is_admin ? 'Remove admin' : 'Make admin'}
                        className={`p-1.5 rounded-lg transition-colors ${u.is_admin ? 'text-blue-400 hover:bg-blue-600/20' : 'text-slate-600 hover:bg-white/5 hover:text-white'}`}>
                        {u.is_admin ? <Shield size={14} /> : <ShieldOff size={14} />}
                      </button>
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
          <span>Showing {(page-1)*limit+1}–{Math.min(page*limit, totalCount)} of {totalCount}</span>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 bg-slate-800 border border-white/10 rounded text-white disabled:opacity-30">Prev</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page + i - 2
              if (p < 1 || p > totalPages) return null
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 py-1.5 rounded text-center ${page === p ? 'bg-blue-600 text-white' : 'bg-slate-800 border border-white/10 text-slate-400'}`}>
                  {p}
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
