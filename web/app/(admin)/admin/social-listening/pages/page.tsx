'use client'
import { useState, useEffect, useCallback } from 'react'
import { Radio, Plus, LogIn, LogOut, RefreshCw, Loader2, AlertCircle, CheckCircle2, X, Terminal, ImageIcon, Clock, Info, Trash2, Pencil, Users } from 'lucide-react'
import { DropdownMenu } from './_dropdown'
import { ScanGroupsModal } from './_scan-groups-modal'

type FbPage = { id: string; label: string; fb_user_id: string | null; status: 'IDLE'|'CONNECTING'|'ONLINE'|'ERROR'|'LOGGED_OUT'; last_active_at: string | null; last_error: string | null; fb_page_url?: string | null }
type LoginLogEntry = { ts: string; level: 'info'|'warn'|'error'; msg: string }
type LoginStatus = { loginId: string; pageId: string; label: string; status: 'PENDING'|'AWAITING_USER'|'WAITING_2FA'|'SUCCESS'|'FAILED'|'TIMEOUT'|'NEEDS_HELPER'; currentInstruction: string; logs: LoginLogEntry[]; hasScreenshot: boolean; errorMessage: string | null; startedAt: string }

const SC: Record<string,string> = { ONLINE:'text-green-400 bg-green-400/10 border-green-500/30', CONNECTING:'text-yellow-400 bg-yellow-400/10 border-yellow-500/30', IDLE:'text-slate-400 bg-slate-400/10 border-slate-500/30', LOGGED_OUT:'text-red-400 bg-red-400/10 border-red-500/30', ERROR:'text-red-400 bg-red-400/10 border-red-500/30' }
const LB: Record<string,string> = { PENDING:'bg-slate-500/20 text-slate-300', AWAITING_USER:'bg-blue-500/20 text-blue-300', WAITING_2FA:'bg-amber-500/20 text-amber-300', SUCCESS:'bg-green-500/20 text-green-300', FAILED:'bg-red-500/20 text-red-300', TIMEOUT:'bg-red-500/20 text-red-300', NEEDS_HELPER:'bg-purple-500/20 text-purple-300' }

