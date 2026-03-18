'use client'

import { useState } from 'react'
import { useLangStore } from '@/stores/use-lang-store'

const T = {
  vi: {
    title: '📝 Check-in Hàng Ngày',
    subtitle: 'Theo dõi tâm trạng, giấc ngủ và mức độ ù tai',
    mood: 'Tâm trạng',
    sleep: 'Giấc ngủ',
    tinnitus: 'Mức ù tai',
    notes: 'Ghi chú (tùy chọn)',
    notesPlaceholder: 'Hôm nay bạn cảm thấy thế nào?',
    submit: '✅ Gửi check-in',
    submitted: '🎉 Đã lưu! Tinni sẽ theo dõi tiến triển của bạn.',
    low: 'Thấp', mid: 'Trung bình', high: 'Cao',
    bad: '😔', ok: '😐', good: '😊', great: '😄',
  },
  en: {
    title: '📝 Daily Check-in',
    subtitle: 'Track your mood, sleep, and tinnitus level',
    mood: 'Mood',
    sleep: 'Sleep quality',
    tinnitus: 'Tinnitus level',
    notes: 'Notes (optional)',
    notesPlaceholder: 'How are you feeling today?',
    submit: '✅ Submit check-in',
    submitted: '🎉 Saved! Tinni will track your progress.',
    low: 'Low', mid: 'Medium', high: 'High',
    bad: '😔', ok: '😐', good: '😊', great: '😄',
  },
}

interface Props {
  onResult?: (data: Record<string, unknown>) => void
}

export function InlineCheckin({ onResult }: Props) {
  const { lang } = useLangStore()
  const d = T[lang]
  const [mood, setMood] = useState(5)
  const [sleep, setSleep] = useState(5)
  const [tinnitus, setTinnitus] = useState(5)
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    setSubmitted(true)
    const payload = {
      mood_score: mood,
      sleep_score: sleep,
      tinnitus_loudness: tinnitus,
      notes: notes || null,
    }
    onResult?.(payload)
    try {
      await fetch('/api/save-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch (err) {
      console.warn('[InlineCheckin] Save failed:', err)
    }
  }

  const moodEmoji = mood <= 3 ? d.bad : mood <= 5 ? d.ok : mood <= 7 ? d.good : d.great
  const tinnitusColor = tinnitus <= 3 ? 'text-emerald-400' : tinnitus <= 6 ? 'text-amber-400' : 'text-red-400'

  if (submitted) {
    return (
      <div className="bg-gradient-to-br from-emerald-900/20 to-slate-800 border border-emerald-500/20 rounded-xl p-4 mt-2">
        <p className="text-emerald-400 text-sm text-center">{d.submitted}</p>
        <div className="flex justify-center gap-6 mt-3 text-xs text-slate-400">
          <span>{d.mood}: {mood}/10 {moodEmoji}</span>
          <span>{d.sleep}: {sleep}/10</span>
          <span>{d.tinnitus}: {tinnitus}/10</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-amber-900/15 to-slate-800 border border-amber-500/20 rounded-xl p-4 mt-2 space-y-3" style={{ maxWidth: 420 }}>
      <div>
        <div className="text-sm font-bold text-white">{d.title}</div>
        <div className="text-[10px] text-slate-500">{d.subtitle}</div>
      </div>

      {/* Mood */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-400">{d.mood}</span>
          <span className="text-white font-medium">{moodEmoji} {mood}/10</span>
        </div>
        <input type="range" min={1} max={10} value={mood} onChange={e => setMood(+e.target.value)}
          className="w-full h-1.5 accent-blue-500 cursor-pointer" />
      </div>

      {/* Sleep */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-400">{d.sleep}</span>
          <span className="text-white font-medium">{sleep}/10</span>
        </div>
        <input type="range" min={1} max={10} value={sleep} onChange={e => setSleep(+e.target.value)}
          className="w-full h-1.5 accent-violet-500 cursor-pointer" />
      </div>

      {/* Tinnitus */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-400">{d.tinnitus}</span>
          <span className={`font-medium ${tinnitusColor}`}>{tinnitus}/10</span>
        </div>
        <input type="range" min={1} max={10} value={tinnitus} onChange={e => setTinnitus(+e.target.value)}
          className="w-full h-1.5 accent-amber-500 cursor-pointer" />
        <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
          <span>{d.low}</span><span>{d.mid}</span><span>{d.high}</span>
        </div>
      </div>

      {/* Notes */}
      <textarea
        value={notes} onChange={e => setNotes(e.target.value)}
        placeholder={d.notesPlaceholder}
        rows={2}
        className="w-full bg-slate-800/50 border border-slate-700/30 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 resize-none focus:outline-none focus:border-amber-500/40"
      />

      <button onClick={handleSubmit}
        className="w-full py-2 text-xs font-semibold rounded-lg bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 border border-amber-500/30 transition-all">
        {d.submit}
      </button>
    </div>
  )
}
