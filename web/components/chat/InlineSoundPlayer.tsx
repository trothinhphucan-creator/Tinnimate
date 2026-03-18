'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'

/* ── Sound Types Configuration ── */
interface SoundDef {
  label: string
  emoji: string
  description: string
  freq?: number
  type: OscillatorType | 'noise'
  noiseType?: string
  image: string
  gradient: string
  animClass: string
  category: 'noise' | 'nature' | 'tone'
}

const SOUND_TYPES: Record<string, SoundDef> = {
  // — NOISE category —
  white_noise: {
    label: 'White Noise', emoji: '✨', description: 'Che lấp tiếng ù tai hiệu quả',
    type: 'noise', noiseType: 'white', image: '/sounds/whitenoise.png',
    gradient: 'from-gray-500/20 to-gray-900/40', animClass: 'animate-visual-particles',
    category: 'noise',
  },
  pink_noise: {
    label: 'Pink Noise', emoji: '🌸', description: 'Tự nhiên, thoải mái như gió',
    type: 'noise', noiseType: 'pink', image: '/sounds/whitenoise.png',
    gradient: 'from-pink-500/20 to-purple-900/40', animClass: 'animate-visual-breathe',
    category: 'noise',
  },
  brown_noise: {
    label: 'Brown Noise', emoji: '🍂', description: 'Trầm ấm, thư giãn sâu',
    type: 'noise', noiseType: 'brown', image: '/sounds/whitenoise.png',
    gradient: 'from-amber-800/20 to-stone-900/40', animClass: 'animate-visual-drift',
    category: 'noise',
  },
  // — NATURE category —
  rain: {
    label: 'Tiếng mưa', emoji: '🌧️', description: 'Mưa rơi trên mặt hồ yên tĩnh',
    type: 'noise', noiseType: 'rain', image: '/sounds/rain.png',
    gradient: 'from-blue-800/30 to-slate-900/50', animClass: 'animate-visual-rain',
    category: 'nature',
  },
  ocean: {
    label: 'Sóng biển', emoji: '🌊', description: 'Sóng biển dưới ánh trăng',
    type: 'noise', noiseType: 'ocean', image: '/sounds/ocean.png',
    gradient: 'from-teal-800/30 to-blue-900/50', animClass: 'animate-visual-waves',
    category: 'nature',
  },
  forest: {
    label: 'Rừng đêm', emoji: '🌿', description: 'Côn trùng + gió lá rì rào',
    type: 'noise', noiseType: 'forest', image: '/sounds/forest.png',
    gradient: 'from-green-800/30 to-emerald-900/50', animClass: 'animate-visual-fireflies',
    category: 'nature',
  },
  birds: {
    label: 'Tiếng chim', emoji: '🐦', description: 'Bình minh trong vườn',
    type: 'noise', noiseType: 'birds', image: '/sounds/birds.png',
    gradient: 'from-orange-700/30 to-amber-900/50', animClass: 'animate-visual-sunrise',
    category: 'nature',
  },
  campfire: {
    label: 'Lửa trại', emoji: '🔥', description: 'Ấm áp dưới bầu trời sao',
    type: 'noise', noiseType: 'campfire', image: '/sounds/campfire.png',
    gradient: 'from-orange-600/30 to-red-900/50', animClass: 'animate-visual-flicker',
    category: 'nature',
  },
  // — TONE category —
  tone_440: {
    label: '440 Hz', emoji: '🎵', description: 'Nốt La — cân bằng, thư giãn',
    freq: 440, type: 'sine', image: '/sounds/whitenoise.png',
    gradient: 'from-cyan-500/20 to-blue-900/40', animClass: 'animate-visual-pulse',
    category: 'tone',
  },
  tone_528: {
    label: '528 Hz', emoji: '💜', description: 'Tần số chữa lành — "Love frequency"',
    freq: 528, type: 'sine', image: '/sounds/whitenoise.png',
    gradient: 'from-violet-500/20 to-purple-900/40', animClass: 'animate-visual-pulse',
    category: 'tone',
  },
  tone_1000: {
    label: '1000 Hz', emoji: '🎶', description: 'Tone trung — masking ù tai',
    freq: 1000, type: 'sine', image: '/sounds/whitenoise.png',
    gradient: 'from-blue-500/20 to-indigo-900/40', animClass: 'animate-visual-pulse',
    category: 'tone',
  },
}

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  noise: { label: 'Tiếng ồn', emoji: '📡' },
  nature: { label: 'Thiên nhiên', emoji: '🌿' },
  tone: { label: 'Tần số', emoji: '🎵' },
}

interface Props {
  soundType?: string
  durationMinutes?: number
  onResult?: (data: Record<string, unknown>) => void
}