function LoginModal({ pageId, loginId, onClose }: { pageId: string; loginId: string; onClose: () => void }) {
  const [status, setStatus] = useState<LoginStatus | null>(null)
  const [imgTs, setImgTs] = useState(Date.now())
  const isTerminal = status && ['SUCCESS','FAILED','TIMEOUT','NEEDS_HELPER'].includes(status.status)
  useEffect(() => {
    let cancelled = false
    async function poll() {
      while (!cancelled) {
        const r = await fetch(`/api/social-listening/pages/${pageId}/login-status?loginId=${loginId}`)
        if (r.ok) { const j = await r.json() as LoginStatus; setStatus(j); if (['SUCCESS','FAILED','TIMEOUT','NEEDS_HELPER'].includes(j.status)) return }
        await new Promise(r => setTimeout(r, 2000))
      }
    }
    void poll(); return () => { cancelled = true }
  }, [pageId, loginId])
  useEffect(() => { if (isTerminal) return; const t = setInterval(() => setImgTs(Date.now()), 3000); return () => clearInterval(t) }, [isTerminal])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-auto flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3"><LogIn className="h-5 w-5 text-blue-400" /><div><div className="font-semibold">Đăng nhập Facebook</div><div className="text-xs text-slate-500">{loginId}</div></div></div>
          <div className="flex items-center gap-3">{status && <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${LB[status.status]}`}>{status.status}</span>}<button onClick={onClose} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button></div>
        </div>
        <div className="flex-1 p-6">
          {!status ? <div className="flex items-center gap-2 text-slate-500 py-12 justify-center"><Loader2 className="h-5 w-5 animate-spin" /> Đang khởi tạo...</div> : (
            <>
              <div className="mb-4 rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 flex gap-3"><Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" /><div className="text-sm text-slate-200">{status.currentInstruction}</div></div>
              {status.status === 'NEEDS_HELPER' && <div className="mb-4 rounded-lg border border-purple-500/30 bg-purple-500/5 p-4"><div className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2"><Terminal className="h-4 w-4" /> Lệnh gợi ý</div><pre className="text-xs bg-slate-950 rounded p-3 text-purple-200">{`cd worker\nnpm run login:helper -- --pageId=${pageId}`}</pre></div>}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800 text-xs text-slate-500"><ImageIcon className="h-3.5 w-3.5" /> Screenshot (3s)</div>
                  <div className="aspect-video bg-slate-950 flex items-center justify-center">
                    {status.hasScreenshot ? <img src={`/api/social-listening/pages/${pageId}/login-screenshot?loginId=${loginId}&ts=${imgTs}`} alt="Browser" className="w-full h-full object-contain" /> : <div className="text-xs text-slate-600">{isTerminal ? 'Browser đã đóng' : 'Đang chờ frame đầu tiên...'}</div>}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950 overflow-hidden flex flex-col">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800 text-xs text-slate-500"><Terminal className="h-3.5 w-3.5" /> Log ({status.logs.length})</div>
                  <div className="font-mono text-xs p-3 max-h-72 overflow-y-auto space-y-1">
                    {status.logs.map((l,i) => <div key={i} className="flex gap-2"><span className="text-slate-600 shrink-0">{new Date(l.ts).toLocaleTimeString('vi-VN',{hour12:false})}</span><span className={`uppercase shrink-0 w-12 ${l.level==='error'?'text-red-400':l.level==='warn'?'text-amber-400':'text-slate-400'}`}>{l.level}</span><span className="text-slate-300 break-all">{l.msg}</span></div>)}
                  </div>
                </div>
              </div>
              {status.errorMessage && <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300 flex gap-2"><AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /><span>{status.errorMessage}</span></div>}
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(status.startedAt).toLocaleString('vi-VN')}</div>
                {isTerminal && <button onClick={onClose} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm text-white font-medium">Đóng</button>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function EditModal({ page, onClose, onSaved }: { page: FbPage; onClose: () => void; onSaved: () => void }) {
  const [label, setLabel] = useState(page.label)
  const [url, setUrl] = useState(page.fb_page_url ?? '')
  const [saving, setSaving] = useState(false)
  async function save() {
    setSaving(true)
    await fetch(`/api/social-listening/pages/${page.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ label, fb_page_url: url || null }) })
    setSaving(false); onSaved(); onClose()
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5"><h2 className="font-semibold text-lg">Chỉnh sửa Fanpage</h2><button onClick={onClose} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button></div>
        <div className="space-y-4">
          <div><label className="text-xs text-slate-400 mb-1 block">Tên hiển thị</label><input value={label} onChange={e=>setLabel(e.target.value)} className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-blue-500" /></div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Facebook Page URL <span className="text-amber-400">*bắt buộc để quét nhóm*</span></label>
            <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://www.facebook.com/TenPage" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            <p className="text-xs text-slate-500 mt-1">Hoặc dạng: https://www.facebook.com/profile.php?id=XXXXXXXXX</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm">Hủy</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-sm font-medium flex items-center gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Lưu</button>
        </div>
      </div>
    </div>
  )
}

