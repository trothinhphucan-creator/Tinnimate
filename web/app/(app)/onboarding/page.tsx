'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLangStore } from '@/stores/use-lang-store'

const T = {
  vi: {
    steps: ['Chào mừng', 'Triệu chứng', 'Mức độ', 'Đề xuất'],
    welcome: {
      title: 'Chào mừng đến với TinniMate! 💙',
      subtitle: 'Tôi là Tinni — người bạn đồng hành giúp bạn quản lý ù tai.',
      features: [
        '🎧 Âm thanh trị liệu cá nhân hóa',
        '📋 Đánh giá mức độ ù tai chuyên sâu',
        '🧘 Bài tập thư giãn & hít thở',
        '📊 Theo dõi tiến triển hàng ngày',
      ],
      next: 'Bắt đầu →',
    },
    symptoms: {
      title: 'Về triệu chứng ù tai của bạn',
      subtitle: 'Giúp Tinni hiểu rõ hơn để đề xuất phù hợp',
      type: 'Loại ù tai',
      types: ['Tiếng rít (tần số cao)', 'Tiếng vo (tần số thấp)', 'Tiếng nhịp (pulse)', 'Tiếng click', 'Khó mô tả'],
      ear: 'Vị trí',
      ears: ['Tai trái', 'Tai phải', 'Cả hai tai', 'Trong đầu'],
      frequency: 'Tần suất',
      frequencies: ['Liên tục', 'Hàng ngày', 'Vài lần/tuần', 'Thỉnh thoảng'],
      next: 'Tiếp tục →',
    },
    severity: {
      title: 'Mức độ ảnh hưởng',
      subtitle: 'Đánh giá nhanh 3 câu để hiểu mức độ',
      questions: [
        'Ù tai ảnh hưởng đến giấc ngủ?',
        'Ù tai ảnh hưởng đến công việc/học tập?',
        'Ù tai khiến bạn căng thẳng/lo lắng?',
      ],
      options: ['Không', 'Ít', 'Vừa', 'Nhiều', 'Rất nhiều'],
      next: 'Xem kết quả →',
    },
    results: {
      title: 'Đề xuất cho bạn',
      levels: ['Nhẹ', 'Trung bình', 'Nặng'],
      levelDescs: [
        'Ù tai ảnh hưởng ít. Âm thanh trị liệu và thư giãn sẽ giúp bạn!',
        'Ù tai ảnh hưởng vừa phải. Kết hợp âm thanh trị liệu + check-in hàng ngày.',
        'Ù tai ảnh hưởng nhiều. Nên kết hợp đánh giá chuyên sâu + liệu pháp + tư vấn bác sĩ.',
      ],
      recommended: 'Công cụ đề xuất:',
      tools: {
        sound: '🎧 Âm thanh trị liệu',
        quiz: '📋 Đánh giá THI chi tiết',
        relax: '🧘 Bài tập thư giãn',
        checkin: '📝 Check-in hàng ngày',
        hearing: '👂 Kiểm tra thính lực',
      },
      start: '🚀 Bắt đầu sử dụng TinniMate',
    },
  },
  en: {
    steps: ['Welcome', 'Symptoms', 'Severity', 'Recommendations'],
    welcome: {
      title: 'Welcome to TinniMate! 💙',
      subtitle: "I'm Tinni — your companion for managing tinnitus.",
      features: [
        '🎧 Personalized sound therapy',
        '📋 Clinical tinnitus assessments',
        '🧘 Relaxation & breathing exercises',
        '📊 Daily progress tracking',
      ],
      next: 'Get Started →',
    },
    symptoms: {
      title: 'About your tinnitus',
      subtitle: 'Help Tinni understand your symptoms for better recommendations',
      type: 'Tinnitus type',
      types: ['Ringing (high pitch)', 'Buzzing (low pitch)', 'Pulsing', 'Clicking', 'Hard to describe'],
      ear: 'Location',
      ears: ['Left ear', 'Right ear', 'Both ears', 'In head'],
      frequency: 'Frequency',
      frequencies: ['Constant', 'Daily', 'Several times/week', 'Occasionally'],
      next: 'Continue →',
    },
    severity: {
      title: 'Impact level',
      subtitle: 'Quick 3-question assessment',
      questions: [
        'Does tinnitus affect your sleep?',
        'Does tinnitus affect your work/study?',
        'Does tinnitus cause stress/anxiety?',
      ],
      options: ['Not at all', 'A little', 'Moderate', 'A lot', 'Severely'],
      next: 'See Results →',
    },
    results: {
      title: 'Your Recommendations',
      levels: ['Mild', 'Moderate', 'Severe'],
      levelDescs: [
        'Tinnitus has a mild impact. Sound therapy and relaxation will help!',
        'Moderate tinnitus impact. Combine sound therapy + daily check-ins.',
        'Significant tinnitus impact. Consider clinical assessment + therapy + doctor consultation.',
      ],
      recommended: 'Recommended tools:',
      tools: {
        sound: '🎧 Sound Therapy',
        quiz: '📋 Detailed THI Assessment',
        relax: '🧘 Relaxation Exercises',
        checkin: '📝 Daily Check-in',
        hearing: '👂 Hearing Test',
      },
      start: '🚀 Start Using TinniMate',
    },
  },
}

