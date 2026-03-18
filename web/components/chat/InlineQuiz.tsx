'use client'

import React, { useState } from 'react'
import { useLangStore } from '@/stores/use-lang-store'

/* ── Quiz Definitions ── */
interface QuizQuestion {
  id: number
  text: string
  options: { value: number; label: string }[]
}

interface QuizDef {
  name: string
  fullName: string
  description: string
  emoji: string
  questions: QuizQuestion[]
  scoringFn: (answers: number[]) => { score: number; label: string; color: string; interpretation: string }
}

const LIKERT_4 = [
  { value: 0, label: 'Không' },
  { value: 1, label: 'Nhẹ' },
  { value: 2, label: 'Trung bình' },
  { value: 3, label: 'Nặng' },
  { value: 4, label: 'Rất nặng' },
]

const LIKERT_PHQ = [
  { value: 0, label: 'Không hề' },
  { value: 1, label: 'Vài ngày' },
  { value: 2, label: 'Hơn nửa số ngày' },
  { value: 3, label: 'Gần như mỗi ngày' },
]

const LIKERT_TFI = [
  { value: 0, label: 'Hoàn toàn không (0)' },
  { value: 2, label: 'Nhẹ (2)' },
  { value: 4, label: 'Trung bình (4)' },
  { value: 6, label: 'Khá nhiều (6)' },
  { value: 8, label: 'Nặng (8)' },
  { value: 10, label: 'Cực kỳ nặng (10)' },
]

const LIKERT_ISI = [
  { value: 0, label: 'Không' },
  { value: 1, label: 'Nhẹ' },
  { value: 2, label: 'Trung bình' },
  { value: 3, label: 'Nặng' },
  { value: 4, label: 'Rất nặng' },
]

