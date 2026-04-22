'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  MessageCircle, ExternalLink, Loader2, CheckCircle2, XCircle,
  Send, Pencil, SkipForward, AlertTriangle, ChevronDown, ChevronUp,
  Zap, Clock, Wifi
} from 'lucide-react'

type FbPage = { id: string; label: string; status: string }

type CommentReply = {
  id: string
  draft_text: string
  status: string
  classification: {
    intent?: string
    urgency?: string
    crisis_flag?: boolean
    relevance?: number
    needs_reply?: boolean
  } | null
  mcp_sources: Array<{ id: string; score: number; preview: string }> | null
  comment: {
    id: string
    content: string
    author_name: string | null
    comment_url: string | null
    posted_at: string | null
    intent: string | null
    urgency: string | null
    classification: { suggested_angle?: string } | null
    post: {
      id: string
      content: string
      fb_post_url: string | null
      source: { label: string } | null
    } | null
  } | null
}

const URGENCY_COLOR: Record<string, string> = {
  high:   'text-red-400 border-red-500/30 bg-red-500/10',
  medium: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
  low:    'text-green-400 border-green-500/30 bg-green-500/10',
}

const INTENT_LABEL: Record<string, string> = {
  seeking_info:       '🔍 Tìm thông tin',
  asking_question:    '❓ Đặt câu hỏi',
  sharing_experience: '💬 Chia sẻ',
  complaining:        '😤 Phàn nàn',
  other:              '📝 Khác',
}

