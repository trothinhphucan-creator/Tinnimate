import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Radio, ListChecks, Rss, AlertTriangle, TrendingUp, CheckCircle2, Clock, Activity, MessageCircle } from 'lucide-react'

export const metadata = { title: 'Social Listening — TinniMate Admin' }

async function getStats() {
  const cookieStore = await cookies()
  const db = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalPosts },
    { count: pendingDrafts },
    { count: posted },
    { count: crisisPosts },
    { data: pages },
  ] = await Promise.all([
    db.from('fb_posts').select('id', { count: 'exact', head: true }).gte('scraped_at', since24h),
    db.from('fb_replies').select('id', { count: 'exact', head: true }).eq('status', 'DRAFT'),
    db.from('fb_replies').select('id', { count: 'exact', head: true }).eq('status', 'POSTED').gte('created_at', since24h),
    db.from('fb_posts').select('id', { count: 'exact', head: true }).contains('classification', { crisis_flag: true }).gte('scraped_at', since24h),
    db.from('fb_pages').select('id, label, status, last_active_at').order('last_active_at', { ascending: false }),
  ])

  return {
    totalPosts: totalPosts ?? 0,
    pendingDrafts: pendingDrafts ?? 0,
    posted: posted ?? 0,
    crisisPosts: crisisPosts ?? 0,
    pages: pages ?? [],
  }
}

const STATUS_COLORS: Record<string, string> = {
  ONLINE: 'text-green-400 bg-green-400/10',
  OFFLINE: 'text-slate-400 bg-slate-400/10',
  LOGGED_OUT: 'text-red-400 bg-red-400/10',
  CONNECTING: 'text-yellow-400 bg-yellow-400/10',
  ERROR: 'text-red-400 bg-red-400/10',
}

export default async function SocialListeningDashboard() {
  const stats = await getStats()

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Radio className="h-6 w-6 text-blue-400" />
          <h1 className="text-2xl font-bold">Social Listening</h1>
        </div>
        <p className="text-slate-400 text-sm">Tinnitus monitoring · Auto-reply drafts · Fanpage management</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Posts scraped (24h)',
            value: stats.totalPosts,
            icon: TrendingUp,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
          },
          {
            label: 'Drafts pending review',
            value: stats.pendingDrafts,
            icon: Clock,
            color: stats.pendingDrafts > 0 ? 'text-yellow-400' : 'text-slate-400',
            bg: stats.pendingDrafts > 0 ? 'bg-yellow-500/10' : 'bg-slate-500/10',
            href: '/admin/social-listening/queue',
          },
          {
            label: 'Replies posted (24h)',
            value: stats.posted,
            icon: CheckCircle2,
            color: 'text-green-400',
            bg: 'bg-green-500/10',
          },
          {
            label: 'Crisis flags (24h)',
            value: stats.crisisPosts,
            icon: AlertTriangle,
            color: stats.crisisPosts > 0 ? 'text-red-400' : 'text-slate-400',
            bg: stats.crisisPosts > 0 ? 'bg-red-500/10' : 'bg-slate-500/10',
          },
        ].map(({ label, value, icon: Icon, color, bg, href }) => {
          const card = (
            <div className={`rounded-xl border border-slate-800 p-5 ${bg} hover:border-slate-700 transition-colors`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-400">{label}</span>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div className={`text-3xl font-bold ${color}`}>{value}</div>
            </div>
          )
          return href ? (
            <Link key={label} href={href}>{card}</Link>
          ) : (
            <div key={label}>{card}</div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        {[
          { href: '/admin/social-listening/queue',    label: 'Review Queue',    icon: ListChecks,     desc: 'Duyệt & đăng draft reply' },
          { href: '/admin/social-listening/comments',  label: 'Comment Inbox',   icon: MessageCircle,  desc: 'Reply comments cần thông tin' },
          { href: '/admin/social-listening/sources',   label: 'Manage Sources',  icon: Rss,            desc: 'Thêm nhóm, page, keyword' },
          { href: '/admin/social-listening/pages',     label: 'Fanpages',        icon: Radio,          desc: 'Đăng nhập & quản lý page' },
          { href: '/admin/social-listening/status',    label: 'Scrape Status',   icon: Activity,       desc: 'Trạng thái scrape real-time' },
        ].map(({ href, label, icon: Icon, desc }) => (
          <Link key={href} href={href}
            className="flex items-start gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900 hover:border-blue-500/50 hover:bg-slate-800 transition-all group">
            <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
              <Icon className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <div className="font-medium text-sm mb-0.5">{label}</div>
              <div className="text-xs text-slate-500">{desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Fanpage Status */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Radio className="h-4 w-4 text-blue-400" /> Fanpage Status
        </h2>
        {stats.pages.length === 0 ? (
          <p className="text-sm text-slate-500">
            Chưa có fanpage nào.{' '}
            <Link href="/admin/social-listening/pages" className="text-blue-400 hover:underline">
              Thêm ngay →
            </Link>
          </p>
        ) : (
          <div className="divide-y divide-slate-800">
            {(stats.pages as Array<{ id: string; label: string; status: string; last_active_at: string | null }>).map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between">
                <span className="text-sm font-medium">{p.label}</span>
                <div className="flex items-center gap-3">
                  {p.last_active_at && (
                    <span className="text-xs text-slate-500">
                      {new Date(p.last_active_at).toLocaleString('vi-VN')}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status] ?? STATUS_COLORS['IDLE']}`}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
