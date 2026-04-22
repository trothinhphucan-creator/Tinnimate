'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Radio, Plus, LogIn, LogOut, RefreshCw, Loader2, AlertCircle,
  CheckCircle2, X, Terminal, ImageIcon, Clock, Info,
} from 'lucide-react'

type FbPage = {
  id: string
  label: string
  fb_user_id: string | null
  status: 'IDLE' | 'CONNECTING' | 'ONLINE' | 'ERROR' | 'LOGGED_OUT'
  last_active_at: string | null
  last_error: string | null
}

type LoginLogEntry = { ts: string; level: 'info' | 'warn' | 'error'; msg: string }

type LoginStatus = {
  loginId: string
  pageId: string
  label: string
  status: 'PENDING' | 'AWAITING_USER' | 'WAITING_2FA' | 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'NEEDS_HELPER'
  currentInstruction: string
  logs: LoginLogEntry[]
  hasScreenshot: boolean
  errorMessage: string | null
  startedAt: string
}

const STATUS_COLORS: Record<string, string> = {
  ONLINE: 'text-green-400 bg-green-400/10 border-green-500/30',
  CONNECTING: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/30',
  OFFLINE: 'text-slate-400 bg-slate-400/10 border-slate-500/30',
  IDLE: 'text-slate-400 bg-slate-400/10 border-slate-500/30',
  LOGGED_OUT: 'text-red-400 bg-red-400/10 border-red-500/30',
  ERROR: 'text-red-400 bg-red-400/10 border-red-500/30',
}

const LOGIN_STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-slate-500/20 text-slate-300',
  AWAITING_USER: 'bg-blue-500/20 text-blue-300',
  WAITING_2FA: 'bg-amber-500/20 text-amber-300',
  SUCCESS: 'bg-green-500/20 text-green-300',
  FAILED: 'bg-red-500/20 text-red-300',
  TIMEOUT: 'bg-red-500/20 text-red-300',
  NEEDS_HELPER: 'bg-purple-500/20 text-purple-300',
}

const LOG_LEVEL_COLOR: Record<string, string> = {
  info: 'text-slate-400',
  warn: 'text-amber-400',
  error: 'text-red-400',
}

// ── Login Modal ──────────────────────────────────────────────────────────────

