'use client'

import type { TinnitusProfileRow, AssessmentRow } from '@/types'

interface Props {
  tinnitus: TinnitusProfileRow | null
  assessments: AssessmentRow[]
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-white/[0.03] rounded-lg p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm text-white">{value ?? '—'}</p>
    </div>
  )
}

const QUIZ_COLOR: Record<string, string> = {
  THI:  'text-red-400',
  TFI:  'text-orange-400',
  PHQ9: 'text-purple-400',
  GAD7: 'text-blue-400',
  ISI:  'text-cyan-400',
}

export function ClinicalTab({ tinnitus, assessments }: Props) {
  return (
    <div className="space-y-5">
      {/* Tinnitus profile */}
      <div>
        <p className="text-xs text-slate-400 font-medium mb-2 uppercase tracking-wider">Tinnitus Profile</p>
        {tinnitus ? (
          <div className="grid grid-cols-3 gap-2">
            <Field label="Type"     value={tinnitus.type} />
            <Field label="Side"     value={tinnitus.side} />
            <Field label="Duration" value={tinnitus.duration} />
            <Field label="Cause"    value={tinnitus.cause} />
            <Field label="Severity" value={tinnitus.severity !== undefined ? `${tinnitus.severity}/10` : null} />
            <Field label="Pitch Hz" value={tinnitus.pitch_hz !== undefined ? `${tinnitus.pitch_hz} Hz` : null} />
          </div>
        ) : (
          <p className="text-sm text-slate-500">No tinnitus profile recorded.</p>
        )}
      </div>

      {/* Assessment history */}
      <div>
        <p className="text-xs text-slate-400 font-medium mb-2 uppercase tracking-wider">
          Assessment History ({assessments.length})
        </p>
        {assessments.length === 0 ? (
          <p className="text-sm text-slate-500">No assessments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-2 px-2 text-slate-500">Quiz</th>
                  <th className="text-left py-2 px-2 text-slate-500">Score</th>
                  <th className="text-left py-2 px-2 text-slate-500">Interpretation</th>
                  <th className="text-left py-2 px-2 text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map(a => (
                  <tr key={a.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="py-2 px-2">
                      <span className={`font-semibold ${QUIZ_COLOR[a.quiz_type] ?? 'text-white'}`}>
                        {a.quiz_type}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-white font-mono">{a.score}</td>
                    <td className="py-2 px-2 text-slate-400">{a.interpretation ?? '—'}</td>
                    <td className="py-2 px-2 text-slate-500">
                      {new Date(a.created_at).toLocaleDateString()}
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
