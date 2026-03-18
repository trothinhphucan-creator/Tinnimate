'use client'

import React, { useState } from 'react'
import { useLangStore } from '@/stores/use-lang-store'

/* ── Bilingual Quiz Definitions ── */
interface QuizQuestion {
  id: number
  text: string
  textEn: string
  options: { value: number; label: string; labelEn: string }[]
}

interface ScoringResult {
  score: number; label: string; labelEn: string; color: string; interpretation: string; interpretationEn: string
}

interface QuizDef {
  name: string
  fullName: string
  description: string
  descriptionEn: string
  emoji: string
  questions: QuizQuestion[]
  scoringFn: (answers: number[]) => ScoringResult
}

/* ── Likert Scales (bilingual) ── */
const LIKERT_4 = [
  { value: 0, label: 'Không', labelEn: 'No' },
  { value: 1, label: 'Nhẹ', labelEn: 'Mild' },
  { value: 2, label: 'Trung bình', labelEn: 'Moderate' },
  { value: 3, label: 'Nặng', labelEn: 'Severe' },
  { value: 4, label: 'Rất nặng', labelEn: 'Very severe' },
]

const LIKERT_PHQ = [
  { value: 0, label: 'Không hề', labelEn: 'Not at all' },
  { value: 1, label: 'Vài ngày', labelEn: 'Several days' },
  { value: 2, label: 'Hơn nửa số ngày', labelEn: 'More than half the days' },
  { value: 3, label: 'Gần như mỗi ngày', labelEn: 'Nearly every day' },
]

const LIKERT_TFI = [
  { value: 0, label: 'Hoàn toàn không (0)', labelEn: 'Not at all (0)' },
  { value: 2, label: 'Nhẹ (2)', labelEn: 'Mild (2)' },
  { value: 4, label: 'Trung bình (4)', labelEn: 'Moderate (4)' },
  { value: 6, label: 'Khá nhiều (6)', labelEn: 'Quite a lot (6)' },
  { value: 8, label: 'Nặng (8)', labelEn: 'Severe (8)' },
  { value: 10, label: 'Cực kỳ nặng (10)', labelEn: 'Extremely severe (10)' },
]

const LIKERT_ISI = [
  { value: 0, label: 'Không', labelEn: 'None' },
  { value: 1, label: 'Nhẹ', labelEn: 'Mild' },
  { value: 2, label: 'Trung bình', labelEn: 'Moderate' },
  { value: 3, label: 'Nặng', labelEn: 'Severe' },
  { value: 4, label: 'Rất nặng', labelEn: 'Very severe' },
]