/* ── Animated Visual CSS (injected once) ── */
const VISUAL_STYLES = `
@keyframes visual-breathe { 0%,100% { transform: scale(1); opacity: 0.7; } 50% { transform: scale(1.08); opacity: 1; } }
@keyframes visual-drift { 0% { transform: translateX(0) scale(1); } 50% { transform: translateX(-3%) scale(1.03); } 100% { transform: translateX(0) scale(1); } }
@keyframes visual-waves { 0% { transform: translateX(0) scale(1.05); } 33% { transform: translateX(-2%) scale(1.08); } 66% { transform: translateX(2%) scale(1.05); } 100% { transform: translateX(0) scale(1.05); } }
@keyframes visual-rain { 0% { filter: brightness(0.6); } 50% { filter: brightness(0.75); } 100% { filter: brightness(0.6); } }
@keyframes visual-fireflies { 0%,100% { filter: brightness(0.55) contrast(1.1); } 50% { filter: brightness(0.7) contrast(1.2); } }
@keyframes visual-flicker { 0% { filter: brightness(0.6); } 20% { filter: brightness(0.75); } 40% { filter: brightness(0.65); } 60% { filter: brightness(0.8); } 80% { filter: brightness(0.62); } 100% { filter: brightness(0.6); } }
@keyframes visual-sunrise { 0% { filter: brightness(0.5) saturate(1); } 50% { filter: brightness(0.65) saturate(1.3); } 100% { filter: brightness(0.5) saturate(1); } }
@keyframes visual-pulse { 0%,100% { transform: scale(1); filter: brightness(0.5); } 50% { transform: scale(1.05); filter: brightness(0.7); } }
@keyframes visual-particles { 0% { transform: scale(1.02) rotate(0deg); } 50% { transform: scale(1.06) rotate(1deg); } 100% { transform: scale(1.02) rotate(0deg); } }
@keyframes visual-glow { 0%,100% { box-shadow: 0 0 30px rgba(255,255,255,0.05); } 50% { box-shadow: 0 0 60px rgba(255,255,255,0.12); } }
@keyframes eq-bar { 0%,100% { height: 20%; } 50% { height: 100%; } }
.animate-visual-breathe { animation: visual-breathe 6s ease-in-out infinite; }
.animate-visual-drift { animation: visual-drift 10s ease-in-out infinite; }
.animate-visual-waves { animation: visual-waves 8s ease-in-out infinite; }
.animate-visual-rain { animation: visual-rain 3s ease-in-out infinite; }
.animate-visual-fireflies { animation: visual-fireflies 4s ease-in-out infinite; }
.animate-visual-flicker { animation: visual-flicker 2.5s ease-in-out infinite; }
.animate-visual-sunrise { animation: visual-sunrise 8s ease-in-out infinite; }
.animate-visual-pulse { animation: visual-pulse 3s ease-in-out infinite; }
.animate-visual-particles { animation: visual-particles 7s ease-in-out infinite; }
.animate-visual-glow { animation: visual-glow 4s ease-in-out infinite; }
`

