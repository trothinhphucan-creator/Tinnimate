'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { Shield, ChevronDown, ChevronRight, X } from 'lucide-react'

interface AuditEntry {
  id: number
  action: string
  target_type?: string
  target_id?: string
  diff?: { before?: unknown; after?: unknown }
  ip?: string
  created_at: string
  admin_name?: string
  admin_email?: string
}

const ACTION_COLOR: Record<string, string> = {
  'tier.change':          'bg-amber-600/20 text-amber-300',
  'password.reset':       'bg-red-600/20 text-red-300',
  'promo.create':         'bg-emerald-600/20 text-emerald-300',
  'promo.update':         'bg-blue-600/20 text-blue-300',
  'promo.deactivate':     'bg-slate-600/20 text-slate-400',
  'conversation.delete':  'bg-red-600/20 text-red-300',
}

function DiffPreview({ diff }: { diff?: AuditEntry['diff'] }) {
  if (!diff) return <span className="text-slate-600">—</span>
  const before = diff.before
  const after  = diff.after
  if (typeof before === 'string' && typeof after === 'string') {
    return <span className="text-xs font-mono"><span className="text-red-400">{before}</span>{' → '}<span className="text-emerald-400">{after}</span></span>
  }
  return <span className="text-xs text-slate-500 italic">view diff</span>
}

function DiffModal({ entry, onClose }: { entry: AuditEntry; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-white/10 rounded-xl max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <span className="text-sm font-semibold text-white">Diff — {entry.action}</span>
          <button onClick={onClose}><X size={16} className="text-slate-500 hover:text-white" /></button>
        </div>
        <pre className="p-5 text-xs text-slate-300 overflow-x-auto max-h-96 whitespace-pre-wrap">
          {JSON.stringify(entry.diff, null, 2)}
        </pre>
      </div>
    </div>
  )
}

export default function AdminAuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('')
  const [filterInput, setFilterInput]   = useState('')
  const [page, setPage]   = useState(1)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [diffEntry, setDiffEntry] = useState<AuditEntry | null>(null)
  const limit = 50

  const fetchAudit = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ action: actionFilter, page: String(page), limit: String(limit) })
      const res  = await fetch(`/api/admin/audit?${params}`)
      const data = await res.json()
      setEntries(data.entries ?? [])
      setTotal(data.total ?? 0)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [actionFilter, page])

  useEffect(() => { fetchAudit() }, [fetchAudit])

  useEffect(() => {
    const t = setTimeout(() => { setActionFilter(filterInput); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [filterInput])

  const totalPages = Math.ceil(total / limit)

  const toggleExpand = (id: number) => {
    setExpanded(s => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Shield size={20} className="text-blue-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Log</h1>
          <p className="text-slate-400 text-sm">Read-only record of all admin actions</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-3 mb-4">
        <input value={filterInput} onChange={e => setFilterInput(e.target.value)}
          placeholder="Filter by action (e.g. tier.change)..."
          className="px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-600 w-64" />
        <span className="text-xs text-slate-600 self-center">{total.toLocaleString()} entries</span>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Date</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Admin</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Action</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Target</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No audit entries</td></tr>
            ) : entries.map(e => {
              const isExpanded = expanded.has(e.id)
              const actionStyle = ACTION_COLOR[e.action] ?? 'bg-slate-700/40 text-slate-400'
              const hasDiff = !!e.diff
              return (
                <>
                  <tr key={e.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(e.created_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="text-xs text-white">{e.admin_name ?? '—'}</p>
                      <p className="text-[10px] text-slate-600">{e.admin_email ?? ''}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium ${actionStyle}`}>
                        {e.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">
                      {e.target_type && <span className="text-slate-500">{e.target_type}: </span>}
                      <span className="font-mono text-[10px] text-slate-400">{e.target_id?.slice(0, 12) ?? '—'}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      {hasDiff ? (
                        <div className="flex items-center gap-2">
                          <DiffPreview diff={e.diff} />
                          <button onClick={() => { if (typeof e.diff?.before !== 'string') { setDiffEntry(e) } else { toggleExpand(e.id) } }}
                            className="text-slate-600 hover:text-white">
                            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-700 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${e.id}-expand`} className="bg-white/[0.01]">
                      <td colSpan={5} className="px-8 py-3">
                        <pre className="text-[10px] text-slate-400 font-mono whitespace-pre-wrap">
                          {JSON.stringify(e.diff, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 bg-slate-800 border border-white/10 rounded text-white disabled:opacity-30">Prev</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 bg-slate-800 border border-white/10 rounded text-white disabled:opacity-30">Next</button>
          </div>
        </div>
      )}

      {diffEntry && <DiffModal entry={diffEntry} onClose={() => setDiffEntry(null)} />}
    </div>
  )
}