function LoginModal({
  pageId,
  loginId,
  onClose,
}: {
  pageId: string
  loginId: string
  onClose: () => void
}) {
  const [status, setStatus] = useState<LoginStatus | null>(null)
  const [imgTs, setImgTs] = useState(Date.now())
  const logsRef = useRef<HTMLDivElement>(null)

  // Poll status every 2s
  useEffect(() => {
    let cancelled = false
    async function poll() {
      while (!cancelled) {
        const res = await fetch(`/api/social-listening/pages/${pageId}/login-status?loginId=${loginId}`)
        if (res.ok) {
          const j = await res.json() as LoginStatus
          setStatus(j)
          if (j.status === 'SUCCESS' || j.status === 'FAILED' || j.status === 'TIMEOUT' || j.status === 'NEEDS_HELPER') {
            return
          }
        }
        await new Promise(r => setTimeout(r, 2_000))
      }
    }
    void poll()
    return () => { cancelled = true }
  }, [pageId, loginId])

  // Refresh screenshot every 3s (cache-bust)
  useEffect(() => {
    if (status?.status === 'SUCCESS' || status?.status === 'FAILED' || status?.status === 'TIMEOUT') return
    const t = setInterval(() => setImgTs(Date.now()), 3_000)
    return () => clearInterval(t)
  }, [status?.status])

  // Auto-scroll log container
  useEffect(() => {
    logsRef.current?.scrollTo({ top: logsRef.current.scrollHeight, behavior: 'smooth' })
  }, [status?.logs?.length])

  const isTerminal = status?.status === 'SUCCESS' || status?.status === 'FAILED' ||
    status?.status === 'TIMEOUT' || status?.status === 'NEEDS_HELPER'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
      <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <LogIn className="h-5 w-5 text-blue-400" />
            <div>
              <div className="font-semibold">Đăng nhập Facebook</div>
              <div className="text-xs text-slate-500">Login ID: {loginId}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {status && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${LOGIN_STATUS_BADGE[status.status]}`}>
                {status.status}
              </span>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-white" title="Đóng">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {!status ? (
            <div className="flex items-center gap-2 text-slate-500 py-12 justify-center">
              <Loader2 className="h-5 w-5 animate-spin" /> Đang khởi tạo session...
            </div>
          ) : (
            <>
              {/* Instruction box */}
              <div className="mb-4 rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 flex gap-3">
                <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-sm whitespace-pre-wrap text-slate-200">{status.currentInstruction}</div>
              </div>

              {/* NEEDS_HELPER → highlight code block */}
              {status.status === 'NEEDS_HELPER' && (
                <div className="mb-4 rounded-lg border border-purple-500/30 bg-purple-500/5 p-4">
                  <div className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
                    <Terminal className="h-4 w-4" /> Lệnh gợi ý
                  </div>
                  <pre className="text-xs bg-slate-950 rounded p-3 overflow-x-auto text-purple-200">
{`# Trên laptop dev có GUI:
cd worker
npm run login:helper -- --pageId=${pageId}`}
                  </pre>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Screenshot panel */}
                <div className="rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800 text-xs text-slate-500">
                    <ImageIcon className="h-3.5 w-3.5" /> Browser screenshot (refresh 3s)
                  </div>
                  <div className="aspect-video bg-slate-950 flex items-center justify-center">
                    {status.hasScreenshot ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/social-listening/pages/${pageId}/login-screenshot?loginId=${loginId}&ts=${imgTs}`}
                        alt="Browser preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-xs text-slate-600 text-center px-4">
                        {isTerminal ? 'Browser đã đóng — không còn screenshot.' : 'Đang chờ frame đầu tiên...'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Logs panel */}
                <div className="rounded-lg border border-slate-800 bg-slate-950 overflow-hidden flex flex-col">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800 text-xs text-slate-500">
                    <Terminal className="h-3.5 w-3.5" /> Execution log ({status.logs.length})
                  </div>
                  <div ref={logsRef} className="font-mono text-xs p-3 max-h-80 overflow-y-auto space-y-1">
                    {status.logs.length === 0 ? (
                      <div className="text-slate-600 text-center py-4">No log entries yet</div>
                    ) : (
                      status.logs.map((l, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-slate-600 shrink-0">
                            {new Date(l.ts).toLocaleTimeString('vi-VN', { hour12: false })}
                          </span>
                          <span className={`uppercase shrink-0 w-12 ${LOG_LEVEL_COLOR[l.level]}`}>
                            {l.level}
                          </span>
                          <span className="text-slate-300 break-all">{l.msg}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {status.errorMessage && (
                <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300 flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{status.errorMessage}</span>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Bắt đầu: {new Date(status.startedAt).toLocaleString('vi-VN')}
                </div>
                {isTerminal && (
                  <button onClick={onClose} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm text-white font-medium">
                    Đóng
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FanpagesAdminPage() {
  const [pages, setPages] = useState<FbPage[]>([])
  const [loading, setLoading] = useState(true)
  const [newLabel, setNewLabel] = useState('')
  const [creating, setCreating] = useState(false)
  const [busyPage, setBusyPage] = useState<string | null>(null)
  const [activeLogin, setActiveLogin] = useState<{ pageId: string; loginId: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/social-listening/pages')
    const j = await res.json() as { pages?: FbPage[] }
    setPages(j.pages ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  // Refresh page list khi đóng modal (status có thể đã đổi)
  function closeModal() {
    setActiveLogin(null)
    void load()
  }

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
        alert(`Login khởi tạo thất bại: ${j.error ?? 'unknown'}`)
        return
      }
      setActiveLogin({ pageId: p.id, loginId: j.loginId })
    } finally { setBusyPage(null) }
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
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${STATUS_COLORS[p.status] ?? STATUS_COLORS['IDLE']}`}>
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

      {activeLogin && (
        <LoginModal pageId={activeLogin.pageId} loginId={activeLogin.loginId} onClose={closeModal} />
      )}
    </div>
  )
}
