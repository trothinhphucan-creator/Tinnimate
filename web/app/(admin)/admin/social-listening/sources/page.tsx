'use client'

import { useState, useEffect, useCallback } from 'react'
import { Rss, Plus, Trash2, Loader2, Play, Pause, ExternalLink, RefreshCw } from 'lucide-react'

type Source = {
  id: string
  type: 'GROUP' | 'PAGE' | 'KEYWORD_SEARCH'
  label: string
  fb_url: string | null
  keywords: string[]
  enabled: boolean
  last_scraped_at: string | null
  page_id: string | null
}

type FbPage = { id: string; label: string; status: string }

const TYPE_COLORS: Record<string, string> = {
  GROUP: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  PAGE: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  KEYWORD_SEARCH: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
}

export default function SourcesAdminPage() {
  const [sources, setSources] = useState<Source[]>([])
  const [pages, setPages] = useState<FbPage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [label, setLabel] = useState('')
  const [type, setType] = useState<Source['type']>('GROUP')
  const [fbUrl, setFbUrl] = useState('')
  const [keywords, setKeywords] = useState('ù tai, tinnitus, mất ngủ do ù tai')
  const [pageId, setPageId] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const [sResp, pResp] = await Promise.all([
      fetch('/api/social-listening/sources'),
      fetch('/api/social-listening/pages'),
    ])
    const sJ = await sResp.json() as { sources?: Source[] }
    const pJ = await pResp.json() as { pages?: FbPage[] }
    setSources(sJ.sources ?? [])
    setPages(pJ.pages ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim()) return
    setSaving(true)
    try {
      const body = {
        label: label.trim(),
        type,
        fb_url: fbUrl.trim() || null,
        keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
        page_id: pageId || null,
      }
      const res = await fetch('/api/social-listening/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const j = await res.json() as { error?: string }
        alert(`Lỗi: ${j.error}`)
      } else {
        setLabel(''); setFbUrl(''); setPageId('')
        await load()
      }
    } finally { setSaving(false) }
  }

  async function toggleEnabled(s: Source) {
    await fetch('/api/social-listening/sources', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, enabled: !s.enabled }),
    })
    await load()
  }

  async function handleDelete(s: Source) {
    if (!confirm(`Xóa "${s.label}"?`)) return
    await fetch(`/api/social-listening/sources?id=${s.id}`, { method: 'DELETE' })
    await load()
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Rss className="h-6 w-6 text-blue-400" /> Sources
          </h1>
          <p className="text-sm text-slate-400 mt-1">Nhóm / page / keyword search để scrape bài viết về ù tai</p>
        </div>
        <button onClick={() => void load()} className="text-sm flex items-center gap-1.5 text-slate-400 hover:text-white">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Create form */}
      <form onSubmit={handleCreate} className="mb-8 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="text-sm font-semibold text-slate-300 mb-3">Thêm source mới</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Label (vd: Nhóm ù tai VN)"
            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <select
            value={type}
            onChange={e => setType(e.target.value as Source['type'])}
            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="GROUP">GROUP — Nhóm Facebook</option>
            <option value="PAGE">PAGE — Trang Facebook</option>
            <option value="KEYWORD_SEARCH">KEYWORD_SEARCH — Tìm theo keyword</option>
          </select>
          <input
            value={fbUrl}
            onChange={e => setFbUrl(e.target.value)}
            placeholder={type === 'KEYWORD_SEARCH' ? '(bỏ trống nếu dùng keyword)' : 'https://facebook.com/groups/...'}
            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <select
            value={pageId}
            onChange={e => setPageId(e.target.value)}
            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">-- Không gán fanpage cụ thể --</option>
            {pages.map(p => (
              <option key={p.id} value={p.id}>{p.label} ({p.status})</option>
            ))}
          </select>
        </div>
        <input
          value={keywords}
          onChange={e => setKeywords(e.target.value)}
          placeholder="Keywords ngăn cách bởi dấu phẩy"
          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm mb-3 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={saving || !label.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-sm font-medium"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Thêm source
        </button>
      </form>

      {/* Sources list */}
      {loading ? (
        <div className="flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
      ) : sources.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Rss className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Chưa có source nào.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sources.map(s => (
            <div key={s.id} className={`rounded-xl border p-4 ${s.enabled ? 'border-slate-700 bg-slate-900' : 'border-slate-800 bg-slate-900/50 opacity-60'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${TYPE_COLORS[s.type]}`}>
                      {s.type}
                    </span>
                    <span className="font-medium text-sm">{s.label}</span>
                    {!s.enabled && <span className="text-xs text-slate-500">(disabled)</span>}
                  </div>
                  {s.fb_url && (
                    <a href={s.fb_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline flex items-center gap-1 mb-1">
                      {s.fb_url.length > 80 ? s.fb_url.slice(0, 80) + '…' : s.fb_url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {s.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {s.keywords.map((k, i) => (
                        <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{k}</span>
                      ))}
                    </div>
                  )}
                  {s.last_scraped_at && (
                    <div className="text-xs text-slate-500 mt-2">
                      Scrape lần cuối: {new Date(s.last_scraped_at).toLocaleString('vi-VN')}
                    </div>
                  )}
                </div>

                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => void toggleEnabled(s)}
                    title={s.enabled ? 'Tắt' : 'Bật'}
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                  >
                    {s.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => void handleDelete(s)}
                    title="Xóa"
                    className="p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