function Badge({ label, color }: { label: string; color?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${color ?? 'text-slate-400 border-slate-700 bg-slate-800'}`}>
      {label}
    </span>
  )
}

function CommentReplyCard({
  reply, pages, isActive, onClick, onAction,
}: {
  reply: CommentReply
  pages: FbPage[]
  isActive: boolean
  onClick: () => void
  onAction: (id: string, action: 'approve' | 'reject' | 'skip', payload?: { draft_text?: string; page_id?: string }) => void
}) {
  const [editMode, setEditMode] = useState(false)
  const [editText, setEditText] = useState(reply.draft_text)
  const [selectedPageId, setSelectedPageId] = useState(pages.find(p => p.status === 'ONLINE')?.id ?? '')
  const [loading, setLoading] = useState<string | null>(null)
  const [showMcp, setShowMcp] = useState(false)

  const comment = reply.comment
  const urgency = comment?.urgency ?? reply.classification?.urgency ?? 'low'
  const intent = comment?.intent ?? ''

  const handleAction = async (action: 'approve' | 'reject' | 'skip') => {
    setLoading(action)
    try {
      onAction(reply.id, action, { draft_text: editText, page_id: selectedPageId })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-4 cursor-pointer transition-all ${
        isActive ? 'border-blue-500/50 bg-slate-800' : 'border-slate-800 bg-slate-900 hover:border-slate-700'
      }`}
    >
      {/* Post context (collapsed) */}
      {comment?.post && (
        <div className="text-xs text-slate-600 mb-2 flex items-center gap-2">
          <span className="shrink-0">📋 {comment.post.source?.label ?? '—'}</span>
          <span className="truncate italic">"{comment.post.content.slice(0, 80)}..."</span>
          {comment.post.fb_post_url && (
            <a href={comment.post.fb_post_url} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="shrink-0 text-slate-600 hover:text-blue-400">
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}

      {/* Comment */}
      <div className="flex items-start gap-3 mb-3">
        <MessageCircle className="h-4 w-4 text-blue-400 shrink-0 mt-1" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-medium text-slate-300">
              {comment?.author_name ?? 'Unknown'}
            </span>
            {comment?.posted_at && (
              <span className="text-xs text-slate-600">
                · {new Date(comment.posted_at).toLocaleDateString('vi-VN')}
              </span>
            )}
            {intent && <Badge label={INTENT_LABEL[intent] ?? intent} />}
            {urgency && <Badge label={urgency} color={URGENCY_COLOR[urgency]} />}
            <span className="ml-auto shrink-0">
              {comment?.comment_url && (
                <a href={comment.comment_url} target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="text-slate-600 hover:text-blue-400">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </span>
          </div>
          <p className="text-sm text-slate-200">{comment?.content}</p>
          {comment?.classification?.suggested_angle && (
            <p className="text-xs text-slate-500 mt-1 italic">
              💡 {comment.classification.suggested_angle}
            </p>
          )}
        </div>
      </div>

      {isActive && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          {/* Draft reply */}
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
            <p className="text-sm text-slate-300 bg-slate-800/50 rounded-lg p-3 whitespace-pre-wrap">{editText}</p>
          )}

          {/* MCP sources */}
          {reply.mcp_sources && reply.mcp_sources.length > 0 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); setShowMcp(m => !m) }}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 mt-2 transition-colors"
              >
                {showMcp ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {reply.mcp_sources.length} knowledge sources
              </button>
              {showMcp && (
                <div className="mt-2 space-y-1.5" onClick={e => e.stopPropagation()}>
                  {reply.mcp_sources.map((s, i) => (
                    <div key={i} className="rounded p-2 bg-slate-800/70 border border-slate-700 text-xs">
                      <span className="text-blue-400 mr-2">{(s.score * 100).toFixed(0)}%</span>
                      <span className="text-slate-400">{s.preview}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Page selector + actions */}
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
            >
              {loading === 'approve' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Reply
            </button>

            <button
              onClick={() => handleAction('reject')}
              disabled={loading !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-500 disabled:opacity-40 text-sm font-medium transition-colors"
            >
              {loading === 'reject' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
              Reject
            </button>

            <button
              onClick={() => handleAction('skip')}
              disabled={loading !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-sm font-medium transition-colors"
            >
              <SkipForward className="h-3.5 w-3.5" />
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CommentInboxPage() {
  const [replies, setReplies] = useState<CommentReply[]>([])
  const [pages, setPages] = useState<FbPage[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const loadReplies = useCallback(async () => {
    const { data } = await supabase
      .from('fb_replies')
      .select(`
        id, draft_text, status, classification, mcp_sources,
        comment:fb_comments(
          id, content, author_name, comment_url, posted_at, intent, urgency, classification,
          post:fb_posts(id, content, fb_post_url, source:fb_target_sources(label))
        )
      `)
      .eq('status', 'DRAFT')
      .not('comment_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50)

    setReplies((data as unknown as CommentReply[]) ?? [])
    if (data?.length && !activeId) setActiveId((data[0] as unknown as CommentReply).id)
    setLoading(false)
  }, [supabase, activeId])

  useEffect(() => {
    void loadReplies()
    fetch('/api/social-listening/pages').then(r => r.json()).then(d => setPages(d.pages ?? []))

    const channel = supabase
      .channel('comment-replies-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fb_replies' },
        () => void loadReplies())
      .subscribe(s => setConnected(s === 'SUBSCRIBED'))

    return () => { void supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAction = useCallback(async (
    id: string,
    action: 'approve' | 'reject' | 'skip',
    payload?: { draft_text?: string; page_id?: string },
  ) => {
    if (action === 'approve') {
      if (payload?.draft_text) {
        await fetch(`/api/social-listening/replies/${id}/reject`, {
          method: 'PATCH', body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        })
      }
      const res = await fetch(`/api/social-listening/replies/${id}/approve`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        alert(`Reply thất bại: ${err.error ?? 'Unknown'}`)
        await loadReplies()
        return
      }
    } else if (action === 'reject') {
      await fetch(`/api/social-listening/replies/${id}/reject`, { method: 'POST' })
    }

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
      <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur border-b border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-400" />
              Comment Inbox
              {replies.length > 0 && (
                <span className="ml-1 inline-flex items-center gap-1 text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-medium">
                  <Zap className="h-3 w-3" />
                  {replies.length} cần reply
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comments được LLM lọc — chỉ hiện những comment đang cần thông tin
            </p>
          </div>
          <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${
            connected
              ? 'text-green-400 border-green-500/30 bg-green-500/10'
              : 'text-slate-400 border-slate-700 bg-slate-800'
          }`}>
            <Wifi className="h-3 w-3" />
            {connected ? 'Live' : 'Connecting...'}
          </div>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="flex gap-4 mt-3 text-xs text-slate-500">
            <span>{replies.filter(r => r.comment?.urgency === 'high').length} <span className="text-red-400">high urgency</span></span>
            <span>{replies.filter(r => r.comment?.intent === 'seeking_info').length} <span className="text-blue-400">tìm thông tin</span></span>
            <span>{replies.filter(r => r.comment?.intent === 'asking_question').length} <span className="text-yellow-400">đặt câu hỏi</span></span>
          </div>
        )}
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center gap-3 text-slate-500 py-12 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" /> Đang tải...
          </div>
        ) : replies.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500/30" />
            <p className="font-medium">Không có comment nào cần reply!</p>
            <p className="text-sm mt-1">LLM sẽ tự động phân loại comments mới từ các bài viết vừa scrape.</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-3xl">
            {/* High urgency first */}
            {replies.filter(r => r.comment?.urgency === 'high').length > 0 && (
              <div className="text-xs font-semibold text-red-400 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="h-3 w-3" /> High urgency
              </div>
            )}
            {replies.map(reply => (
              <CommentReplyCard
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
