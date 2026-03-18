'use client'

import { useState } from 'react'
import { useLangStore } from '@/stores/use-lang-store'
import { Brain, ChevronRight, CheckCircle2, Lock } from 'lucide-react'

interface Module {
  week: number
  title: string
  titleVi: string
  desc: string
  descVi: string
  emoji: string
  exercises: { label: string; labelVi: string; type: 'read' | 'practice' | 'quiz' }[]
}

const MODULES: Module[] = [
  {
    week: 1, emoji: '📖',
    title: 'Understanding Tinnitus & Sleep',
    titleVi: 'Hiểu Về Ù Tai & Giấc Ngủ',
    desc: 'Learn the tinnitus-insomnia cycle and set your baseline.',
    descVi: 'Tìm hiểu vòng xoáy ù tai-mất ngủ và thiết lập baseline.',
    exercises: [
      { label: 'The Tinnitus-Sleep Cycle', labelVi: 'Vòng xoáy ù tai-mất ngủ', type: 'read' },
      { label: 'Sleep Diary Setup', labelVi: 'Thiết lập nhật ký giấc ngủ', type: 'practice' },
      { label: 'Baseline Assessment', labelVi: 'Đánh giá baseline', type: 'quiz' },
    ],
  },
  {
    week: 2, emoji: '🛏️',
    title: 'Sleep Restriction & Stimulus Control',
    titleVi: 'Hạn Chế Giấc Ngủ & Kiểm Soát Kích Thích',
    desc: 'Build sleep pressure and reset your bed-sleep association.',
    descVi: 'Tạo áp lực ngủ và thiết lập lại liên kết giường-ngủ.',
    exercises: [
      { label: 'Calculate Your Sleep Window', labelVi: 'Tính cửa sổ giấc ngủ', type: 'practice' },
      { label: 'Stimulus Control Rules', labelVi: 'Quy tắc kiểm soát kích thích', type: 'read' },
      { label: 'Create a Wind-Down Routine', labelVi: 'Tạo thói quen thư giãn trước ngủ', type: 'practice' },
    ],
  },
  {
    week: 3, emoji: '🧠',
    title: 'Cognitive Restructuring',
    titleVi: 'Tái Cấu Trúc Nhận Thức',
    desc: 'Challenge unhelpful thoughts about tinnitus and sleep.',
    descVi: 'Thách thức những suy nghĩ tiêu cực về ù tai và giấc ngủ.',
    exercises: [
      { label: 'Identify Thought Patterns', labelVi: 'Nhận diện khuôn mẫu suy nghĩ', type: 'read' },
      { label: 'Thought Challenging Worksheet', labelVi: 'Bài tập thách thức suy nghĩ', type: 'practice' },
      { label: 'Reframing Exercise', labelVi: 'Bài tập thay đổi góc nhìn', type: 'practice' },
    ],
  },
  {
    week: 4, emoji: '🎯',
    title: 'Relaxation & Maintenance',
    titleVi: 'Thư Giãn & Duy Trì',
    desc: 'Master relaxation techniques and build long-term habits.',
    descVi: 'Thành thạo kỹ thuật thư giãn và xây dựng thói quen dài hạn.',
    exercises: [
      { label: 'Progressive Muscle Relaxation', labelVi: 'Thư giãn cơ tiến triển', type: 'practice' },
      { label: '4-7-8 Breathing for Sleep', labelVi: 'Hít thở 4-7-8 cho giấc ngủ', type: 'practice' },
      { label: 'My Maintenance Plan', labelVi: 'Kế hoạch duy trì', type: 'quiz' },
    ],
  },
]

const TYPE_COLORS = { read: 'text-blue-400', practice: 'text-emerald-400', quiz: 'text-amber-400' }
const TYPE_LABELS = { read: { vi: '📖 Đọc', en: '📖 Read' }, practice: { vi: '🏋️ Thực hành', en: '🏋️ Practice' }, quiz: { vi: '📋 Đánh giá', en: '📋 Assess' } }

