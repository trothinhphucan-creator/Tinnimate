'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { UserDetail, TinnitusProfileRow, AssessmentRow, CheckinRow, TherapySessionRow, SubscriptionRow, PaymentOrderRow } from '@/types'
import { ProfileTab }       from './user-detail-profile-tab'
import { SubscriptionTab }  from './user-detail-subscription-tab'
import { ClinicalTab }      from './user-detail-clinical-tab'
import { ActivityTab }      from './user-detail-activity-tab'
import { ConversationsTab } from './user-detail-conversations-tab'
import { JournalTab }       from './user-detail-journal-tab'
import { AuditTab }         from './user-detail-audit-tab'

interface ConversationRow {
  id: string
  title?: string | null
  updated_at: string
}

interface UserDetailData {
  profile: UserDetail
  tinnitus: TinnitusProfileRow | null
  subscription: SubscriptionRow | null
  assessments: AssessmentRow[]
  checkins: CheckinRow[]
  therapy: TherapySessionRow[]
  conversations: ConversationRow[]
  orders: PaymentOrderRow[]
}

const TABS = ['Profile', 'Subscription', 'Clinical', 'Activity', 'Conversations', 'Journal', 'Audit'] as const
type Tab = typeof TABS[number]

function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-8 bg-white/[0.05] rounded-lg w-1/3" />
      <div className="h-4 bg-white/[0.03] rounded w-1/2" />
      <div className="grid grid-cols-2 gap-3 mt-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-white/[0.03] rounded-lg" />)}
      </div>
    </div>
  )
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: userId } = use(params)
  const [data, setData] = useState<UserDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('Profile')

  const fetchData = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/admin/users/${userId}`)
      if (!res.ok) { setError('Failed to load user'); return }
      const json = await res.json()
      setData(json)
    } catch { setError('Network error') }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const profile = data?.profile
  const displayName = profile?.name ?? profile?.email ?? userId

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-5">
        <Link href="/admin/users" className="hover:text-white transition-colors">Users</Link>
        <ChevronRight size={12} />
        <span className="text-white truncate max-w-[200px]">{displayName}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {displayName[0]?.toUpperCase() ?? '?'}
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">{displayName}</h1>
          <p className="text-xs text-slate-500 font-mono">{userId}</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 flex-wrap mb-6 bg-white/[0.02] border border-white/5 rounded-xl p-1">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
        {error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : loading || !data ? (
          <Skeleton />
        ) : (
          <>
            {activeTab === 'Profile' && (
              <ProfileTab profile={data.profile} userId={userId} onSaved={fetchData} />
            )}
            {activeTab === 'Subscription' && (
              <SubscriptionTab subscription={data.subscription} orders={data.orders} />
            )}
            {activeTab === 'Clinical' && (
              <ClinicalTab tinnitus={data.tinnitus} assessments={data.assessments} />
            )}
            {activeTab === 'Activity' && (
              <ActivityTab checkins={data.checkins} therapy={data.therapy} />
            )}
            {activeTab === 'Conversations' && (
              <ConversationsTab conversations={data.conversations} userId={userId} />
            )}
            {activeTab === 'Journal' && <JournalTab />}
            {activeTab === 'Audit'   && <AuditTab userId={userId} />}
          </>
        )}
      </div>
    </div>
  )
}
