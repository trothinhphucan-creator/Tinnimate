'use client'

import type { AdminAuditEntry } from '@/types'
import { ShieldCheck } from 'lucide-react'

interface Props {
  userId: string
}

// Audit data is fetched independently since it's not in the main user detail API
import { useState, useEffect } from 'react'

export function AuditTab({ userId }: Props) {
  const [entries, setEntries] = useState<AdminAuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/audit?target_id=${userId}&limit=20`)
      .then(r => r.ok ? r.json() : { entries: [] })
      .then(d => setEntries(d.entries ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [userId])

  return (
    <div>
      <p className="text-xs text-slate-400 font-medium mb-3 uppercase tracking-wider">
        Admin Audit Log
      </p>

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-white/[0.03] rounded-lg animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
          <ShieldCheck size={28} className="text-slate-600" />
          <p className="text-sm text-slate-500">No admin actions recorded for this user.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-2 px-2 text-slate-500">Action</th>
                <th className="text-left py-2 px-2 text-slate-500">Admin</th>
                <th className="text-left py-2 px-2 text-slate-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="py-2 px-2">
                    <span className="font-mono text-amber-400">{e.action}</span>
                  </td>
                  <td className="py-2 px-2 text-slate-500 font-mono text-[10px]">
                    {e.admin_id ? e.admin_id.slice(0, 8) + '…' : '—'}
                  </td>
                  <td className="py-2 px-2 text-slate-500">
                    {new Date(e.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