export function InlineSoundPlayer({ soundType = 'white_noise', durationMinutes = 15, onResult }: Props) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(30)
  const [elapsed, setElapsed] = useState(0)
  const [selectedSound, setSelectedSound] = useState(soundType)
  const [showPicker, setShowPicker] = useState(false)
  const ctxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stylesRef = useRef(false)
  const totalSeconds = durationMinutes * 60
  const config = SOUND_TYPES[selectedSound] ?? SOUND_TYPES.white_noise

  // Inject CSS animations once
  useEffect(() => {
    if (stylesRef.current) return
    stylesRef.current = true
    const style = document.createElement('style')
    style.textContent = VISUAL_STYLES
    document.head.appendChild(style)
  }, [])

  useEffect(() => { return () => { stop() } }, [])

  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.setValueAtTime(volume / 100, ctxRef.current?.currentTime ?? 0)
    }
  }, [volume])

  const createNoiseBuffer = useCallback((ctx: AudioContext, noiseType: string) => {
    const sr = ctx.sampleRate
    const len = sr * 2
    const buf = ctx.createBuffer(1, len, sr)
    const out = buf.getChannelData(0)

    // Base: white noise
    for (let i = 0; i < len; i++) out[i] = Math.random() * 2 - 1

    if (noiseType === 'pink' || noiseType === 'rain' || noiseType === 'birds') {
      let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0
      for (let i = 0; i < len; i++) {
        const w = out[i]
        b0 = 0.99886*b0 + w*0.0555179; b1 = 0.99332*b1 + w*0.0750759
        b2 = 0.96900*b2 + w*0.1538520; b3 = 0.86650*b3 + w*0.3104856
        b4 = 0.55000*b4 + w*0.5329522; b5 = -0.7616*b5 - w*0.0168980
        out[i] = (b0+b1+b2+b3+b4+b5+b6+w*0.5362) * 0.11
        b6 = w * 0.115926
      }
      // Rain: add amplitude modulation for raindrop effect
      if (noiseType === 'rain') {
        for (let i = 0; i < len; i++) {
          const mod = 0.5 + 0.5 * Math.sin(2 * Math.PI * i / sr * 0.3) * Math.sin(2 * Math.PI * i / sr * 1.7)
          out[i] *= (0.6 + 0.4 * mod)
        }
      }
      // Birds: add periodic chirp-like bursts on top
      if (noiseType === 'birds') {
        for (let i = 0; i < len; i++) {
          const t = i / sr
          const chirp = Math.sin(2 * Math.PI * t * (2000 + 800 * Math.sin(2 * Math.PI * t * 8)))
          const env = Math.max(0, Math.sin(2 * Math.PI * t * 1.5)) ** 8
          out[i] = out[i] * 0.6 + chirp * env * 0.03
        }
      }
    } else if (noiseType === 'brown') {
      let last = 0
      for (let i = 0; i < len; i++) { out[i] = (last + 0.02 * out[i]) / 1.02; last = out[i]; out[i] *= 3.5 }
    } else if (noiseType === 'ocean') {
      // Brown noise + slow amplitude modulation (wave pattern)
      let last = 0
      for (let i = 0; i < len; i++) {
        out[i] = (last + 0.02 * out[i]) / 1.02; last = out[i]; out[i] *= 3.5
        const wave = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(2 * Math.PI * i / sr * 0.15))
        out[i] *= wave
      }
    } else if (noiseType === 'forest') {
      // Pink noise base + cricket-like high freq chirps
      let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0
      for (let i = 0; i < len; i++) {
        const w = out[i]
        b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759
        b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856
        b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980
        out[i] = (b0+b1+b2+b3+b4+b5+b6+w*0.5362) * 0.08
        b6 = w * 0.115926
        // Cricket chirps
        const t = i / sr
        const cricket = Math.sin(2 * Math.PI * t * 4500) * Math.sin(2 * Math.PI * t * 3) ** 12
        out[i] += cricket * 0.012
      }
    } else if (noiseType === 'campfire') {
      // Brown noise + crackle bursts
      let last = 0
      for (let i = 0; i < len; i++) {
        out[i] = (last + 0.02 * out[i]) / 1.02; last = out[i]; out[i] *= 2.5
        // Random crackle
        if (Math.random() < 0.001) {
          const burstLen = Math.floor(sr * 0.005)
          for (let j = 0; j < burstLen && i + j < len; j++) {
            out[i + j] += (Math.random() * 2 - 1) * 0.3 * (1 - j / burstLen)
          }
        }
      }
    }

    return buf
  }, [])

  const play = useCallback(() => {
    const ctx = new AudioContext(); ctxRef.current = ctx
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(volume / 100, ctx.currentTime)
    gain.connect(ctx.destination); gainRef.current = gain

    if (config.type === 'noise') {
      const buf = createNoiseBuffer(ctx, config.noiseType ?? 'white')
      const src = ctx.createBufferSource()
      src.buffer = buf; src.loop = true; src.connect(gain); src.start()
      sourceRef.current = src
    } else {
      const osc = ctx.createOscillator()
      osc.type = config.type; osc.frequency.value = config.freq ?? 440
      osc.connect(gain); osc.start()
      sourceRef.current = osc
    }
    setIsPlaying(true); setElapsed(0)
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1
        if (next >= totalSeconds) { stop(); onResult?.({ sound_type: selectedSound, duration_played: next, completed: true }) }
        return next
      })
    }, 1000)
  }, [config, selectedSound, volume, totalSeconds, onResult, createNoiseBuffer])

  const stop = useCallback(() => {
    try { sourceRef.current?.stop() } catch {}
    try { ctxRef.current?.close() } catch {}
    if (timerRef.current) clearInterval(timerRef.current)
    sourceRef.current = null; ctxRef.current = null; gainRef.current = null; timerRef.current = null
    setIsPlaying(false)
  }, [])

  const togglePlay = useCallback(() => { isPlaying ? stop() : play() }, [isPlaying, play, stop])

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
  const progressPct = totalSeconds > 0 ? (elapsed / totalSeconds) * 100 : 0

  // Grouped sounds for picker
  const grouped = Object.entries(SOUND_TYPES).reduce<Record<string, ([string, SoundDef])[]>>((acc, entry) => {
    const cat = entry[1].category; if (!acc[cat]) acc[cat] = []; acc[cat].push(entry); return acc
  }, {})

  return (
    <div className="rounded-xl overflow-hidden mt-2 animate-visual-glow" style={{ maxWidth: 420 }}>
      {/* ─── Visual Background ─── */}
      <div className="relative">
        {/* Background image with animation */}
        <div className="relative h-44 overflow-hidden rounded-t-xl">
          <div
            className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ${isPlaying ? config.animClass : ''}`}
            style={{
              backgroundImage: `url(${config.image})`,
              filter: isPlaying ? 'brightness(0.65)' : 'brightness(0.4)',
              transition: 'filter 1s ease',
            }}
          />
          {/* Gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t ${config.gradient} to-transparent`} />
          {/* Floating particles effect when playing */}
          {isPlaying && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-white/30 rounded-full"
                  style={{
                    left: `${10 + i * 12}%`,
                    bottom: `${10 + (i % 3) * 20}%`,
                    animation: `eq-bar ${1.5 + i * 0.3}s ease-in-out infinite`,
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Content overlay */}
          <div className="relative z-10 h-full flex flex-col justify-between p-3">
            {/* Top: Title */}
            <div>
              <p className="text-white/90 font-bold text-sm drop-shadow-lg">
                {config.emoji} {config.label}
              </p>
              <p className="text-white/50 text-[10px] drop-shadow">{config.description}</p>
            </div>

            {/* Center: Play button + EQ bars */}
            <div className="flex items-center justify-center gap-3">
              {/* EQ bars (left) */}
              {isPlaying && (
                <div className="flex gap-0.5 items-end h-6">
                  {[0.6, 1, 0.7, 0.9, 0.5].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 bg-white/40 rounded-full"
                      style={{
                        animation: `eq-bar ${0.8 + i * 0.15}s ease-in-out infinite`,
                        animationDelay: `${i * 0.1}s`,
                        maxHeight: '24px',
                      }}
                    />
                  ))}
                </div>
              )}

              <button
                onClick={togglePlay}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold backdrop-blur-md transition-all shadow-2xl ${
                  isPlaying
                    ? 'bg-white/20 hover:bg-white/30 shadow-white/10'
                    : 'bg-white/15 hover:bg-white/25 shadow-black/20'
                }`}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>

              {/* EQ bars (right) */}
              {isPlaying && (
                <div className="flex gap-0.5 items-end h-6">
                  {[0.5, 0.8, 1, 0.6, 0.8].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 bg-white/40 rounded-full"
                      style={{
                        animation: `eq-bar ${0.9 + i * 0.12}s ease-in-out infinite`,
                        animationDelay: `${i * 0.15}s`,
                        maxHeight: '24px',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Bottom: Progress */}
            <div>
              <div className="flex justify-between text-[9px] text-white/50 mb-0.5">
                <span>{formatTime(elapsed)}</span>
                <span>{formatTime(totalSeconds)}</span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-white/60 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* ─── Controls bar ─── */}
        <div className="bg-slate-900/95 border-t border-slate-700/30 px-3 py-2.5 space-y-2">
          {/* Volume */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500">🔊</span>
            <input
              type="range" min={0} max={100} value={volume}
              onChange={e => setVolume(Number(e.target.value))}
              className="flex-1 h-1 accent-emerald-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 w-6 text-right">{volume}%</span>
          </div>

          {/* Sound picker toggle */}
          <button
            disabled={isPlaying}
            onClick={() => setShowPicker(!showPicker)}
            className="w-full text-[10px] text-slate-400 hover:text-white py-1 rounded-lg hover:bg-slate-800/60 transition-colors disabled:opacity-40 text-center"
          >
            {showPicker ? '▲ Ẩn danh sách' : '▼ Chọn âm thanh khác'}
          </button>

          {/* Sound picker grid */}
          {showPicker && !isPlaying && (
            <div className="space-y-2 pt-1">
              {Object.entries(grouped).map(([cat, sounds]) => (
                <div key={cat}>
                  <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">
                    {CATEGORY_LABELS[cat]?.emoji} {CATEGORY_LABELS[cat]?.label}
                  </p>
                  <div className="grid grid-cols-3 gap-1">
                    {sounds.map(([key, s]) => (
                      <button
                        key={key}
                        onClick={() => { setSelectedSound(key); setShowPicker(false) }}
                        className={`px-2 py-1.5 text-[10px] rounded-lg border text-center transition-all ${
                          selectedSound === key
                            ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300 font-medium'
                            : 'bg-slate-800/50 border-slate-700/30 text-slate-400 hover:bg-slate-700/50 hover:text-white'
                        }`}
                      >
                        {s.emoji} {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