/* ── Quiz Definitions ── */
const QUIZZES: Record<string, QuizDef> = {
  THI: {
    name: 'THI',
    fullName: 'Tinnitus Handicap Inventory',
    description: 'Đánh giá mức độ ảnh hưởng của ù tai lên cuộc sống hàng ngày',
    descriptionEn: 'Assess how tinnitus affects your daily life',
    emoji: '🔔',
    questions: [
      { id: 1, text: 'Tiếng ù tai khiến bạn khó tập trung?', textEn: 'Does tinnitus make it hard for you to concentrate?', options: LIKERT_4 },
      { id: 2, text: 'Tiếng ù tai khiến bạn khó nghe khi giao tiếp?', textEn: 'Does tinnitus make it hard for you to hear when talking?', options: LIKERT_4 },
      { id: 3, text: 'Tiếng ù tai khiến bạn tức giận?', textEn: 'Does tinnitus make you angry?', options: LIKERT_4 },
      { id: 4, text: 'Tiếng ù tai khiến bạn bối rối?', textEn: 'Does tinnitus make you confused?', options: LIKERT_4 },
      { id: 5, text: 'Bạn cảm thấy tuyệt vọng vì ù tai?', textEn: 'Do you feel desperate because of tinnitus?', options: LIKERT_4 },
      { id: 6, text: 'Bạn phàn nàn nhiều về ù tai?', textEn: 'Do you complain a lot about tinnitus?', options: LIKERT_4 },
      { id: 7, text: 'Ù tai ảnh hưởng giấc ngủ?', textEn: 'Does tinnitus interfere with your sleep?', options: LIKERT_4 },
      { id: 8, text: 'Bạn cảm thấy không thể thoát khỏi ù tai?', textEn: 'Do you feel you cannot escape from tinnitus?', options: LIKERT_4 },
      { id: 9, text: 'Ù tai ảnh hưởng hoạt động xã hội?', textEn: 'Does tinnitus affect your social activities?', options: LIKERT_4 },
      { id: 10, text: 'Bạn cảm thấy thất vọng vì ù tai?', textEn: 'Do you feel frustrated because of tinnitus?', options: LIKERT_4 },
    ],
    scoringFn: (answers) => {
      const score = answers.reduce((a, b) => a + b, 0)
      const maxScore = answers.length * 4
      const pct = (score / maxScore) * 100
      if (pct <= 16) return { score, label: 'Nhẹ / Không đáng kể', labelEn: 'Slight / Not significant', color: '#10b981', interpretation: 'Ù tai ít ảnh hưởng cuộc sống', interpretationEn: 'Tinnitus has minimal impact on daily life' }
      if (pct <= 36) return { score, label: 'Mức nhẹ', labelEn: 'Mild', color: '#84cc16', interpretation: 'Ù tai gây khó chịu nhẹ trong một số tình huống', interpretationEn: 'Tinnitus causes mild discomfort in some situations' }
      if (pct <= 56) return { score, label: 'Mức trung bình', labelEn: 'Moderate', color: '#f59e0b', interpretation: 'Ù tai ảnh hưởng đáng kể đến cuộc sống hàng ngày', interpretationEn: 'Tinnitus significantly impacts daily life' }
      if (pct <= 76) return { score, label: 'Mức nặng', labelEn: 'Severe', color: '#f97316', interpretation: 'Ù tai ảnh hưởng nghiêm trọng đến nhiều hoạt động', interpretationEn: 'Tinnitus severely affects many activities' }
      return { score, label: 'Rất nặng', labelEn: 'Very severe', color: '#ef4444', interpretation: 'Ù tai gây ảnh hưởng rất lớn, cần can thiệp chuyên sâu', interpretationEn: 'Tinnitus has a very large impact, specialist intervention needed' }
    },
  },
  PHQ9: {
    name: 'PHQ-9',
    fullName: 'Patient Health Questionnaire',
    description: 'Sàng lọc trầm cảm — 9 câu hỏi đánh giá tâm trạng 2 tuần qua',
    descriptionEn: 'Depression screening — 9 questions about the past 2 weeks',
    emoji: '💭',
    questions: [
      { id: 1, text: 'Ít hứng thú hoặc niềm vui khi làm việc?', textEn: 'Little interest or pleasure in doing things?', options: LIKERT_PHQ },
      { id: 2, text: 'Cảm thấy buồn, chán nản, hoặc tuyệt vọng?', textEn: 'Feeling down, depressed, or hopeless?', options: LIKERT_PHQ },
      { id: 3, text: 'Khó ngủ, ngủ không yên, hoặc ngủ quá nhiều?', textEn: 'Trouble falling asleep, staying asleep, or sleeping too much?', options: LIKERT_PHQ },
      { id: 4, text: 'Cảm thấy mệt mỏi hoặc thiếu năng lượng?', textEn: 'Feeling tired or having little energy?', options: LIKERT_PHQ },
      { id: 5, text: 'Ăn không ngon hoặc ăn quá nhiều?', textEn: 'Poor appetite or overeating?', options: LIKERT_PHQ },
      { id: 6, text: 'Cảm thấy bản thân tồi tệ, thất bại?', textEn: 'Feeling bad about yourself, or that you are a failure?', options: LIKERT_PHQ },
      { id: 7, text: 'Khó tập trung vào việc đọc báo hoặc xem TV?', textEn: 'Trouble concentrating on things like reading or watching TV?', options: LIKERT_PHQ },
      { id: 8, text: 'Di chuyển hoặc nói chậm hơn bình thường? Hoặc bồn chồn, đứng ngồi không yên?', textEn: 'Moving or speaking slowly, or being restless and fidgety?', options: LIKERT_PHQ },
      { id: 9, text: 'Có suy nghĩ về việc tự làm hại bản thân?', textEn: 'Thoughts of self-harm or hurting yourself?', options: LIKERT_PHQ },
    ],
    scoringFn: (answers) => {
      const score = answers.reduce((a, b) => a + b, 0)
      if (score <= 4) return { score, label: 'Bình thường', labelEn: 'Normal', color: '#10b981', interpretation: 'Không có dấu hiệu trầm cảm', interpretationEn: 'No signs of depression' }
      if (score <= 9) return { score, label: 'Trầm cảm nhẹ', labelEn: 'Mild depression', color: '#f59e0b', interpretation: 'Cần theo dõi, có thể cải thiện bằng tự chăm sóc', interpretationEn: 'Monitor and consider self-care strategies' }
      if (score <= 14) return { score, label: 'Trầm cảm vừa', labelEn: 'Moderate depression', color: '#f97316', interpretation: 'Nên tham vấn chuyên gia tâm lý', interpretationEn: 'Consider consulting a mental health professional' }
      if (score <= 19) return { score, label: 'Trầm cảm nặng vừa', labelEn: 'Moderately severe depression', color: '#ef4444', interpretation: 'Cần can thiệp chuyên môn', interpretationEn: 'Professional intervention recommended' }
      return { score, label: 'Trầm cảm nặng', labelEn: 'Severe depression', color: '#dc2626', interpretation: 'Cần can thiệp chuyên sâu ngay', interpretationEn: 'Immediate professional intervention needed' }
    },
  },
  GAD7: {
    name: 'GAD-7',
    fullName: 'Generalized Anxiety Disorder',
    description: 'Đánh giá lo âu — 7 câu hỏi về 2 tuần qua',
    descriptionEn: 'Anxiety assessment — 7 questions about the past 2 weeks',
    emoji: '😰',
    questions: [
      { id: 1, text: 'Cảm thấy lo lắng, bồn chồn?', textEn: 'Feeling nervous, anxious, or on edge?', options: LIKERT_PHQ },
      { id: 2, text: 'Không thể ngừng hoặc kiểm soát lo lắng?', textEn: 'Not being able to stop or control worrying?', options: LIKERT_PHQ },
      { id: 3, text: 'Lo lắng quá nhiều về nhiều thứ?', textEn: 'Worrying too much about different things?', options: LIKERT_PHQ },
      { id: 4, text: 'Khó thư giãn?', textEn: 'Trouble relaxing?', options: LIKERT_PHQ },
      { id: 5, text: 'Bồn chồn đến mức khó ngồi yên?', textEn: 'Being so restless that it is hard to sit still?', options: LIKERT_PHQ },
      { id: 6, text: 'Dễ bị cáu gắt?', textEn: 'Becoming easily annoyed or irritable?', options: LIKERT_PHQ },
      { id: 7, text: 'Sợ hãi như thể điều tồi tệ sắp xảy ra?', textEn: 'Feeling afraid as if something awful might happen?', options: LIKERT_PHQ },
    ],
    scoringFn: (answers) => {
      const score = answers.reduce((a, b) => a + b, 0)
      if (score <= 4) return { score, label: 'Lo âu nhẹ', labelEn: 'Minimal anxiety', color: '#10b981', interpretation: 'Trong giới hạn bình thường', interpretationEn: 'Within normal limits' }
      if (score <= 9) return { score, label: 'Lo âu vừa', labelEn: 'Mild anxiety', color: '#f59e0b', interpretation: 'Cần theo dõi thường xuyên', interpretationEn: 'Regular monitoring recommended' }
      if (score <= 14) return { score, label: 'Lo âu nặng vừa', labelEn: 'Moderate anxiety', color: '#f97316', interpretation: 'Nên tham vấn chuyên gia', interpretationEn: 'Consider consulting a professional' }
      return { score, label: 'Lo âu nặng', labelEn: 'Severe anxiety', color: '#ef4444', interpretation: 'Cần can thiệp chuyên sâu', interpretationEn: 'Specialist intervention needed' }
    },
  },
  TFI: {
    name: 'TFI',
    fullName: 'Tinnitus Functional Index',
    description: 'Đánh giá tác động của ù tai lên các hoạt động chức năng',
    descriptionEn: 'Assess the functional impact of tinnitus on daily activities',
    emoji: '📊',
    questions: [
      { id: 1, text: 'Trong tuần qua, tỷ lệ % thời gian bạn nhận thức rõ tiếng ù tai?', textEn: 'In the past week, what % of time were you aware of tinnitus?', options: LIKERT_TFI },
      { id: 2, text: 'Tiếng ù tai mạnh đến mức nào?', textEn: 'How strong or loud was the tinnitus?', options: LIKERT_TFI },
      { id: 3, text: 'Tỷ lệ % thời gian ù tai gây phiền toái?', textEn: 'What % of time did tinnitus bother you?', options: LIKERT_TFI },
      { id: 4, text: 'Ù tai khiến bạn cảm thấy mất kiểm soát?', textEn: 'Did tinnitus make you feel out of control?', options: LIKERT_TFI },
      { id: 5, text: 'Ù tai khiến bạn khó tập trung?', textEn: 'Did tinnitus make it hard to concentrate?', options: LIKERT_TFI },
      { id: 6, text: 'Ù tai khiến bạn khó suy nghĩ rõ ràng?', textEn: 'Did tinnitus make it hard to think clearly?', options: LIKERT_TFI },
      { id: 7, text: 'Ù tai ảnh hưởng khả năng nghe rõ?', textEn: 'Did tinnitus interfere with your ability to hear clearly?', options: LIKERT_TFI },
      { id: 8, text: 'Ù tai ảnh hưởng giấc ngủ?', textEn: 'Did tinnitus interfere with your sleep?', options: LIKERT_TFI },
      { id: 9, text: 'Ù tai gây khó chịu khi cố gắng nghỉ ngơi?', textEn: 'Did tinnitus interfere with quiet resting?', options: LIKERT_TFI },
      { id: 10, text: 'Ù tai khiến bạn cảm thấy lo lắng?', textEn: 'Did tinnitus make you feel anxious?', options: LIKERT_TFI },
      { id: 11, text: 'Ù tai khiến bạn buồn phiền?', textEn: 'Did tinnitus make you feel upset?', options: LIKERT_TFI },
      { id: 12, text: 'Ù tai khiến bạn cảm thấy khó chịu, bực bội?', textEn: 'Did tinnitus make you feel annoyed or frustrated?', options: LIKERT_TFI },
    ],
    scoringFn: (answers) => {
      const score = Math.round((answers.reduce((a, b) => a + b, 0) / (answers.length * 10)) * 100)
      if (score <= 17) return { score, label: 'Không đáng kể', labelEn: 'Not significant', color: '#10b981', interpretation: 'Ù tai ít hoặc không ảnh hưởng chức năng', interpretationEn: 'Tinnitus has little or no functional impact' }
      if (score <= 31) return { score, label: 'Nhẹ', labelEn: 'Mild', color: '#84cc16', interpretation: 'Ù tai gây ảnh hưởng nhẹ đến hoạt động hàng ngày', interpretationEn: 'Tinnitus mildly impacts daily activities' }
      if (score <= 53) return { score, label: 'Trung bình', labelEn: 'Moderate', color: '#f59e0b', interpretation: 'Ù tai ảnh hưởng đáng kể đến chức năng hàng ngày', interpretationEn: 'Tinnitus significantly impacts daily functioning' }
      if (score <= 72) return { score, label: 'Nặng', labelEn: 'Severe', color: '#f97316', interpretation: 'Ù tai gây suy giảm chức năng nghiêm trọng', interpretationEn: 'Tinnitus causes severe functional impairment' }
      return { score, label: 'Rất nặng', labelEn: 'Very severe', color: '#ef4444', interpretation: 'Ù tai gây ảnh hưởng rất nặng, cần can thiệp chuyên sâu', interpretationEn: 'Tinnitus has very severe impact, specialist intervention needed' }
    },
  },
  ISI: {
    name: 'ISI',
    fullName: 'Insomnia Severity Index',
    description: 'Đánh giá mức độ nghiêm trọng của chứng mất ngủ',
    descriptionEn: 'Assess the severity of insomnia symptoms',
    emoji: '🌙',
    questions: [
      { id: 1, text: 'Khó vào giấc ngủ?', textEn: 'Difficulty falling asleep?', options: LIKERT_ISI },
      { id: 2, text: 'Khó duy trì giấc ngủ (thức dậy giữa đêm)?', textEn: 'Difficulty staying asleep (waking up during the night)?', options: LIKERT_ISI },
      { id: 3, text: 'Thức dậy quá sớm vào buổi sáng?', textEn: 'Waking up too early in the morning?', options: LIKERT_ISI },
      { id: 4, text: 'Bạn hài lòng với kiểu ngủ hiện tại ở mức nào?', textEn: 'How satisfied are you with your current sleep pattern?', options: [
        { value: 0, label: 'Rất hài lòng', labelEn: 'Very satisfied' },
        { value: 1, label: 'Hài lòng', labelEn: 'Satisfied' },
        { value: 2, label: 'Trung bình', labelEn: 'Average' },
        { value: 3, label: 'Không hài lòng', labelEn: 'Dissatisfied' },
        { value: 4, label: 'Rất không hài lòng', labelEn: 'Very dissatisfied' },
      ]},
      { id: 5, text: 'Mất ngủ ảnh hưởng đến hoạt động ban ngày ở mức nào?', textEn: 'How noticeable is your sleep problem affecting your daily functioning?', options: LIKERT_ISI },
      { id: 6, text: 'Người khác có nhận thấy chất lượng sống của bạn giảm do mất ngủ?', textEn: 'Do others notice your quality of life is affected by sleep issues?', options: LIKERT_ISI },
      { id: 7, text: 'Bạn lo lắng về vấn đề mất ngủ ở mức nào?', textEn: 'How worried are you about your sleep problem?', options: LIKERT_ISI },
    ],
    scoringFn: (answers) => {
      const score = answers.reduce((a, b) => a + b, 0)
      if (score <= 7) return { score, label: 'Không mất ngủ', labelEn: 'No insomnia', color: '#10b981', interpretation: 'Giấc ngủ trong giới hạn bình thường', interpretationEn: 'Sleep is within normal limits' }
      if (score <= 14) return { score, label: 'Mất ngủ nhẹ', labelEn: 'Mild insomnia', color: '#f59e0b', interpretation: 'Cần theo dõi và cải thiện vệ sinh giấc ngủ', interpretationEn: 'Monitor and improve sleep hygiene' }
      if (score <= 21) return { score, label: 'Mất ngủ trung bình', labelEn: 'Moderate insomnia', color: '#f97316', interpretation: 'Nên tham vấn bác sĩ về giấc ngủ', interpretationEn: 'Consider consulting a sleep specialist' }
      return { score, label: 'Mất ngủ nặng', labelEn: 'Severe insomnia', color: '#ef4444', interpretation: 'Cần can thiệp chuyên sâu về giấc ngủ', interpretationEn: 'Specialist sleep intervention needed' }
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
  const [result, setResult] = useState<ScoringResult | null>(null)

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers, value]
    setAnswers(newAnswers)

    if (currentQ + 1 >= quiz.questions.length) {
      const r = quiz.scoringFn(newAnswers)
      setResult(r)
      onResult?.({
        quizType: quiz.name,
        score: r.score,
        label: isEn ? r.labelEn : r.label,
        interpretation: isEn ? r.interpretationEn : r.interpretation,
        answers: newAnswers,
      })
      // Save to Supabase
      fetch('/api/save-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz_type: quiz.name,
          total_score: r.score,
          severity: r.label,
          answers: newAnswers,
        }),
      }).catch(err => console.warn('[InlineQuiz] Save failed:', err))
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
          <p className="text-xs text-slate-300">{isEn ? quiz.descriptionEn : quiz.description}</p>
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
            {isEn ? quiz.questions[currentQ].textEn : quiz.questions[currentQ].text}
          </p>

          {/* Options */}
          <div className="space-y-1.5">
            {quiz.questions[currentQ].options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleAnswer(opt.value)}
                className="w-full text-left px-3 py-2 bg-slate-700/40 border border-slate-600/30 rounded-lg text-xs text-slate-200 hover:bg-purple-600/20 hover:border-purple-500/30 transition-colors"
              >
                {isEn ? opt.labelEn : opt.label}
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
              {isEn ? result.labelEn : result.label}
            </div>
          </div>
          <p className="text-xs text-slate-400">{isEn ? result.interpretationEn : result.interpretation}</p>
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
