'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useLangStore } from '@/stores/use-lang-store'
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'

interface JournalEntry {
  id: string
  mood_score: number
  sleep_score: number
  tinnitus_loudness: number
  notes: string | null
  created_at: string
}

interface JournalClientProps {
  entries: JournalEntry[]
}

const moodEmoji = (v: number) => v <= 2 ? '😢' : v <= 4 ? '😔' : v <= 6 ? '😐' : v <= 8 ? '😊' : '😄'
const tinnitusColor = (v: number) => v <= 3 ? 'text-emerald-400' : v <= 6 ? 'text-amber-400' : 'text-red-400'

export default function JournalClient({ entries }: JournalClientProps) {
  const { lang } = useLangStore()
  const isEn = lang === 'en'
  const [viewDate, setViewDate] = useState(() => new Date())

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Map entries by date
  const entryMap = useMemo(() => {
    const map: Record<string, JournalEntry[]> = {}
    entries.forEach(e => {
      const key = new Date(e.created_at).toISOString().slice(0, 10)
      if (!map[key]) map[key] = []
      map[key].push(e)
    })
    return map
  }, [entries])

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const selectedEntries = selectedDate ? (entryMap[selectedDate] ?? []) : []

  const monthLabel = viewDate.toLocaleDateString(isEn ? 'en-US' : 'vi-VN', { month: 'long', year: 'numeric' })

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

  const dayLabels = isEn ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[15%] w-[200px] h-[200px] rounded-full bg-teal-600/8 blur-[80px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[250px] h-[250px] rounded-full bg-violet-600/8 blur-[80px]" />
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
          <BookOpen size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            {isEn ? 'Tinnitus Journal' : 'Nhật Ký Ù Tai'}
          </h1>
          <p className="text-xs text-slate-400">
            {isEn ? 'Track your daily patterns and triggers' : 'Theo dõi thói quen và nguyên nhân hàng ngày'}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Calendar */}
        <div className="bg-white/[0.02] backdrop-blur border border-white/5 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all">
              <ChevronLeft size={18} />
            </button>
            <h2 className="font-semibold text-white text-sm capitalize">{monthLabel}</h2>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {dayLabels.map(d => (
              <div key={d} className="text-center text-[10px] text-slate-600 font-medium py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const dayEntries = entryMap[dateKey]
              const hasEntry = !!dayEntries
              const isSelected = selectedDate === dateKey
              const isToday = new Date().toISOString().slice(0, 10) === dateKey
              const avgMood = hasEntry ? Math.round(dayEntries.reduce((s, e) => s + e.mood_score, 0) / dayEntries.length) : 0

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateKey)}
                  className={`relative w-full aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all ${
                    isSelected
                      ? 'bg-teal-600/30 border border-teal-500/40 text-teal-300 font-bold'
                      : hasEntry
                        ? 'bg-white/[0.04] hover:bg-white/[0.08] text-white'
                        : 'text-slate-600 hover:text-slate-400'
                  } ${isToday ? 'ring-1 ring-blue-500/40' : ''}`}
                >
                  <span className="text-[11px]">{day}</span>
                  {hasEntry && (
                    <span className="text-[8px] mt-0.5">{moodEmoji(avgMood)}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-4 mt-3 text-[9px] text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-white/[0.04]" /> {isEn ? 'Has entry' : 'Có ghi chép'}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded ring-1 ring-blue-500/40" /> {isEn ? 'Today' : 'Hôm nay'}</span>
          </div>
        </div>

        {/* Entry details */}
        <div className="bg-white/[0.02] backdrop-blur border border-white/5 rounded-2xl p-4 sm:p-5">
          {selectedDate && selectedEntries.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString(isEn ? 'en-US' : 'vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              {selectedEntries.map((entry, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 space-y-3">
                  <div className="text-[10px] text-slate-500">
                    {new Date(entry.created_at).toLocaleTimeString(isEn ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className="text-lg">{moodEmoji(entry.mood_score)}</div>
                      <div className="text-[10px] text-slate-400">{isEn ? 'Mood' : 'Tâm trạng'}</div>
                      <div className="text-sm font-bold text-white">{entry.mood_score}/10</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg">😴</div>
                      <div className="text-[10px] text-slate-400">{isEn ? 'Sleep' : 'Giấc ngủ'}</div>
                      <div className="text-sm font-bold text-white">{entry.sleep_score}/10</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg">🔔</div>
                      <div className="text-[10px] text-slate-400">{isEn ? 'Tinnitus' : 'Ù tai'}</div>
                      <div className={`text-sm font-bold ${tinnitusColor(entry.tinnitus_loudness)}`}>{entry.tinnitus_loudness}/10</div>
                    </div>
                  </div>
                  {entry.notes && (
                    <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                      <p className="text-xs text-slate-300 leading-relaxed">{entry.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : selectedDate ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="text-3xl mb-3">📝</div>
              <p className="text-sm text-slate-500 mb-3">
                {isEn ? 'No entries for this day' : 'Chưa có ghi chép cho ngày này'}
              </p>
              <Link href="/chat" className="inline-flex px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-xs rounded-lg">
                {isEn ? 'Check in now →' : 'Check-in ngay →'}
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="text-3xl mb-3">📅</div>
              <p className="text-sm text-slate-500">
                {isEn ? 'Select a date to view entries' : 'Chọn ngày để xem ghi chép'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stats summary */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          {
            label: isEn ? 'Total entries' : 'Tổng ghi chép',
            value: entries.length.toString(),
            icon: '📝',
            gradient: 'from-teal-500 to-emerald-400',
          },
          {
            label: isEn ? 'Avg mood' : 'T.bình tâm trạng',
            value: entries.length > 0 ? (entries.reduce((s, e) => s + e.mood_score, 0) / entries.length).toFixed(1) : '--',
            icon: '😊',
            gradient: 'from-blue-500 to-cyan-400',
          },
          {
            label: isEn ? 'Avg tinnitus' : 'T.bình ù tai',
            value: entries.length > 0 ? (entries.reduce((s, e) => s + e.tinnitus_loudness, 0) / entries.length).toFixed(1) : '--',
            icon: '🔔',
            gradient: 'from-amber-500 to-orange-400',
          },
        ].map(s => (
          <div key={s.label} className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
            <div className="text-xl mb-1">{s.icon}</div>
            <div className="text-lg font-bold text-white">{s.value}</div>
            <div className="text-[10px] text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
