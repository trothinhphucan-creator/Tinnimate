'use client'

import type { CheckinRow, TherapySessionRow } from '@/types'

interface Props {
  checkins: CheckinRow[]
  therapy: TherapySessionRow[]
}

// Simple SVG sparkline — no external deps
function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return <span className="text-slate-600 text-xs">—</span>
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const w = 120
  const h = 32
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function fmtDuration(sec: number | undefined) {
  if (!sec) return '—'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function ActivityTab({ checkins, therapy }: Props) {
  // Reverse so chart goes oldest→newest left→right
  const sorted = [...checkins].reverse()
  const moods     = sorted.map(c => c.mood)
  const loudness  = sorted.map(c => c.tinnitus_loudness)
  const sleep     = sorted.map(c => c.sleep_quality)

  return (
    <div className="space-y-5">
      {/* Sparklines */}
      <div>
        <p className="text-xs text-slate-400 font-medium mb-3 uppercase tracking-wider">
          Last {checkins.length} Daily Check-ins
        </p>
        {checkins.length === 0 ? (
          <p className="text-sm text-slate-500">No check-ins yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Mood',       values: moods,    color: '#34d399' },
              { label: 'Loudness',   values: loudness, color: '#f87171' },
              { label: 'Sleep',      values: sleep,    color: '#60a5fa' },
            ].map(({ label, values, color }) => (
              <div key={label} className="bg-white/[0.03] rounded-lg p-3">
                <p className="text-[10px] text-slate-500 mb-1">{label}</p>
                <Sparkline values={values} color={color} />
                <p className="text-[10px] text-slate-600 mt-1">
                  avg {values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : '—'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Therapy sessions */}
      <div>
        <p className="text-xs text-slate-400 font-medium mb-2 uppercase tracking-wider">
          Therapy Sessions ({therapy.length})
        </p>
        {therapy.length === 0 ? (
          <p className="text-sm text-slate-500">No therapy sessions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-2 px-2 text-slate-500">Sound</th>
                  <th className="text-left py-2 px-2 text-slate-500">Duration</th>
                  <th className="text-left py-2 px-2 text-slate-500">Mood →</th>
                  <th className="text-left py-2 px-2 text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {therapy.map(t => (
                  <tr key={t.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="py-2 px-2 text-slate-300 capitalize">{t.sound_type?.replace(/_/g, ' ') ?? '—'}</td>
                    <td className="py-2 px-2 text-white font-mono">{fmtDuration(t.duration_sec)}</td>
                    <td className="py-2 px-2 text-slate-400">
                      {t.mood_before ?? '?'} → {t.mood_after ?? '?'}
                    </td>
                    <td className="py-2 px-2 text-slate-500">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