export default function CBTiPage() {
  const { lang } = useLangStore()
  const isEn = lang === 'en'
  const [currentWeek, setCurrentWeek] = useState(0)
  const [completedEx, setCompletedEx] = useState<Set<string>>(new Set())

  const toggleEx = (key: string) => {
    const next = new Set(completedEx)
    if (next.has(key)) next.delete(key); else next.add(key)
    setCompletedEx(next)
  }

  const mod = MODULES[currentWeek]
  const progress = MODULES.map((m, wi) =>
    m.exercises.filter((_, ei) => completedEx.has(`${wi}-${ei}`)).length / m.exercises.length
  )

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] right-[20%] w-[250px] h-[250px] rounded-full bg-violet-600/6 blur-[100px]" />
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <Brain size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">CBT-i</h1>
          <p className="text-xs text-slate-400">
            {isEn ? 'Cognitive Behavioral Therapy for Insomnia' : 'Liệu Pháp Nhận Thức Hành Vi Cho Mất Ngủ'}
          </p>
        </div>
      </div>

      {/* Week selector */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {MODULES.map((m, i) => (
          <button key={i} onClick={() => setCurrentWeek(i)}
            className={`relative py-3 rounded-xl border text-xs transition-all ${
              currentWeek === i
                ? 'bg-violet-600/20 border-violet-500/30 text-violet-300 font-semibold'
                : 'bg-white/[0.02] border-white/5 text-slate-500 hover:text-white'
            }`}>
            <div className="text-xl mb-1">{m.emoji}</div>
            <div>{isEn ? `Week ${m.week}` : `Tuần ${m.week}`}</div>
            {/* Progress ring */}
            <div className="absolute top-1 right-1 w-4 h-4">
              <svg viewBox="0 0 16 16" className="w-full h-full -rotate-90">
                <circle cx="8" cy="8" r="6" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                <circle cx="8" cy="8" r="6" fill="none" stroke="#8b5cf6" strokeWidth="2"
                  strokeDasharray={`${progress[i] * 37.7} 37.7`} />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {/* Current module */}
      <div className="bg-white/[0.02] backdrop-blur border border-white/5 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{mod.emoji}</span>
          <h2 className="font-semibold text-white text-sm">
            {isEn ? mod.title : mod.titleVi}
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-5">{isEn ? mod.desc : mod.descVi}</p>

        <div className="space-y-3">
          {mod.exercises.map((ex, ei) => {
            const key = `${currentWeek}-${ei}`
            const done = completedEx.has(key)
            const locked = currentWeek > 0 && progress[currentWeek - 1] < 0.5
            return (
              <button key={ei} disabled={locked}
                onClick={() => toggleEx(key)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  done
                    ? 'bg-violet-600/10 border-violet-500/20'
                    : locked
                      ? 'bg-white/[0.01] border-white/5 opacity-40 cursor-not-allowed'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                }`}>
                <div className="flex-shrink-0">
                  {locked ? <Lock size={16} className="text-slate-600" /> :
                   done ? <CheckCircle2 size={16} className="text-violet-400" /> :
                   <div className="w-4 h-4 rounded-full border border-slate-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">{isEn ? ex.label : ex.labelVi}</div>
                  <div className={`text-[10px] ${TYPE_COLORS[ex.type]}`}>
                    {isEn ? TYPE_LABELS[ex.type].en : TYPE_LABELS[ex.type].vi}
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-600 flex-shrink-0" />
              </button>
            )
          })}
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
        <p className="text-[10px] text-slate-500">
          💡 {isEn
            ? 'Complete 50% of the previous week to unlock the next. Each module takes ~15 minutes.'
            : 'Hoàn thành 50% tuần trước để mở tuần tiếp theo. Mỗi module mất ~15 phút.'}
        </p>
      </div>
    </div>
  )
}
