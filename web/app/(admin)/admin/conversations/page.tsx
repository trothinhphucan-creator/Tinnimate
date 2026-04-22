'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { Search, Eye, Trash2, X, Loader2, MessagesSquare } from 'lucide-react'
import { ConversationMessagePreviewModal } from './conversation-message-preview-modal'

interface ConversationRow {
  id: string
  title: string | null
  user_id: string
  user_name: string | null
  user_email: string | null
  created_at: string
  updated_at: string
  message_count_hint: number
}

export default function AdminConversationsPage() {
  const [rows, setRows]           = useState<ConversationRow[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ConversationRow | null>(null)
  const [deleting, setDeleting]   = useState(false)
  const limit = 20

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ search, page: String(page), limit: String(limit) })
      const res  = await fetch(`/api/admin/conversations?${params}`)
      const data = await res.json()
      if (data.conversations) { setRows(data.conversations); setTotal(data.total) }
    } catch {}
    setLoading(false)
  }, [search, page])

  useEffect(() => { fetchData() }, [fetchData])

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await fetch('/api/admin/conversations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id }),
      })
      setRows(r => r.filter(x => x.id !== deleteTarget.id))
      setTotal(t => t - 1)
    } catch {}
    setDeleting(false)
    setDeleteTarget(null)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-6 lg:p-8">
      {/* Message preview modal */}
      {previewId && (
        <ConversationMessagePreviewModal
          conversationId={previewId}
          title={previewTitle}
          onClose={() => { setPreviewId(null); setPreviewTitle(null) }}
        />
      )}

      {/* Delete confirm dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setDeleteTarget(null)}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-sm w-full shadow-2xl p-6"
            onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-white mb-2">Delete Conversation?</h3>
            <p className="text-xs text-slate-400 mb-1">
              <span className="text-white">{deleteTarget.title ?? 'Untitled'}</span>
            </p>
            <p className="text-xs text-slate-500 mb-5">
              by {deleteTarget.user_name ?? deleteTarget.user_email ?? deleteTarget.user_id}
              <br />This action soft-deletes the conversation and is logged.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm hover:bg-slate-700">
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={deleting}
                className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-500 disabled:opacity-50">
                {deleting ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <MessagesSquare size={22} className="text-blue-400" /> Conversations
        </h1>
        <p className="text-slate-400 text-sm">Moderate user conversations — view threads, soft-delete</p>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by title…"
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-600"
          />
          {searchInput && (
            <button onClick={() => setSearchInput('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <X size={13} />
            </button>
          )}
        </div>
        <span className="self-center text-xs text-slate-500">{total.toLocaleString()} total</span>
      </div>

      {/* Table */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">User</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Title</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Msgs</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Last Updated</th>
                <th className="px-4 py-3 text-xs text-slate-400 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  <Loader2 size={18} className="animate-spin inline mr-2" />Loading…
                </td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">No conversations found</td></tr>
              ) : rows.map(row => (
                <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-white text-xs font-medium truncate max-w-[140px]">
                      {row.user_name ?? 'No name'}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{row.user_email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-300 max-w-[200px] truncate">
                    {row.title ?? <span className="text-slate-600 italic">Untitled</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{row.message_count_hint}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(row.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setPreviewId(row.id); setPreviewTitle(row.title) }}
                        title="View messages"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-600/10 transition-colors"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(row)}
                        title="Delete conversation"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-600/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
          <span>
            {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </span>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 bg-slate-800 border border-white/10 rounded text-white disabled:opacity-30">
              Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
              className="px-3 py-1.5 bg-slate-800 border border-white/10 rounded text-white disabled:opacity-30">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
