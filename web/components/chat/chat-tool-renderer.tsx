'use client'
// Renders interactive tool call widgets inline in chat messages
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { ToolCall } from '@/types'

// Dynamic imports to avoid SSR issues with Web Audio API
const InlineSoundPlayer = dynamic(() => import('./InlineSoundPlayer').then(m => ({ default: m.InlineSoundPlayer })), { ssr: false })
const InlineHearingTest = dynamic(() => import('./InlineHearingTest').then(m => ({ default: m.InlineHearingTest })), { ssr: false })
const InlineQuiz = dynamic(() => import('./InlineQuiz').then(m => ({ default: m.InlineQuiz })), { ssr: false })
const InlineRelaxation = dynamic(() => import('./InlineRelaxation').then(m => ({ default: m.InlineRelaxation })), { ssr: false })
const InlineCheckin = dynamic(() => import('./InlineCheckin').then(m => ({ default: m.InlineCheckin })), { ssr: false })

interface Props {
  toolCall: ToolCall
  onResult?: (toolName: string, result: Record<string, unknown>) => void
}

export function ChatToolRenderer({ toolCall, onResult }: Props) {
  const { name, args } = toolCall

  switch (name) {
    case 'play_sound_therapy': {
      const soundType = (args.sound_type as string) ?? 'white_noise'
      const duration = (args.duration_minutes as number) ?? 15
      return (
        <InlineSoundPlayer
          soundType={soundType}
          durationMinutes={duration}
          onResult={(data) => onResult?.(name, data)}
        />
      )
    }

    case 'start_quiz': {
      const quizType = (args.quiz_type as string) ?? 'THI'
      return (
        <InlineQuiz
          quizType={quizType}
          onResult={(data) => onResult?.(name, data)}
        />
      )
    }

    case 'start_hearing_test':
      return (
        <InlineHearingTest
          onResult={(data) => onResult?.(name, data)}
        />
      )

    case 'daily_checkin':
      return (
        <InlineCheckin
          onResult={(data) => onResult?.(name, data)}
        />
      )

    case 'show_progress': {
      const period = (args.period as string) ?? 'week'
      const periodLabels: Record<string, string> = { week: 'tuần', month: 'tháng', all: 'tất cả' }
      return (
        <div className="bg-gradient-to-br from-teal-900/20 to-slate-800 border border-teal-500/20 rounded-xl p-3 mt-2">
          <div className="flex items-center gap-2 text-teal-400 text-xs font-medium mb-1">
            <span>📊</span> Tiến triển ({periodLabels[period] ?? period})
          </div>
          <Link href="/dashboard"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs rounded-lg transition-colors">
            📈 Xem dashboard
          </Link>
        </div>
      )
    }

    case 'run_diagnosis':
      return (
        <div className="bg-gradient-to-br from-rose-900/20 to-slate-800 border border-rose-500/20 rounded-xl p-3 mt-2">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-medium mb-1">
            <span>🔍</span> Chẩn đoán ù tai
          </div>
          <div className="text-slate-400 text-xs">Đang thu thập thông tin triệu chứng...</div>
        </div>
      )

    case 'play_relaxation': {
      const exerciseType = (args.exercise_type as string) ?? 'breathing'
      return (
        <InlineRelaxation
          exerciseType={exerciseType}
          onResult={(data) => onResult?.(name, data)}
        />
      )
    }

    default:
      return (
        <div className="bg-slate-700/60 border border-slate-600/40 rounded-xl p-3 mt-2">
          <div className="text-slate-400 text-xs">🔧 {name}</div>
        </div>
      )
  }
}
