'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  CheckCircle2, XCircle, Pencil, AlertTriangle, ExternalLink,
  SkipForward, ChevronDown, ChevronUp, Send, Loader2
} from 'lucide-react'

type Classification = {
  relevance: number
  topic: string
  urgency: string
  intent: string
  crisis_flag: boolean
}

type McpSource = { id: string; score: number; preview: string }

type Reply = {
  id: string
  draft_text: string
  status: string
  classification: Classification | null
  mcp_sources: McpSource[] | null
  post: {
    id: string
    content: string
    fb_post_url: string | null
    image_urls: string[]
    author_name: string | null
    posted_at: string | null
    source: { label: string } | null
  } | null
}

type FbPage = { id: string; label: string; status: string }

const URGENCY_COLORS: Record<string, string> = {
  high: 'text-red-400 border-red-500/30 bg-red-500/10',
  medium: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
  low: 'text-green-400 border-green-500/30 bg-green-500/10',
}

function Badge({ label, color }: { label: string; color?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${color ?? 'text-slate-400 border-slate-700 bg-slate-800'}`}>
      {label}
    </span>
  )
}

function ReviewCard({
  reply,
  pages,
  onAction,
  isActive,
  onClick,
}: {
  reply: Reply
  pages: FbPage[]
  onAction: (id: string, action: 'approve' | 'reject' | 'skip', payload?: { draft_text?: string; page_id?: string }) => void
  isActive: boolean
  onClick: () => void
}) {
  const [editMode, setEditMode] = useState(false)
  const [editText, setEditText] = useState(reply.draft_text)
  const [selectedPageId, setSelectedPageId] = useState(pages.find(p => p.status === 'ONLINE')?.id ?? '')
  const [showMcp, setShowMcp] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  const post = reply.post
  const cls = reply.classification

  const handleAction = async (action: 'approve' | 'reject' | 'skip') => {
    setLoading(action)
    try {
      if (action === 'approve' && editMode) {
        // Save edit first
        await fetch(`/api/social-listening/replies/${reply.id}/reject`, {
          method: 'PATCH',
          body: JSON.stringify({ draft_text: editText, page_id: selectedPageId }),
          headers: { 'Content-Type': 'application/json' },
        })
      }
      onAction(reply.id, action, { draft_text: editText, page_id: selectedPageId })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-4 cursor-pointer transition-all ${
        isActive
          ? 'border-blue-500/50 bg-slate-800'
          : reply.classification?.crisis_flag
          ? 'border-red-500/30 bg-red-950/20 hover:border-red-500/50'
          : 'border-slate-800 bg-slate-900 hover:border-slate-700'
      }`}
    >
      {/* Crisis banner */}
      {cls?.crisis_flag && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
          <span className="text-xs text-red-300 font-medium">CRISIS FLAG — Bắt buộc review trước</span>
        </div>
      )}

      {/* Post meta */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="text-xs text-slate-500 mb-1">
            {post?.source?.label ?? '—'} · {post?.author_name ?? 'Unknown'}
            {post?.posted_at && ` · ${new Date(post.posted_at).toLocaleDateString('vi-VN')}`}
          </div>
          <p className="text-sm text-slate-300 line-clamp-3">{post?.content}</p>
        </div>
        {post?.fb_post_url && (
          <a href={post.fb_post_url} target="_blank" rel="noopener noreferrer"
            className="shrink-0 text-slate-500 hover:text-blue-400 mt-0.5"
            onClick={e => e.stopPropagation()}>
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      {/* Classification badges */}
      {cls && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge label={cls.topic.replace('_', ' ')} />
          <Badge label={`urgency: ${cls.urgency}`} color={URGENCY_COLORS[cls.urgency]} />
          <Badge label={`${Math.round(cls.relevance * 100)}% relevant`} />
          {cls.intent !== 'other' && <Badge label={cls.intent.replace('_', ' ')} />}
        </div>
      )}

      {isActive && (
        <>
          {/* Draft reply editor */}
          <div className="mt-3 pt-3 border-t border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Draft Reply</span>
              <button
                onClick={e => { e.stopPropagation(); setEditMode(m => !m) }}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Pencil className="h-3 w-3" />{editMode ? 'Preview' : 'Edit'}
              </button>
            </div>

            {editMode ? (
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                onClick={e => e.stopPropagation()}
                rows={4}
                className="w-full rounded-lg bg-slate-800 border border-slate-600 text-sm text-slate-200 p-3 resize-none focus:outline-none focus:border-blue-500"
              />
            ) : (
              <p className="text-sm text-slate-300 bg-slate-800/50 rounded-lg p-3 whitespace-pre-wrap">
                {editText}
              </p>
            )}

            {/* MCP Sources */}
            {reply.mcp_sources && reply.mcp_sources.length > 0 && (
              <button
                onClick={e => { e.stopPropagation(); setShowMcp(m => !m) }}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 mt-2 transition-colors"
              >
                {showMcp ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {reply.mcp_sources.length} knowledge sources
              </button>
            )}
            {showMcp && reply.mcp_sources && (
              <div className="mt-2 space-y-2" onClick={e => e.stopPropagation()}>
                {reply.mcp_sources.map((s, i) => (
                  <div key={i} className="rounded p-2 bg-slate-800/70 border border-slate-700">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">Source {i + 1}</span>
                      <span className="text-xs text-blue-400">{(s.score * 100).toFixed(0)}%</span>
                    </div>
                    <p className="text-xs text-slate-400">{s.preview}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Page selector + action buttons */}
            <div className="flex flex-wrap items-center gap-2 mt-4" onClick={e => e.stopPropagation()}>
              <select
                value={selectedPageId}
                onChange={e => setSelectedPageId(e.target.value)}
                className="flex-1 min-w-0 rounded-lg bg-slate-800 border border-slate-600 text-sm text-slate-300 px-3 py-1.5 focus:outline-none focus:border-blue-500"
              >
                <option value="">Chọn fanpage...</option>
                {pages.filter(p => p.status === 'ONLINE').map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>

              <button
                onClick={() => handleAction('approve')}
                disabled={!selectedPageId || loading !== null}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-40 text-sm font-medium transition-colors"
                title="Approve & Post (A)"
              >
                {loading === 'approve' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Post
              </button>

              <button
                onClick={() => handleAction('reject')}
                disabled={loading !== null}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-500 disabled:opacity-40 text-sm font-medium transition-colors"
                title="Reject (R)"
              >
                {loading === 'reject' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                Reject
              </button>

              <button
                onClick={() => handleAction('skip')}
                disabled={loading !== null}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-sm font-medium transition-colors"
                title="Skip (S)"
              >
                <SkipForward className="h-3.5 w-3.5" />
                Skip
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function ReviewQueuePage() {
  const [replies, setReplies] = useState<Reply[]>([])
  const [pages, setPages] = useState<FbPage[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const loadReplies = useCallback(async () => {
    const { data } = await supabase
      .from('fb_replies')
      .select(`
        id, draft_text, status, classification, mcp_sources,
        post:fb_posts(id, content, fb_post_url, image_urls, author_name, posted_at,
          source:fb_target_sources(label))
      `)
      .eq('status', 'DRAFT')
      .order('created_at', { ascending: false })
      .limit(50)

    setReplies((data as unknown as Reply[]) ?? [])
    if (data?.length && !activeId) setActiveId((data[0] as unknown as Reply).id)
    setLoading(false)
  }, [supabase, activeId])

  useEffect(() => {
    void loadReplies()

    // Load pages
    fetch('/api/social-listening/pages')
      .then(r => r.json())
      .then(d => setPages(d.pages ?? []))

    // Supabase Realtime
    const channel = supabase
      .channel('fb_replies_changes')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'fb_replies',
      }, () => void loadReplies())
      .subscribe()

    // Keyboard shortcuts
    const handler = (e: KeyboardEvent) => {
      const active = replies.find(r => r.id === activeId)
      if (!active || e.target instanceof HTMLTextAreaElement) return

      if (e.key === 'A' || e.key === 'a') {
        document.getElementById(`btn-approve-${activeId}`)?.click()
      } else if (e.key === 'R' || e.key === 'r') {
        document.getElementById(`btn-reject-${activeId}`)?.click()
      } else if (e.key === 'S' || e.key === 's') {
        // move to next
        const idx = replies.findIndex(r => r.id === activeId)
        if (idx < replies.length - 1) setActiveId(replies[idx + 1].id)
      }
    }
    window.addEventListener('keydown', handler)

    return () => {
      void supabase.removeChannel(channel)
      window.removeEventListener('keydown', handler)
    }
  }, [loadReplies, replies, activeId, supabase])

  const handleAction = useCallback(async (
    id: string,
    action: 'approve' | 'reject' | 'skip',
    payload?: { draft_text?: string; page_id?: string },
  ) => {
    if (action === 'approve') {
      // Save edit if needed
      if (payload?.draft_text) {
        await fetch(`/api/social-listening/replies/${id}/reject`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        })
      }
      const res = await fetch(`/api/social-listening/replies/${id}/approve`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        alert(`Đăng thất bại: ${err.error ?? 'Unknown error'}`)
        await loadReplies()
        return
      }
    } else if (action === 'reject') {
      await fetch(`/api/social-listening/replies/${id}/reject`, { method: 'POST' })
    }
    // Remove from list + advance
    setReplies(prev => {
      const idx = prev.findIndex(r => r.id === id)
      const next = prev.filter(r => r.id !== id)
      if (next.length > 0) setActiveId(next[Math.min(idx, next.length - 1)].id)
      else setActiveId(null)
      return next
    })
  }, [loadReplies])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top bar */}
      <div className="border-b border-slate-800 px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-400" /> Review Queue
          </h1>
          <p className="text-xs text-slate-500">
            {replies.length} drafts pending · Keyboard: <kbd className="bg-slate-800 px-1 rounded text-xs">A</kbd> approve · <kbd className="bg-slate-800 px-1 rounded text-xs">R</kbd> reject · <kbd className="bg-slate-800 px-1 rounded text-xs">S</kbd> skip
          </p>
        </div>
      </div>

      <div className="p-8">
        {loading ? (
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading drafts...
          </div>
        ) : replies.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500/30" />
            <p className="font-medium">Không có draft nào cần duyệt!</p>
            <p className="text-sm mt-1">Hệ thống đang chờ bài viết mới từ các nguồn.</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-3xl">
            {replies.map(reply => (
              <ReviewCard
                key={reply.id}
                reply={reply}
                pages={pages}
                isActive={reply.id === activeId}
                onClick={() => setActiveId(reply.id)}
                onAction={handleAction}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
