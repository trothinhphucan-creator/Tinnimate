'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useLangStore } from '@/stores/use-lang-store'

/* ── i18n ── */
const T = {
  vi: {
    breathing: {
      title: '🫁 Bài Tập Hít Thở',
      subtitle: 'Kỹ thuật 4-7-8 giúp giảm căng thẳng và ù tai',
      inhale: 'HÍT VÀO', hold: 'GIỮ', exhale: 'THỞ RA', ready: 'SẴN SÀNG',
      start: '▶️ Bắt đầu',
      stop: '⏹ Dừng',
      cycle: 'Nhịp',
      tip: '💡 Đặt lưỡi lên vòm miệng. Hít bằng mũi, thở ra bằng miệng.',
    },
    pmr: {
      title: '💪 Thư Giãn Cơ Tiến Triển',
      subtitle: 'Siết & thả từng nhóm cơ để giải phóng căng thẳng',
      tense: 'SIẾT CHẶT', release: 'THẢ LỎNG', breathe: 'HÍT THỞ', ready: 'SẴN SÀNG',
      start: '▶️ Bắt đầu',
      stop: '⏹ Dừng',
      step: 'Bước',
      tip: '💡 Siết mỗi nhóm cơ 5 giây, rồi thả lỏng hoàn toàn.',
      muscles: ['🤲 Bàn tay & Cánh tay', '💪 Bắp tay & Vai', '😤 Mặt & Cổ', '🫁 Ngực & Bụng', '🦵 Đùi & Bắp chân', '🦶 Bàn chân'],
    },
    visualization: {
      title: '🧘 Hình Dung Chữa Lành',
      subtitle: 'Tưởng tượng nơi bình yên để giảm tiếng ù tai',
      listen: 'LẮNG NGHE', imagine: 'HÌNH DUNG', feel: 'CẢM NHẬN', ready: 'SẴN SÀNG',
      start: '▶️ Bắt đầu',
      stop: '⏹ Dừng',
      step: 'Giai đoạn',
      tip: '💡 Nhắm mắt và tưởng tượng thật sống động.',
      scenes: [
        { title: '🌊 Bãi biển', desc: 'Bạn đang đứng trên bãi cát trắng mịn. Sóng biển nhẹ nhàng vỗ bờ. Gió mát thổi qua tóc bạn.' },
        { title: '🌿 Khu rừng', desc: 'Ánh nắng xuyên qua tán lá xanh. Tiếng chim hót vang. Không khí trong lành và mát mẻ.' },
        { title: '🌸 Vườn hoa', desc: 'Hoa nở rộ xung quanh. Mùi hương dịu nhẹ tràn ngập. Bướm bay lượn nhẹ nhàng.' },
        { title: '⭐ Bầu trời sao', desc: 'Bạn nằm trên đồng cỏ. Hàng triệu ngôi sao lấp lánh. Vũ trụ bao la và yên bình.' },
      ],
    },
    complete: '✨ Hoàn thành! Bạn đã thực hiện tuyệt vời.',
  },
  en: {
    breathing: {
      title: '🫁 Breathing Exercise',
      subtitle: '4-7-8 technique to reduce stress and tinnitus',
      inhale: 'INHALE', hold: 'HOLD', exhale: 'EXHALE', ready: 'READY',
      start: '▶️ Start',
      stop: '⏹ Stop',
      cycle: 'Cycle',
      tip: '💡 Place tongue on roof of mouth. Breathe in through nose, out through mouth.',
    },
    pmr: {
      title: '💪 Progressive Muscle Relaxation',
      subtitle: 'Tense & release each muscle group to release tension',
      tense: 'TENSE', release: 'RELEASE', breathe: 'BREATHE', ready: 'READY',
      start: '▶️ Start',
      stop: '⏹ Stop',
      step: 'Step',
      tip: '💡 Tense each muscle group for 5 seconds, then release completely.',
      muscles: ['🤲 Hands & Arms', '💪 Biceps & Shoulders', '😤 Face & Neck', '🫁 Chest & Abdomen', '🦵 Thighs & Calves', '🦶 Feet'],
    },
    visualization: {
      title: '🧘 Healing Visualization',
      subtitle: 'Imagine a peaceful place to reduce tinnitus',
      listen: 'LISTEN', imagine: 'IMAGINE', feel: 'FEEL', ready: 'READY',
      start: '▶️ Start',
      stop: '⏹ Stop',
      step: 'Phase',
      tip: '💡 Close your eyes and imagine as vividly as possible.',
      scenes: [
        { title: '🌊 Beach', desc: 'You are standing on soft white sand. Gentle waves lap at the shore. Cool breeze blows through your hair.' },
        { title: '🌿 Forest', desc: 'Sunlight filters through green canopy. Birds singing all around. Fresh, cool air fills your lungs.' },
        { title: '🌸 Garden', desc: 'Flowers bloom all around you. Sweet fragrance fills the air. Butterflies float gently past.' },
        { title: '⭐ Starry Sky', desc: 'You lie on soft grass. Millions of stars twinkle above. The universe is vast and peaceful.' },
      ],
    },
    complete: '✨ Complete! You did an amazing job.',
  },
}