export default function OnboardingPage() {
  const router = useRouter()
  const { lang } = useLangStore()
  const d = T[lang]
  const [step, setStep] = useState(0)
  const [symptoms, setSymptoms] = useState({ type: 0, ear: 0, frequency: 0 })
  const [severity, setSeverity] = useState<number[]>([])

  const totalScore = severity.reduce((a, b) => a + b, 0)
  const level = totalScore <= 4 ? 0 : totalScore <= 8 ? 1 : 2

  const handleFinish = async () => {
    // Save onboarding data
    try {
      await fetch('/api/save-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz_type: 'ONBOARDING',
          total_score: totalScore,
          severity: d.results.levels[level],
          answers: { symptoms, severity },
        }),
      })
    } catch { /* ignore */ }
    router.push('/chat')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {d.steps.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-full h-1.5 rounded-full transition-all ${
                i <= step ? 'bg-gradient-to-r from-blue-500 to-violet-500' : 'bg-white/10'
              }`} />
              <span className={`text-[9px] ${i <= step ? 'text-blue-400' : 'text-slate-600'}`}>{s}</span>
            </div>
          ))}
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center space-y-6 animate-in fade-in">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/30 flex items-center justify-center text-4xl">
              💙
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{d.welcome.title}</h1>
              <p className="text-sm text-slate-400 mt-2">{d.welcome.subtitle}</p>
            </div>
            <div className="text-left space-y-2">
              {d.welcome.features.map(f => (
                <div key={f} className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-xl p-3">
                  <span className="text-sm">{f}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setStep(1)}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold rounded-xl hover:from-blue-500 hover:to-violet-500 transition-all">
              {d.welcome.next}
            </button>
          </div>
        )}

        {/* Step 1: Symptoms */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">{d.symptoms.title}</h2>
              <p className="text-xs text-slate-400 mt-1">{d.symptoms.subtitle}</p>
            </div>

            {[
              { label: d.symptoms.type, options: d.symptoms.types, key: 'type' as const },
              { label: d.symptoms.ear, options: d.symptoms.ears, key: 'ear' as const },
              { label: d.symptoms.frequency, options: d.symptoms.frequencies, key: 'frequency' as const },
            ].map(({ label, options, key }) => (
              <div key={key}>
                <p className="text-xs text-slate-400 mb-2">{label}</p>
                <div className="grid grid-cols-2 gap-2">
                  {options.map((opt, i) => (
                    <button key={opt} onClick={() => setSymptoms({ ...symptoms, [key]: i })}
                      className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                        symptoms[key] === i
                          ? 'bg-blue-600/20 border-blue-500/40 text-blue-300 font-medium'
                          : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.05]'
                      }`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button onClick={() => setStep(2)}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold rounded-xl">
              {d.symptoms.next}
            </button>
          </div>
        )}

        {/* Step 2: Severity */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">{d.severity.title}</h2>
              <p className="text-xs text-slate-400 mt-1">{d.severity.subtitle}</p>
            </div>

            {d.severity.questions.map((q, qi) => (
              <div key={qi}>
                <p className="text-sm text-white mb-2">{qi + 1}. {q}</p>
                <div className="flex gap-1.5">
                  {d.severity.options.map((opt, oi) => (
                    <button key={opt} onClick={() => {
                      const newSev = [...severity]
                      newSev[qi] = oi
                      setSeverity(newSev)
                    }}
                      className={`flex-1 py-2 text-[10px] rounded-lg border transition-all ${
                        severity[qi] === oi
                          ? 'bg-violet-600/20 border-violet-500/40 text-violet-300 font-semibold'
                          : 'bg-white/[0.02] border-white/5 text-slate-500 hover:text-white'
                      }`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button onClick={() => setStep(3)}
              disabled={severity.length < 3}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl disabled:opacity-40">
              {d.severity.next}
            </button>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">{d.results.title}</h2>
            </div>

            <div className={`p-5 rounded-2xl border text-center ${
              level === 0 ? 'bg-emerald-500/10 border-emerald-500/20' :
              level === 1 ? 'bg-amber-500/10 border-amber-500/20' :
              'bg-red-500/10 border-red-500/20'
            }`}>
              <div className="text-3xl mb-2">{level === 0 ? '😊' : level === 1 ? '😐' : '😟'}</div>
              <div className={`text-lg font-bold ${
                level === 0 ? 'text-emerald-400' : level === 1 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {d.results.levels[level]}
              </div>
              <p className="text-xs text-slate-400 mt-2">{d.results.levelDescs[level]}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400 mb-2">{d.results.recommended}</p>
              <div className="space-y-2">
                {Object.values(d.results.tools)
                  .filter((_, i) => level === 2 || i < 3 + level)
                  .map(tool => (
                    <div key={tool} className="bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-sm text-white">
                      {tool}
                    </div>
                  ))}
              </div>
            </div>

            <button onClick={handleFinish}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-500 hover:to-teal-500 transition-all">
              {d.results.start}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