const QUIZZES: Record<string, QuizDef> = {
  THI: {
    name: 'THI',
    fullName: 'Tinnitus Handicap Inventory',
    description: 'Đánh giá mức độ ảnh hưởng của ù tai lên cuộc sống hàng ngày',
    emoji: '🔔',
    questions: [
      { id: 1, text: 'Tiếng ù tai khiến bạn khó tập trung?', options: LIKERT_4 },
      { id: 2, text: 'Tiếng ù tai khiến bạn khó nghe khi giao tiếp?', options: LIKERT_4 },
      { id: 3, text: 'Tiếng ù tai khiến bạn tức giận?', options: LIKERT_4 },
      { id: 4, text: 'Tiếng ù tai khiến bạn bối rối?', options: LIKERT_4 },
      { id: 5, text: 'Bạn cảm thấy tuyệt vọng vì ù tai?', options: LIKERT_4 },
      { id: 6, text: 'Bạn phàn nàn nhiều về ù tai?', options: LIKERT_4 },
      { id: 7, text: 'Ù tai ảnh hưởng giấc ngủ?', options: LIKERT_4 },
      { id: 8, text: 'Bạn cảm thấy không thể thoát khỏi ù tai?', options: LIKERT_4 },
      { id: 9, text: 'Ù tai ảnh hưởng hoạt động xã hội?', options: LIKERT_4 },
      { id: 10, text: 'Bạn cảm thấy thất vọng vì ù tai?', options: LIKERT_4 },
    ],
    scoringFn: (answers) => {
      const score = answers.reduce((a, b) => a + b, 0)
      const maxScore = answers.length * 4
      const pct = (score / maxScore) * 100
      if (pct <= 16) return { score, label: 'Nhẹ / Không đáng kể', color: '#10b981', interpretation: 'Ù tai ít ảnh hưởng cuộc sống' }
      if (pct <= 36) return { score, label: 'Mức nhẹ', color: '#84cc16', interpretation: 'Ù tai gây khó chịu nhẹ trong một số tình huống' }
      if (pct <= 56) return { score, label: 'Mức trung bình', color: '#f59e0b', interpretation: 'Ù tai ảnh hưởng đáng kể đến cuộc sống hàng ngày' }
      if (pct <= 76) return { score, label: 'Mức nặng', color: '#f97316', interpretation: 'Ù tai ảnh hưởng nghiêm trọng đến nhiều hoạt động' }
      return { score, label: 'Rất nặng', color: '#ef4444', interpretation: 'Ù tai gây ảnh hưởng rất lớn, cần can thiệp chuyên sâu' }
    },
  },
  PHQ9: {
    name: 'PHQ-9',
    fullName: 'Patient Health Questionnaire',
    description: 'Sàng lọc trầm cảm — 9 câu hỏi đánh giá tâm trạng 2 tuần qua',
    emoji: '💭',
    questions: [
      { id: 1, text: 'Ít hứng thú hoặc niềm vui khi làm việc?', options: LIKERT_PHQ },
      { id: 2, text: 'Cảm thấy buồn, chán nản, hoặc tuyệt vọng?', options: LIKERT_PHQ },
      { id: 3, text: 'Khó ngủ, ngủ không yên, hoặc ngủ quá nhiều?', options: LIKERT_PHQ },
      { id: 4, text: 'Cảm thấy mệt mỏi hoặc thiếu năng lượng?', options: LIKERT_PHQ },
      { id: 5, text: 'Ăn không ngon hoặc ăn quá nhiều?', options: LIKERT_PHQ },
      { id: 6, text: 'Cảm thấy bản thân tồi tệ, thất bại?', options: LIKERT_PHQ },
      { id: 7, text: 'Khó tập trung vào việc đọc báo hoặc xem TV?', options: LIKERT_PHQ },
      { id: 8, text: 'Di chuyển hoặc nói chậm hơn bình thường? Hoặc bồn chồn, đứng ngồi không yên?', options: LIKERT_PHQ },
      { id: 9, text: 'Có suy nghĩ về việc tự làm hại bản thân?', options: LIKERT_PHQ },
    ],
    scoringFn: (answers) => {
      const score = answers.reduce((a, b) => a + b, 0)
      if (score <= 4) return { score, label: 'Bình thường', color: '#10b981', interpretation: 'Không có dấu hiệu trầm cảm' }
      if (score <= 9) return { score, label: 'Trầm cảm nhẹ', color: '#f59e0b', interpretation: 'Cần theo dõi, có thể cải thiện bằng tự chăm sóc' }
      if (score <= 14) return { score, label: 'Trầm cảm vừa', color: '#f97316', interpretation: 'Nên tham vấn chuyên gia tâm lý' }
      if (score <= 19) return { score, label: 'Trầm cảm nặng vừa', color: '#ef4444', interpretation: 'Cần can thiệp chuyên môn' }
      return { score, label: 'Trầm cảm nặng', color: '#dc2626', interpretation: 'Cần can thiệp chuyên sâu ngay' }
    },
  },
  GAD7: {
    name: 'GAD-7',
    fullName: 'Generalized Anxiety Disorder',
    description: 'Đánh giá lo âu — 7 câu hỏi về 2 tuần qua',
    emoji: '😰',
    questions: [
      { id: 1, text: 'Cảm thấy lo lắng, bồn chồn?', options: LIKERT_PHQ },
      { id: 2, text: 'Không thể ngừng hoặc kiểm soát lo lắng?', options: LIKERT_PHQ },
      { id: 3, text: 'Lo lắng quá nhiều về nhiều thứ?', options: LIKERT_PHQ },
      { id: 4, text: 'Khó thư giãn?', options: LIKERT_PHQ },
      { id: 5, text: 'Bồn chồn đến mức khó ngồi yên?', options: LIKERT_PHQ },
      { id: 6, text: 'Dễ bị cáu gắt?', options: LIKERT_PHQ },
      { id: 7, text: 'Sợ hãi như thể điều tồi tệ sắp xảy ra?', options: LIKERT_PHQ },
    ],
    scoringFn: (answers) => {
      const score = answers.reduce((a, b) => a + b, 0)
      if (score <= 4) return { score, label: 'Lo âu nhẹ', color: '#10b981', interpretation: 'Trong giới hạn bình thường' }
      if (score <= 9) return { score, label: 'Lo âu vừa', color: '#f59e0b', interpretation: 'Cần theo dõi thường xuyên' }
      if (score <= 14) return { score, label: 'Lo âu nặng vừa', color: '#f97316', interpretation: 'Nên tham vấn chuyên gia' }
      return { score, label: 'Lo âu nặng', color: '#ef4444', interpretation: 'Cần can thiệp chuyên sâu' }
    },
  },
  TFI: {
    name: 'TFI',
    fullName: 'Tinnitus Functional Index',
    description: 'Đánh giá tác động của ù tai lên các hoạt động chức năng',
    emoji: '📊',
    questions: [
      { id: 1, text: 'Trong tuần qua, tỷ lệ % thời gian bạn nhận thức rõ tiếng ù tai?', options: LIKERT_TFI },
      { id: 2, text: 'Tiếng ù tai mạnh đến mức nào?', options: LIKERT_TFI },
      { id: 3, text: 'Tỷ lệ % thời gian ù tai gây phiền toái?', options: LIKERT_TFI },
      { id: 4, text: 'Ù tai khiến bạn cảm thấy mất kiểm soát?', options: LIKERT_TFI },
      { id: 5, text: 'Ù tai khiến bạn khó tập trung?', options: LIKERT_TFI },
      { id: 6, text: 'Ù tai khiến bạn khó suy nghĩ rõ ràng?', options: LIKERT_TFI },
      { id: 7, text: 'Ù tai ảnh hưởng khả năng nghe rõ?', options: LIKERT_TFI },
      { id: 8, text: 'Ù tai ảnh hưởng giấc ngủ?', options: LIKERT_TFI },
      { id: 9, text: 'Ù tai gây khó chịu khi cố gắng nghỉ ngơi?', options: LIKERT_TFI },
      { id: 10, text: 'Ù tai khiến bạn cảm thấy lo lắng?', options: LIKERT_TFI },
      { id: 11, text: 'Ù tai khiến bạn buồn phiền?', options: LIKERT_TFI },
      { id: 12, text: 'Ù tai khiến bạn cảm thấy khó chịu, bực bội?', options: LIKERT_TFI },
    ],
    scoringFn: (answers) => {
      const score = Math.round((answers.reduce((a, b) => a + b, 0) / (answers.length * 10)) * 100)
      if (score <= 17) return { score, label: 'Không đáng kể', color: '#10b981', interpretation: 'Ù tai ít hoặc không ảnh hưởng chức năng' }
      if (score <= 31) return { score, label: 'Nhẹ', color: '#84cc16', interpretation: 'Ù tai gây ảnh hưởng nhẹ đến hoạt động hàng ngày' }
      if (score <= 53) return { score, label: 'Trung bình', color: '#f59e0b', interpretation: 'Ù tai ảnh hưởng đáng kể đến chức năng hàng ngày' }
      if (score <= 72) return { score, label: 'Nặng', color: '#f97316', interpretation: 'Ù tai gây suy giảm chức năng nghiêm trọng' }
      return { score, label: 'Rất nặng', color: '#ef4444', interpretation: 'Ù tai gây ảnh hưởng rất nặng, cần can thiệp chuyên sâu' }
    },
  },
  ISI: {
    name: 'ISI',
    fullName: 'Insomnia Severity Index',
    description: 'Đánh giá mức độ nghiêm trọng của chứng mất ngủ',
    emoji: '🌙',
    questions: [
      { id: 1, text: 'Khó vào giấc ngủ?', options: LIKERT_ISI },
      { id: 2, text: 'Khó duy trì giấc ngủ (thức dậy giữa đêm)?', options: LIKERT_ISI },
      { id: 3, text: 'Thức dậy quá sớm vào buổi sáng?', options: LIKERT_ISI },
      { id: 4, text: 'Bạn hài lòng với kiểu ngủ hiện tại ở mức nào?', options: [
        { value: 0, label: 'Rất hài lòng' }, { value: 1, label: 'Hài lòng' },
        { value: 2, label: 'Trung bình' }, { value: 3, label: 'Không hài lòng' },
        { value: 4, label: 'Rất không hài lòng' },
      ]},
      { id: 5, text: 'Mất ngủ ảnh hưởng đến hoạt động ban ngày ở mức nào?', options: LIKERT_ISI },
      { id: 6, text: 'Người khác có nhận thấy chất lượng sống của bạn giảm do mất ngủ?', options: LIKERT_ISI },
      { id: 7, text: 'Bạn lo lắng về vấn đề mất ngủ ở mức nào?', options: LIKERT_ISI },
    ],
    scoringFn: (answers) => {
      const score = answers.reduce((a, b) => a + b, 0)
      if (score <= 7) return { score, label: 'Không mất ngủ', color: '#10b981', interpretation: 'Giấc ngủ trong giới hạn bình thường' }
      if (score <= 14) return { score, label: 'Mất ngủ nhẹ', color: '#f59e0b', interpretation: 'Cần theo dõi và cải thiện vệ sinh giấc ngủ' }
      if (score <= 21) return { score, label: 'Mất ngủ trung bình', color: '#f97316', interpretation: 'Nên tham vấn bác sĩ về giấc ngủ' }
      return { score, label: 'Mất ngủ nặng', color: '#ef4444', interpretation: 'Cần can thiệp chuyên sâu về giấc ngủ' }
    },
  },
}

