'use client'

import { useState, useEffect, useCallback } from 'react'
import { History, ExternalLink, Loader2, Filter, RefreshCw, AlertTriangle } from 'lucide-react'

type ReplyHistory = {
  id: string
  draft_text: string
  status: 'DRAFT' | 'APPROVED' | 'POSTED' | 'REJECTED' | 'FAILED'
  posted_at: string | null
  post_error: string | null
  created_at: string
  classification: { topic?: string; urgency?: string; crisis_flag?: boolean } | null
  post: {
    id: string
    content: string
    fb_post_url: string | null
    author_name: string | null
    posted_at: string | null
    source: { label: string } | null
  } | null
  page: { label: string } | null
}

const STATUS_BADGE: Record<string, string> = {
  POSTED: 'text-green-400 bg-green-500/10 border-green-500/30',
  REJECTED: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
  FAILED: 'text-red-400 bg-red-500/10 border-red-500/30',
  DRAFT: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  APPROVED: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
}

type Filters = 'ALL' | 'POSTED' | 'REJECTED' | 'FAILED' | 'CRISIS'

export default function HistoryPage() {
  const [items, setItems] = useState<ReplyHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filters>('ALL')

  const load = useCallback(async () => {
    setLoading(true)
    const qs = filter === 'ALL' ? '' : `?filter=${filter}`
    const res = await fetch(`/api/social-listening/history${qs}`)
    const j = await res.json() as { items?: ReplyHistory[] }
    setItems(j.items ?? [])
    setLoading(false)
  }, [filter])

  useEffect(() => { void load() }, [load])

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6 text-blue-400" /> History
          </h1>
          <p className="text-sm text-slate-400 mt-1">Lịch sử reply đã đăng / bị từ chối / lỗi</p>
        </div>
        <div className="flex gap-2 items-center">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as Filters)}
            className="text-sm rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Tất cả</option>
            <option value="POSTED">Đã đăng</option>
            <option value="REJECTED">Bị từ chối</option>
            <option value="FAILED">Lỗi đăng</option>
            <option value="CRISIS">Crisis flag</option>
          </select>
          <button onClick={() => void load()} className="text-sm flex items-center gap-1.5 text-slate-400 hover:text-white">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Chưa có dữ liệu lịch sử cho filter này.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(it => (
            <div key={it.id} className={`rounded-xl border p-4 ${
              it.classification?.crisis_flag ? 'border-red-500/30 bg-red-950/10' : 'border-slate-800 bg-slate-900'
            }`}>
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="text-xs text-slate-500 min-w-0">
                  {it.post?.source?.label ?? '—'} · {it.post?.author_name ?? 'Unknown'} ·{' '}
                  {new Date(it.created_at).toLocaleString('vi-VN')}
                  {it.page?.label && <> · <span className="text-blue-400">{it.page.label}</span></>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded border font-medium shrink-0 ${STATUS_BADGE[it.status]}`}>
                  {it.status}
                </span>
              </div>

              {it.classification?.crisis_flag && (
                <div className="flex items-center gap-1.5 text-xs text-red-400 mb-2">
                  <AlertTriangle className="h-3.5 w-3.5" /> CRISIS FLAG
                </div>
              )}

              {/* Original post snippet */}
              {it.post?.content && (
                <div className="text-xs text-slate-400 line-clamp-2 mb-2 italic">
                  &ldquo;{it.post.content}&rdquo;
                </div>
              )}

              {/* Reply text */}
              <div className="text-sm text-slate-200 bg-slate-800/50 rounded-lg p-3 whitespace-pre-wrap mb-2">
                {it.draft_text}
              </div>

              {/* Footer meta */}
              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex gap-3">
                  {it.classification?.topic && <span>topic: {it.classification.topic}</span>}
                  {it.classification?.urgency && <span>urgency: {it.classification.urgency}</span>}
                  {it.posted_at && <span>posted: {new Date(it.posted_at).toLocaleString('vi-VN')}</span>}
                </div>
                {it.post?.fb_post_url && (
                  <a href={it.post.fb_post_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-blue-400">
                    Mở post <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {it.post_error && (
                <div className="mt-2 text-xs text-red-400 bg-red-500/10 rounded p-2">
                  {it.post_error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