/* ── CSS Animations ── */
const RELAX_STYLES = `
@keyframes breathe-circle { 
  0%   { transform: scale(0.6); opacity: 0.5; } 
  25%  { transform: scale(1.0); opacity: 1; } 
  50%  { transform: scale(1.0); opacity: 0.9; } 
  100% { transform: scale(0.6); opacity: 0.5; } 
}
@keyframes pulse-glow {
  0%,100% { box-shadow: 0 0 20px rgba(16,185,129,0.2); }
  50% { box-shadow: 0 0 60px rgba(16,185,129,0.5); }
}
@keyframes float-particle {
  0% { transform: translateY(0) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(-120px) rotate(180deg); opacity: 0; }
}
@keyframes muscle-pulse {
  0%,100% { transform: scale(1); filter: brightness(0.7); }
  50% { transform: scale(1.04); filter: brightness(1); }
}
@keyframes scene-drift {
  0%,100% { transform: scale(1.05) translateX(0); }
  50% { transform: scale(1.1) translateX(-2%); }
}
.animate-breathe-circle { animation: breathe-circle 19s ease-in-out infinite; }
.animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
.animate-muscle-pulse { animation: muscle-pulse 5s ease-in-out infinite; }
.animate-scene-drift { animation: scene-drift 12s ease-in-out infinite; }
`

interface Props {
  exerciseType?: string
  onResult?: (data: Record<string, unknown>) => void
}

/* ═══════════════════════════════════════════
   BREATHING EXERCISE (4-7-8)
   ═══════════════════════════════════════════ */