interface Props {
  quizType?: string
  onResult?: (data: Record<string, unknown>) => void
}

export function InlineQuiz({ quizType = 'THI', onResult }: Props) {
  const { lang } = useLangStore()
  const isEn = lang === 'en'
  const quiz = QUIZZES[quizType] ?? QUIZZES.THI
  const [started, setStarted] = useState(false)
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [result, setResult] = useState<ReturnType<typeof quiz.scoringFn> | null>(null)

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers, value]
    setAnswers(newAnswers)

    if (currentQ + 1 >= quiz.questions.length) {
      // Done
      const r = quiz.scoringFn(newAnswers)
      setResult(r)
      onResult?.({
        quiz_type: quiz.name,
        score: r.score,
        maxScore: quiz.questions.length * (quiz.questions[0].options.length - 1),
        label: r.label,
        interpretation: r.interpretation,
        answers: newAnswers,
      })
    } else {
      setCurrentQ(currentQ + 1)
    }
  }

  const restart = () => {
    setStarted(false)
    setCurrentQ(0)
    setAnswers([])
    setResult(null)
  }

  const progressPct = quiz.questions.length > 0 ? (currentQ / quiz.questions.length) * 100 : 0

  return (
    <div className="bg-gradient-to-br from-purple-900/30 to-slate-800 border border-purple-500/20 rounded-xl overflow-hidden mt-2">
      {/* Intro */}
      {!started && !result && (
        <div className="p-4 text-center space-y-3">
          <div className="text-2xl">{quiz.emoji}</div>
          <h3 className="text-sm font-bold text-white">{quiz.name}</h3>
          <p className="text-[10px] text-slate-400">{quiz.fullName}</p>
          <p className="text-xs text-slate-300">{quiz.description}</p>
          <p className="text-[10px] text-slate-500">{quiz.questions.length} {isEn ? 'questions' : 'câu hỏi'}</p>
          <button onClick={() => setStarted(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-lg font-semibold transition-colors">
            {isEn ? '📋 Start Assessment' : '📋 Bắt Đầu Đánh Giá'}
          </button>
        </div>
      )}

      {/* Questions */}
      {started && !result && (
        <div className="p-4 space-y-3">
          {/* Progress */}
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>{quiz.name}</span>
            <span>{currentQ + 1}/{quiz.questions.length}</span>
          </div>
          <div className="h-1 bg-slate-700/50 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all" style={{ width: `${progressPct}%` }} />
          </div>

          {/* Question */}
          <p className="text-sm text-white font-medium">
            {quiz.questions[currentQ].text}
          </p>

          {/* Options */}
          <div className="space-y-1.5">
            {quiz.questions[currentQ].options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleAnswer(opt.value)}
                className="w-full text-left px-3 py-2 bg-slate-700/40 border border-slate-600/30 rounded-lg text-xs text-slate-200 hover:bg-purple-600/20 hover:border-purple-500/30 transition-colors"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="p-4 space-y-3 text-center">
          <h3 className="text-sm font-bold text-white">{isEn ? '📊 Results' : '📊 Kết Quả'} {quiz.name}</h3>
          <div className="bg-slate-700/40 rounded-lg p-3">
            <div className="text-2xl font-bold" style={{ color: result.color }}>
              {result.score}/{quiz.questions.length * (quiz.questions[0].options.length - 1)}
            </div>
            <div className="text-xs font-medium mt-1" style={{ color: result.color }}>
              {result.label}
            </div>
          </div>
          <p className="text-xs text-slate-400">{result.interpretation}</p>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 text-[10px] text-amber-300">
            {isEn ? '⚠️ Results are for reference only. Please consult a healthcare professional for accurate evaluation.' : '⚠️ Kết quả chỉ mang tính tham khảo. Vui lòng tham vấn chuyên gia y tế để được đánh giá chính xác.'}
          </div>
          <button onClick={restart} className="text-[10px] text-slate-500 hover:text-white transition-colors">
            {isEn ? '🔄 Start Over' : '🔄 Làm lại'}
          </button>
        </div>
      )}
    </div>
  )
}
