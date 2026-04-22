'use client'

import { useState, useEffect, useCallback } from 'react'
import { Radio, Plus, LogIn, LogOut, RefreshCw, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

type FbPage = {
  id: string
  label: string
  fb_user_id: string | null
  status: 'IDLE' | 'CONNECTING' | 'ONLINE' | 'ERROR' | 'LOGGED_OUT' | 'OFFLINE'
  last_active_at: string | null
  last_error: string | null
}

const STATUS_COLORS: Record<string, string> = {
  ONLINE: 'text-green-400 bg-green-400/10 border-green-500/30',
  CONNECTING: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/30',
  OFFLINE: 'text-slate-400 bg-slate-400/10 border-slate-500/30',
  IDLE: 'text-slate-400 bg-slate-400/10 border-slate-500/30',
  LOGGED_OUT: 'text-red-400 bg-red-400/10 border-red-500/30',
  ERROR: 'text-red-400 bg-red-400/10 border-red-500/30',
}

export default function FanpagesAdminPage() {
  const [pages, setPages] = useState<FbPage[]>([])
  const [loading, setLoading] = useState(true)
  const [newLabel, setNewLabel] = useState('')
  const [creating, setCreating] = useState(false)
  const [busyPage, setBusyPage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/social-listening/pages')
    const j = await res.json() as { pages?: FbPage[] }
    setPages(j.pages ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newLabel.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/social-listening/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLabel.trim() }),
      })
      if (!res.ok) {
        const e = await res.json() as { error?: string }
        alert(`Tạo thất bại: ${e.error}`)
      } else {
        setNewLabel('')
        await load()
      }
    } finally { setCreating(false) }
  }

  async function startLogin(p: FbPage) {
    setBusyPage(p.id)
    try {
      const res = await fetch(`/api/social-listening/pages/${p.id}/login-start`, { method: 'POST' })
      const j = await res.json() as { loginId?: string; error?: string }
      if (!res.ok || !j.loginId) {
        alert(`Login thất bại: ${j.error ?? 'unknown'}`)
        return
      }
      // Poll status mỗi 3s
      pollLoginStatus(p.id, j.loginId)
    } finally { setBusyPage(null) }
  }

  function pollLoginStatus(pageId: string, loginId: string) {
    let tries = 0
    const max = 100 // ~5 phút
    const timer = setInterval(async () => {
      tries++
      const res = await fetch(`/api/social-listening/pages/${pageId}/login-status?loginId=${loginId}`)
      const j = await res.json() as { status?: string; errorMessage?: string }
      if (j.status === 'SUCCESS' || j.status === 'FAILED' || j.status === 'TIMEOUT' || tries > max) {
        clearInterval(timer)
        if (j.status === 'SUCCESS') alert(`✓ Đã đăng nhập thành công`)
        else if (j.status) alert(`Login ${j.status}: ${j.errorMessage ?? ''}`)
        await load()
      }
    }, 3_000)
  }

  async function logout(p: FbPage) {
    if (!confirm(`Đăng xuất "${p.label}"?`)) return
    setBusyPage(p.id)
    try {
      await fetch(`/api/social-listening/pages/${p.id}/logout`, { method: 'POST' })
      await load()
    } finally { setBusyPage(null) }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Radio className="h-6 w-6 text-blue-400" /> Fanpages
          </h1>
          <p className="text-sm text-slate-400 mt-1">Quản lý fanpage Facebook dùng để đăng reply</p>
        </div>
        <button onClick={() => void load()} className="text-sm flex items-center gap-1.5 text-slate-400 hover:text-white">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Add fanpage form */}
      <form onSubmit={handleCreate} className="mb-6 flex gap-2 items-stretch">
        <input
          type="text"
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          placeholder="Tên fanpage (vd: TinniMate Official)"
          className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={creating || !newLabel.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-sm font-medium"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Thêm
        </button>
      </form>

      {/* Pages list */}
      {loading ? (
        <div className="flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
      ) : pages.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Radio className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Chưa có fanpage nào. Thêm fanpage đầu tiên ở trên.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pages.map(p => (
            <div key={p.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <div className="font-medium">{p.label}</div>
                  {p.fb_user_id && <div className="text-xs text-slate-500 mt-0.5">FB ID: {p.fb_user_id}</div>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${STATUS_COLORS[p.status] ?? STATUS_COLORS['OFFLINE']}`}>
                  {p.status}
                </span>
              </div>

              {p.last_error && (
                <div className="text-xs text-red-400 bg-red-500/10 rounded p-2 mb-3 flex gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{p.last_error}</span>
                </div>
              )}

              {p.last_active_at && (
                <div className="text-xs text-slate-500 mb-3">
                  Hoạt động: {new Date(p.last_active_at).toLocaleString('vi-VN')}
                </div>
              )}

              <div className="flex gap-2">
                {p.status === 'ONLINE' ? (
                  <button
                    onClick={() => void logout(p)}
                    disabled={busyPage === p.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Đăng xuất
                  </button>
                ) : (
                  <button
                    onClick={() => void startLogin(p)}
                    disabled={busyPage === p.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-xs font-medium"
                  >
                    {busyPage === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogIn className="h-3.5 w-3.5" />}
                    Đăng nhập
                  </button>
                )}
                {p.status === 'ONLINE' && <CheckCircle2 className="h-4 w-4 text-green-400 ml-auto self-center" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
