'use client'

import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  Activity, CheckCircle2, XCircle, Loader2, Clock, RefreshCw,
  Database, Zap, ChevronRight, Wifi, WifiOff, AlertTriangle
} from 'lucide-react'

type ScrapeJob = {
  id: string
  status: 'QUEUED' | 'RUNNING' | 'DONE' | 'FAILED' | 'SKIPPED'
  posts_found: number
  posts_new: number
  error: string | null
  started_at: string | null
  finished_at: string | null
  created_at: string
  source: { label: string; type: string; fb_url: string | null } | null
  page: { label: string } | null
}

const STATUS_CFG = {
  QUEUED:  { label: 'Xếp hàng',  dot: 'bg-slate-500',  ring: 'border-slate-700',  text: 'text-slate-400',  bg: 'bg-slate-800' },
  RUNNING: { label: 'Đang chạy', dot: 'bg-blue-400 animate-pulse', ring: 'border-blue-500/40', text: 'text-blue-300', bg: 'bg-blue-950/30' },
  DONE:    { label: 'Hoàn thành',dot: 'bg-green-400',  ring: 'border-green-500/30', text: 'text-green-400', bg: 'bg-green-950/20' },
  FAILED:  { label: 'Thất bại',  dot: 'bg-red-400',    ring: 'border-red-500/30',  text: 'text-red-400',   bg: 'bg-red-950/20' },
  SKIPPED: { label: 'Bỏ qua',    dot: 'bg-amber-400',  ring: 'border-amber-500/30',text: 'text-amber-400', bg: 'bg-amber-950/20' },
}

