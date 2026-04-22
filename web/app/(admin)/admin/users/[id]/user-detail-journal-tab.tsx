'use client'

import { BookOpen } from 'lucide-react'

export function JournalTab() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
      <BookOpen size={32} className="text-slate-600" />
      <p className="text-sm text-slate-400 font-medium">Journal entries available via API</p>
      <p className="text-xs text-slate-600 max-w-xs">
        Query <code className="bg-white/5 px-1 rounded font-mono">journal_entries</code> table
        with <code className="bg-white/5 px-1 rounded font-mono">user_id = id</code> to retrieve entries.
      </p>
    </div>
  )
}
