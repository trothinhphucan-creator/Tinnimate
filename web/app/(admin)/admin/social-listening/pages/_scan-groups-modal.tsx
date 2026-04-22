'use client'
import { useState } from 'react'
import { Users, Search, Plus, Loader2, X, CheckCircle2, AlertCircle, Zap } from 'lucide-react'

interface FbPage { id: string; label: string; fb_page_url?: string | null }
interface GroupInfo { name: string; url: string; memberCount: string | null }

interface Props {
  page: FbPage
  onClose: () => void
  onSourcesAdded: () => void
}

export function ScanGroupsModal({ page, onClose, onSourcesAdded }: Props) {
  const [groups, setGroups] = useState<GroupInfo[]>([])
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [adding, setAdding] = useState(false)
  const [addedCount, setAddedCount] = useState(0)
  const [addErrors, setAddErrors] = useState<string[]>([])
  const [scraping, setScraping] = useState(false)
  const [q, setQ] = useState('')

  const filtered = groups.filter(g => !q || g.name.toLowerCase().includes(q.toLowerCase()))

  async function scan() {
    setScanning(true); setScanError(null); setGroups([]); setSelected(new Set()); setAddedCount(0)
    try {
      const r = await fetch(`/api/social-listening/pages/${page.id}/scan-groups`)
      const j = await r.json() as { groups?: GroupInfo[]; error?: string; scannedAsPage?: boolean }
      if (!r.ok || j.error) { setScanError(j.error ?? 'Lỗi không xác định'); return }
      setGroups(j.groups ?? [])
      if (!j.scannedAsPage) setScanError('⚠️ Quét từ tài khoản cá nhân — hãy nhập Facebook Page URL trong Chỉnh sửa')
    } catch (e) { setScanError((e as Error).message) }
    finally { setScanning(false) }
  }

  function toggle(url: string) {
    setSelected(s => { const n = new Set(s); n.has(url) ? n.delete(url) : n.add(url); return n })
  }

  async function addSelected() {
    const toAdd = groups.filter(g => selected.has(g.url))
    setAdding(true); setAddErrors([])
    let ok = 0
    for (const g of toAdd) {
      const r = await fetch('/api/social-listening/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'GROUP',
          label: g.name,
          fb_url: g.url,
          page_id: page.id,   // ← link source với fanpage
          enabled: true,
        }),
      })
      const j = await r.json() as { error?: string }
      if (r.ok) ok++
      else setAddErrors(prev => [...prev, `${g.name}: ${j.error}`])
    }
    setAdding(false)
    setAddedCount(ok)
    onSourcesAdded()
  }

  async function scrapeNow() {
    setScraping(true)
    try {
      const r = await fetch('/api/social-listening/scrape-now', { method: 'POST' })
      const j = await r.json() as { queued?: number; error?: string }
      if (r.ok) alert(`✅ Đã enqueue ${j.queued} sources vào hàng đợi scrape`)
      else alert(`Lỗi: ${j.error}`)
    } catch (e) { alert((e as Error).message) }
    finally { setScraping(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-400" />
            <div>
              <div className="font-semibold">Quét nhóm — {page.label}</div>
              <div className="text-xs text-slate-500">
                {page.fb_page_url ? `📄 ${page.fb_page_url}` : '⚠️ Chưa có Page URL'}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1"><X className="h-5 w-5" /></button>
        </div>

        {/* Actions */}
        <div className="p-4 border-b border-slate-800 flex gap-2 flex-wrap">
          <button onClick={scan} disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-sm font-medium">
            {scanning ? <><Loader2 className="h-4 w-4 animate-spin" />Đang quét...</> : <><Search className="h-4 w-4" />Bắt đầu quét</>}
          </button>
          {addedCount > 0 && (
            <button onClick={scrapeNow} disabled={scraping}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-40 text-sm font-medium">
              {scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Scrape ngay
            </button>
          )}
          {groups.length > 0 && (
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm nhóm..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm focus:outline-none focus:border-blue-500" />
            </div>
          )}
        </div>

        {/* Error banner */}
        {scanError && (
          <div className={`mx-4 mt-3 rounded-lg p-3 text-sm flex gap-2 items-start
            ${scanError.startsWith('⚠️') ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300' : 'bg-red-500/10 border border-red-500/30 text-red-300'}`}>
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{scanError}</span>
          </div>
        )}

        {/* Added success */}
        {addedCount > 0 && (
          <div className="mx-4 mt-3 rounded-lg p-3 text-sm flex gap-2 items-center bg-green-500/10 border border-green-500/30 text-green-300">
            <CheckCircle2 className="h-4 w-4" />
            <span>Đã thêm {addedCount} nhóm vào Sources. Bấm <strong>Scrape ngay</strong> để bắt đầu thu thập bài.</span>
          </div>
        )}

        {/* Add errors */}
        {addErrors.length > 0 && (
          <div className="mx-4 mt-2 rounded-lg p-3 text-xs bg-red-500/10 border border-red-500/30 text-red-300 space-y-1">
            {addErrors.map((e, i) => <div key={i}>{e}</div>)}
          </div>
        )}

        {/* Group list */}
        <div className="flex-1 overflow-y-auto p-4">
          {groups.length === 0 && !scanning && (
            <div className="text-center py-12 text-slate-500">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="mb-1">Bấm &ldquo;Bắt đầu quét&rdquo; để tìm nhóm</p>
              {!page.fb_page_url && (
                <p className="text-xs text-amber-400 mt-2">
                  ⚠️ Nhớ nhập Facebook Page URL trong Chỉnh sửa trước
                </p>
              )}
            </div>
          )}
          {scanning && (
            <div className="flex items-center justify-center gap-2 text-slate-400 py-12">
              <Loader2 className="h-5 w-5 animate-spin" />Đang mở trình duyệt và quét nhóm Page...
            </div>
          )}
          {filtered.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                <span>{filtered.length} nhóm · {selected.size} đã chọn</span>
                <div className="flex gap-3">
                  <button onClick={() => setSelected(new Set(filtered.map(g => g.url)))} className="text-blue-400 hover:text-blue-300">Chọn tất cả</button>
                  <button onClick={() => setSelected(new Set())} className="text-slate-400 hover:text-white">Bỏ chọn</button>
                </div>
              </div>
              {filtered.map(g => (
                <label key={g.url}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                    ${selected.has(g.url) ? 'border-blue-500/50 bg-blue-500/5' : 'border-slate-800 bg-slate-800/50 hover:border-slate-700'}`}>
                  <input type="checkbox" checked={selected.has(g.url)} onChange={() => toggle(g.url)} className="mt-0.5 accent-blue-500" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{g.name}</div>
                    <div className="text-xs text-slate-500 truncate">{g.url}</div>
                    {g.memberCount && <div className="text-xs text-slate-600 mt-0.5">{g.memberCount}</div>}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {selected.size > 0 && (
          <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-sm text-slate-400">Đã chọn {selected.size} nhóm</span>
            <button onClick={addSelected} disabled={adding}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-sm font-medium">
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Thêm vào Sources
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