export default function FanpagesAdminPage() {
  const [pages, setPages] = useState<FbPage[]>([])
  const [loading, setLoading] = useState(true)
  const [newLabel, setNewLabel] = useState('')
  const [creating, setCreating] = useState(false)
  const [busyPage, setBusyPage] = useState<string | null>(null)
  const [activeLogin, setActiveLogin] = useState<{ pageId: string; loginId: string } | null>(null)
  const [editPage, setEditPage] = useState<FbPage | null>(null)
  const [scanPage, setScanPage] = useState<FbPage | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await fetch('/api/social-listening/pages')
    const j = await r.json() as { pages?: FbPage[] }
    setPages(j.pages ?? [])
    setLoading(false)
  }, [])
  useEffect(() => { void load() }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); if (!newLabel.trim()) return
    setCreating(true)
    const r = await fetch('/api/social-listening/pages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ label: newLabel.trim() }) })
    if (!r.ok) { const j = await r.json() as { error?: string }; alert(`Tạo thất bại: ${j.error}`) }
    else { setNewLabel(''); void load() }
    setCreating(false)
  }

  async function startLogin(p: FbPage) {
    setBusyPage(p.id)
    const r = await fetch(`/api/social-listening/pages/${p.id}/login-start`, { method: 'POST' })
    const j = await r.json() as { loginId?: string; error?: string }
    setBusyPage(null)
    if (!r.ok || !j.loginId) { alert(`Lỗi: ${j.error}`); return }
    setActiveLogin({ pageId: p.id, loginId: j.loginId })
  }

  async function logout(p: FbPage) {
    if (!confirm(`Đăng xuất "${p.label}"?`)) return
    setBusyPage(p.id)
    await fetch(`/api/social-listening/pages/${p.id}/logout`, { method: 'POST' })
    setBusyPage(null); void load()
  }

  async function deletePage(p: FbPage) {
    if (!confirm(`Xóa fanpage "${p.label}"? Hành động không thể hoàn tác.`)) return
    setBusyPage(p.id)
    await fetch(`/api/social-listening/pages/${p.id}`, { method: 'DELETE' })
    setBusyPage(null); void load()
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Radio className="h-6 w-6 text-blue-400" /> Fanpages</h1><p className="text-sm text-slate-400 mt-1">Quản lý tài khoản Facebook dùng để reply</p></div>
        <button onClick={() => void load()} className="text-sm flex items-center gap-1.5 text-slate-400 hover:text-white"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </div>

      <form onSubmit={handleCreate} className="mb-6 flex gap-2">
        <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Tên fanpage (vd: TinniAI Official)" className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 text-sm focus:outline-none focus:border-blue-500" />
        <button type="submit" disabled={creating || !newLabel.trim()} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-sm font-medium">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Thêm
        </button>
      </form>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
      ) : pages.length === 0 ? (
        <div className="text-center py-16 text-slate-500"><Radio className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>Chưa có fanpage nào.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pages.map(p => (
            <div key={p.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{p.label}</div>
                  {p.fb_user_id && <div className="text-xs text-slate-500 mt-0.5">FB ID: {p.fb_user_id}</div>}
                  {p.fb_page_url
                    ? <div className="text-xs text-slate-600 mt-0.5 truncate">{p.fb_page_url}</div>
                    : <div className="text-xs text-amber-500/70 mt-0.5">⚠️ Chưa có Page URL</div>
                  }
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${SC[p.status] ?? SC['IDLE']}`}>{p.status}</span>
                  <DropdownMenu items={[
                    { label: 'Chỉnh sửa', icon: <Pencil className="h-3.5 w-3.5" />, onClick: () => setEditPage(p) },
                    p.status === 'ONLINE'
                      ? { label: 'Đăng xuất', icon: <LogOut className="h-3.5 w-3.5" />, disabled: busyPage === p.id, onClick: () => void logout(p) }
                      : { label: 'Đăng nhập', icon: <LogIn className="h-3.5 w-3.5" />, disabled: busyPage === p.id, onClick: () => void startLogin(p) },
                    { label: 'Quét nhóm', icon: <Users className="h-3.5 w-3.5" />, disabled: p.status !== 'ONLINE', onClick: () => setScanPage(p) },
                    { label: 'Xóa fanpage', icon: <Trash2 className="h-3.5 w-3.5" />, danger: true, onClick: () => void deletePage(p) },
                  ]} />
                </div>
              </div>

              {p.last_error && <div className="text-xs text-red-400 bg-red-500/10 rounded p-2 mb-3 flex gap-1.5"><AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" /><span className="truncate">{p.last_error}</span></div>}
              {p.last_active_at && <div className="text-xs text-slate-500 mb-3">Hoạt động: {new Date(p.last_active_at).toLocaleString('vi-VN')}</div>}

              <div className="flex gap-2">
                {p.status === 'ONLINE' ? (
                  <button onClick={() => void logout(p)} disabled={busyPage === p.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs">
                    <LogOut className="h-3.5 w-3.5" /> Đăng xuất
                  </button>
                ) : (
                  <button onClick={() => void startLogin(p)} disabled={busyPage === p.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-xs font-medium">
                    {busyPage === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogIn className="h-3.5 w-3.5" />} Đăng nhập
                  </button>
                )}
                {p.status === 'ONLINE' && (
                  <button onClick={() => setScanPage(p)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs">
                    <Users className="h-3.5 w-3.5" /> Quét nhóm
                  </button>
                )}
                {p.status === 'ONLINE' && <CheckCircle2 className="h-4 w-4 text-green-400 ml-auto self-center" />}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeLogin && <LoginModal pageId={activeLogin.pageId} loginId={activeLogin.loginId} onClose={() => { setActiveLogin(null); void load() }} />}
      {editPage && <EditModal page={editPage} onClose={() => setEditPage(null)} onSaved={() => void load()} />}
      {scanPage && <ScanGroupsModal page={scanPage} onClose={() => setScanPage(null)} onSourcesAdded={() => void load()} />}
    </div>
  )
}