function duration(started: string | null, finished: string | null): string {
  if (!started) return '—'
  const end = finished ? new Date(finished) : new Date()
  const ms = end.getTime() - new Date(started).getTime()
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m${Math.floor((ms % 60000) / 1000)}s`
}

function timeAgo(ts: string): string {
  const ms = Date.now() - new Date(ts).getTime()
  if (ms < 60000) return `${Math.floor(ms / 1000)}s trước`
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m trước`
  return new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function JobRow({ job }: { job: ScrapeJob }) {
  const cfg = STATUS_CFG[job.status]
  const [elapsed, setElapsed] = useState(duration(job.started_at, job.finished_at))

  // Live elapsed timer for running jobs
  useEffect(() => {
    if (job.status !== 'RUNNING') return
    const t = setInterval(() => setElapsed(duration(job.started_at, null)), 1000)
    return () => clearInterval(t)
  }, [job.status, job.started_at])

  return (
    <div className={`rounded-xl border p-4 transition-all ${cfg.ring} ${cfg.bg}`}>
      <div className="flex items-start gap-3">
        {/* Status dot */}
        <div className="mt-1 shrink-0">
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Source label + page */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-medium text-sm text-white truncate">
              {job.source?.label ?? 'Unknown source'}
            </span>
            {job.page && (
              <>
                <ChevronRight className="h-3 w-3 text-slate-600 shrink-0" />
                <span className="text-xs text-slate-500">{job.page.label}</span>
              </>
            )}
            <span className={`ml-auto shrink-0 text-xs font-semibold ${cfg.text}`}>{cfg.label}</span>
          </div>

          {/* URL */}
          {job.source?.fb_url && (
            <div className="text-xs text-slate-600 truncate mb-2">
              {job.source.fb_url.replace('https://www.facebook.com', 'fb.com')}
            </div>
          )}

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {elapsed}
            </span>
            {job.posts_found > 0 && (
              <span className="flex items-center gap-1 text-blue-400">
                <Database className="h-3 w-3" />
                {job.posts_found} bài
              </span>
            )}
            {job.posts_new > 0 && (
              <span className="flex items-center gap-1 text-green-400">
                <Zap className="h-3 w-3" />
                +{job.posts_new} mới
              </span>
            )}
            <span className="text-slate-600">{timeAgo(job.created_at)}</span>
          </div>

          {/* Error */}
          {job.error && (
            <div className="mt-2 flex items-start gap-2 text-xs text-red-400 bg-red-500/10 rounded-lg p-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span className="break-all">{job.error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ScrapeStatusPage() {
  const [jobs, setJobs] = useState<ScrapeJob[]>([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  async function fetchJobs() {
    const { data } = await supabase
      .from('fb_scrape_jobs')
      .select(`
        id, status, posts_found, posts_new, error,
        started_at, finished_at, created_at,
        source:fb_target_sources(label, type, fb_url),
        page:fb_pages(label)
      `)
      .order('created_at', { ascending: false })
      .limit(60)
    setJobs((data as unknown as ScrapeJob[]) ?? [])
    setLastUpdate(new Date())
    setLoading(false)
  }

  useEffect(() => {
    void fetchJobs()

    // Supabase Realtime — subscribe to fb_scrape_jobs INSERT + UPDATE
    const channel = supabase
      .channel('scrape-jobs-live')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'fb_scrape_jobs',
      }, (payload) => {
        const row = payload.new as ScrapeJob
        setJobs(prev => {
          const existing = prev.findIndex(j => j.id === row.id)
          if (existing >= 0) {
            // UPDATE: merge fields but source/page may not be in payload
            const updated = [...prev]
            updated[existing] = { ...updated[existing], ...row }
            return updated
          }
          // INSERT: prepend + refetch to get joined source/page
          void fetchJobs()
          return prev
        })
        setLastUpdate(new Date())
      })
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED')
      })

    // Fallback poll every 10s for running jobs
    const poll = setInterval(() => {
      setJobs(prev => {
        if (prev.some(j => j.status === 'RUNNING' || j.status === 'QUEUED')) {
          void fetchJobs()
        }
        return prev
      })
    }, 10_000)

    return () => {
      void supabase.removeChannel(channel)
      clearInterval(poll)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const running = jobs.filter(j => j.status === 'RUNNING')
  const queued  = jobs.filter(j => j.status === 'QUEUED')
  const done    = jobs.filter(j => j.status !== 'RUNNING' && j.status !== 'QUEUED')

  const totalNew24h = jobs
    .filter(j => new Date(j.created_at) > new Date(Date.now() - 86400000))
    .reduce((s, j) => s + j.posts_new, 0)

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur border-b border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-400" />
              Scrape Status
              {running.length > 0 && (
                <span className="ml-1 inline-flex items-center gap-1 text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  {running.length} đang chạy
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Trạng thái scrape bài viết theo thời gian thực
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Stats */}
            <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-green-400" />
                +{totalNew24h} bài/24h
              </span>
              {lastUpdate && (
                <span className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  {lastUpdate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </div>

            {/* Realtime indicator */}
            <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${
              connected
                ? 'text-green-400 border-green-500/30 bg-green-500/10'
                : 'text-slate-400 border-slate-700 bg-slate-800'
            }`}>
              {connected
                ? <><Wifi className="h-3 w-3" />Live</>
                : <><WifiOff className="h-3 w-3" />Offline</>
              }
            </div>

            <button
              onClick={() => void fetchJobs()}
              className="text-slate-400 hover:text-white transition-colors"
              title="Làm mới"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Summary stats bar */}
        {!loading && (
          <div className="flex gap-4 mt-3 text-xs">
            {[
              { label: 'Đang chạy', count: running.length, color: 'text-blue-400' },
              { label: 'Xếp hàng',  count: queued.length,  color: 'text-slate-400' },
              { label: 'Hoàn thành',count: jobs.filter(j => j.status === 'DONE').length,   color: 'text-green-400' },
              { label: 'Thất bại',  count: jobs.filter(j => j.status === 'FAILED').length, color: 'text-red-400' },
            ].map(s => (
              <span key={s.label} className={`${s.color}`}>
                <span className="font-semibold">{s.count}</span>
                <span className="text-slate-600 ml-1">{s.label}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="p-6" ref={listRef}>
        {loading ? (
          <div className="flex items-center gap-3 text-slate-500 py-12 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            Đang tải...
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Chưa có scrape job nào</p>
            <p className="text-sm mt-1">Nhấn &quot;⚡ Scrape ngay&quot; trong trang Sources để bắt đầu</p>
          </div>
        ) : (
          <div className="space-y-6 max-w-3xl">
            {/* Running jobs */}
            {running.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  Đang chạy ({running.length})
                </h2>
                <div className="space-y-2">
                  {running.map(j => <JobRow key={j.id} job={j} />)}
                </div>
              </section>
            )}

            {/* Queued jobs */}
            {queued.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                  Đang xếp hàng ({queued.length})
                </h2>
                <div className="space-y-2">
                  {queued.map(j => <JobRow key={j.id} job={j} />)}
                </div>
              </section>
            )}

            {/* Completed jobs */}
            {done.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
                  Lịch sử gần đây
                </h2>
                <div className="space-y-2">
                  {done.map(j => <JobRow key={j.id} job={j} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