function BreathingExercise({ onResult }: { onResult?: Props['onResult'] }) {
  const { lang } = useLangStore()
  const d = T[lang].breathing
  const [active, setActive] = useState(false)
  const [phase, setPhase] = useState<'ready' | 'inhale' | 'hold' | 'exhale'>('ready')
  const [timer, setTimer] = useState(0)
  const [cycle, setCycle] = useState(0)
  const totalCycles = 4
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [complete, setComplete] = useState(false)

  const phaseConfig = {
    inhale: { duration: 4, color: 'text-cyan-300', bg: 'from-cyan-500/30', label: d.inhale },
    hold: { duration: 7, color: 'text-amber-300', bg: 'from-amber-500/30', label: d.hold },
    exhale: { duration: 8, color: 'text-emerald-300', bg: 'from-emerald-500/30', label: d.exhale },
    ready: { duration: 0, color: 'text-slate-400', bg: 'from-slate-500/20', label: d.ready },
  }

  const stop = useCallback(() => {
    setActive(false)
    setPhase('ready')
    setTimer(0)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  const start = useCallback(() => {
    setActive(true)
    setComplete(false)
    setCycle(0)
    setPhase('inhale')
    setTimer(4)
  }, [])

  useEffect(() => {
    if (!active) return
    intervalRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          // Advance phase
          setPhase(p => {
            if (p === 'inhale') { setTimer(7); return 'hold' }
            if (p === 'hold') { setTimer(8); return 'exhale' }
            // exhale done → next cycle
            setCycle(c => {
              const next = c + 1
              if (next >= totalCycles) {
                stop()
                setComplete(true)
                onResult?.({ exercise: 'breathing', cycles: totalCycles })
                return next
              }
              setTimer(4)
              return next
            })
            return 'inhale'
          })
          return prev
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [active, stop, onResult])

  const p = phaseConfig[phase]
  const breatheScale = phase === 'inhale' ? 'scale-110' : phase === 'exhale' ? 'scale-75' : 'scale-100'

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ maxWidth: 420 }}>
      {/* Background */}
      <div className="relative h-56 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center animate-scene-drift"
          style={{ backgroundImage: 'url(/relaxation/breathing.png)', filter: 'brightness(0.5)' }}
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${p.bg} to-transparent transition-all duration-1000`} />

        {/* Floating particles */}
        {active && [...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-cyan-300/40 rounded-full"
            style={{
              left: `${15 + i * 14}%`, bottom: '10%',
              animation: `float-particle ${3 + i * 0.5}s ease-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}

        {/* Center breathing circle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`flex flex-col items-center justify-center w-28 h-28 rounded-full border-2 border-white/20 backdrop-blur-sm bg-white/5 transition-all duration-[2000ms] ${breatheScale} ${active ? 'animate-pulse-glow' : ''}`}>
            <div className={`text-3xl font-bold ${p.color} transition-colors duration-500`}>
              {active ? timer : '4-7-8'}
            </div>
            <div className={`text-[10px] font-semibold tracking-widest mt-1 ${p.color} transition-colors duration-500`}>
              {p.label}
            </div>
          </div>
        </div>

        {/* Cycle counter */}
        {active && (
          <div className="absolute top-3 right-3 text-[10px] text-white/60 bg-black/30 px-2 py-1 rounded-full">
            {d.cycle} {cycle + 1}/{totalCycles}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-slate-900/95 border-t border-slate-700/30 px-3 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-white">{d.title}</div>
            <div className="text-[10px] text-slate-500">{d.subtitle}</div>
          </div>
          <button
            onClick={active ? stop : start}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              active
                ? 'bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-500/30'
                : 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30'
            }`}
          >
            {active ? d.stop : d.start}
          </button>
        </div>
        <p className="text-[10px] text-slate-500">{d.tip}</p>
        {complete && <p className="text-xs text-emerald-400 text-center">{T[lang].complete}</p>}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   PROGRESSIVE MUSCLE RELAXATION
   ═══════════════════════════════════════════ */
function PMRExercise({ onResult }: { onResult?: Props['onResult'] }) {
  const { lang } = useLangStore()
  const d = T[lang].pmr
  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState<'ready' | 'tense' | 'release' | 'breathe'>('ready')
  const [timer, setTimer] = useState(0)
  const [complete, setComplete] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const phaseConfig = {
    tense: { duration: 5, color: 'text-orange-300', bg: 'from-orange-500/30', label: d.tense },
    release: { duration: 5, color: 'text-emerald-300', bg: 'from-emerald-500/30', label: d.release },
    breathe: { duration: 3, color: 'text-cyan-300', bg: 'from-cyan-500/30', label: d.breathe },
    ready: { duration: 0, color: 'text-slate-400', bg: 'from-slate-500/20', label: d.ready },
  }

  const stop = useCallback(() => {
    setActive(false); setPhase('ready'); setTimer(0); setStep(0)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  const start = useCallback(() => {
    setActive(true); setComplete(false); setStep(0); setPhase('tense'); setTimer(5)
  }, [])

  useEffect(() => {
    if (!active) return
    intervalRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          setPhase(p => {
            if (p === 'tense') { setTimer(5); return 'release' }
            if (p === 'release') { setTimer(3); return 'breathe' }
            // breathe done → next muscle group
            setStep(s => {
              const next = s + 1
              if (next >= d.muscles.length) {
                stop(); setComplete(true)
                onResult?.({ exercise: 'pmr', groups: d.muscles.length })
                return next
              }
              setTimer(5)
              return next
            })
            return 'tense'
          })
          return prev
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [active, stop, d.muscles.length, onResult])

  const p = phaseConfig[phase]
  const pulseClass = phase === 'tense' ? 'scale-105 brightness-110' : phase === 'release' ? 'scale-95 brightness-90' : ''

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ maxWidth: 420 }}>
      <div className="relative h-56 overflow-hidden">
        <div
          className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ${active ? 'animate-muscle-pulse' : ''}`}
          style={{ backgroundImage: 'url(/relaxation/pmr.png)', filter: 'brightness(0.5)' }}
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${p.bg} to-transparent transition-all duration-1000`} />

        {/* Center display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {active && (
            <div className={`text-xs font-semibold mb-2 text-white/70 transition-all ${pulseClass}`}>
              {d.muscles[step] ?? d.muscles[d.muscles.length - 1]}
            </div>
          )}
          <div className={`flex flex-col items-center justify-center w-24 h-24 rounded-full border-2 border-white/20 backdrop-blur-sm bg-white/5 transition-all duration-500 ${active ? 'animate-pulse-glow' : ''}`}>
            <div className={`text-2xl font-bold ${p.color} transition-colors duration-500`}>
              {active ? timer : 'PMR'}
            </div>
            <div className={`text-[9px] font-semibold tracking-widest mt-1 ${p.color}`}>
              {p.label}
            </div>
          </div>
        </div>

        {active && (
          <div className="absolute top-3 right-3 text-[10px] text-white/60 bg-black/30 px-2 py-1 rounded-full">
            {d.step} {step + 1}/{d.muscles.length}
          </div>
        )}

        {/* Muscle group progress dots */}
        {active && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {d.muscles.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${
                i < step ? 'bg-emerald-400' : i === step ? 'bg-amber-400 scale-125' : 'bg-white/20'
              }`} />
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-900/95 border-t border-slate-700/30 px-3 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-white">{d.title}</div>
            <div className="text-[10px] text-slate-500">{d.subtitle}</div>
          </div>
          <button onClick={active ? stop : start}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              active
                ? 'bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-500/30'
                : 'bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 border border-amber-500/30'
            }`}>
            {active ? d.stop : d.start}
          </button>
        </div>
        <p className="text-[10px] text-slate-500">{d.tip}</p>
        {complete && <p className="text-xs text-emerald-400 text-center">{T[lang].complete}</p>}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   VISUALIZATION
   ═══════════════════════════════════════════ */
function VisualizationExercise({ onResult }: { onResult?: Props['onResult'] }) {
  const { lang } = useLangStore()
  const d = T[lang].visualization
  const [active, setActive] = useState(false)
  const [sceneIdx, setSceneIdx] = useState(0)
  const [phase, setPhase] = useState<'ready' | 'listen' | 'imagine' | 'feel'>('ready')
  const [timer, setTimer] = useState(0)
  const [complete, setComplete] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const phaseConfig = {
    listen: { duration: 8, color: 'text-violet-300', bg: 'from-violet-500/30', label: d.listen },
    imagine: { duration: 10, color: 'text-emerald-300', bg: 'from-emerald-500/30', label: d.imagine },
    feel: { duration: 7, color: 'text-cyan-300', bg: 'from-cyan-500/30', label: d.feel },
    ready: { duration: 0, color: 'text-slate-400', bg: 'from-slate-500/20', label: d.ready },
  }

  const stop = useCallback(() => {
    setActive(false); setPhase('ready'); setTimer(0); setSceneIdx(0)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  const start = useCallback(() => {
    setActive(true); setComplete(false); setSceneIdx(0); setPhase('listen'); setTimer(8)
  }, [])

  useEffect(() => {
    if (!active) return
    intervalRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          setPhase(p => {
            if (p === 'listen') { setTimer(10); return 'imagine' }
            if (p === 'imagine') { setTimer(7); return 'feel' }
            // feel done → next scene
            setSceneIdx(s => {
              const next = s + 1
              if (next >= d.scenes.length) {
                stop(); setComplete(true)
                onResult?.({ exercise: 'visualization', scenes: d.scenes.length })
                return next
              }
              setTimer(8)
              return next
            })
            return 'listen'
          })
          return prev
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [active, stop, d.scenes.length, onResult])

  const p = phaseConfig[phase]
  const scene = d.scenes[sceneIdx] ?? d.scenes[d.scenes.length - 1]

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ maxWidth: 420 }}>
      <div className="relative h-56 overflow-hidden">
        <div
          className={`absolute inset-0 bg-cover bg-center ${active ? 'animate-scene-drift' : ''}`}
          style={{ backgroundImage: 'url(/relaxation/visualization.png)', filter: active ? 'brightness(0.6) saturate(1.3)' : 'brightness(0.4)' }}
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${p.bg} to-transparent transition-all duration-1000`} />

        {/* Magical sparkles */}
        {active && [...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-violet-300/50 rounded-full"
            style={{
              left: `${10 + i * 11}%`, bottom: '15%',
              animation: `float-particle ${4 + i * 0.6}s ease-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}

        {/* Center display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
          {active && (
            <div className="text-center mb-3 animate-pulse">
              <div className="text-white font-bold text-sm drop-shadow-lg">{scene.title}</div>
              <div className="text-white/60 text-[10px] max-w-[280px] mt-1 leading-relaxed drop-shadow">{scene.desc}</div>
            </div>
          )}
          <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-full border-2 border-white/20 backdrop-blur-sm bg-white/5 ${active ? 'animate-pulse-glow' : ''}`}>
            <div className={`text-xl font-bold ${p.color}`}>{active ? timer : '🧘'}</div>
            <div className={`text-[8px] font-semibold tracking-widest mt-0.5 ${p.color}`}>{p.label}</div>
          </div>
        </div>

        {active && (
          <div className="absolute top-3 right-3 text-[10px] text-white/60 bg-black/30 px-2 py-1 rounded-full">
            {d.step} {sceneIdx + 1}/{d.scenes.length}
          </div>
        )}

        {/* Scene progress */}
        {active && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {d.scenes.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${
                i < sceneIdx ? 'bg-violet-400' : i === sceneIdx ? 'bg-emerald-400 scale-125' : 'bg-white/20'
              }`} />
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-900/95 border-t border-slate-700/30 px-3 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-white">{d.title}</div>
            <div className="text-[10px] text-slate-500">{d.subtitle}</div>
          </div>
          <button onClick={active ? stop : start}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              active
                ? 'bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-500/30'
                : 'bg-violet-600/20 text-violet-300 hover:bg-violet-600/30 border border-violet-500/30'
            }`}>
            {active ? d.stop : d.start}
          </button>
        </div>
        <p className="text-[10px] text-slate-500">{d.tip}</p>
        {complete && <p className="text-xs text-emerald-400 text-center">{T[lang].complete}</p>}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════ */
export function InlineRelaxation({ exerciseType = 'breathing', onResult }: Props) {
  const stylesRef = useRef(false)
  useEffect(() => {
    if (stylesRef.current) return
    stylesRef.current = true
    const style = document.createElement('style')
    style.textContent = RELAX_STYLES
    document.head.appendChild(style)
  }, [])

  switch (exerciseType) {
    case 'breathing': return <BreathingExercise onResult={onResult} />
    case 'pmr': return <PMRExercise onResult={onResult} />
    case 'visualization': return <VisualizationExercise onResult={onResult} />
    default: return <BreathingExercise onResult={onResult} />
  }
}
