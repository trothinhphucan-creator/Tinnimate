'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Moon, Play, Square, Volume2 } from 'lucide-react'
import { useLangStore } from '@/stores/use-lang-store'
import { PremiumGate } from '@/components/premium-gate'
import { AuthGate } from '@/components/auth-gate'

const SLEEP_SOUNDS = [
  { key: 'brown_noise', emoji: '🟤', vi: 'Tiếng ồn nâu', en: 'Brown Noise' },
  { key: 'rain', emoji: '🌧️', vi: 'Tiếng mưa', en: 'Rain' },
  { key: 'ocean', emoji: '🌊', vi: 'Sóng biển', en: 'Ocean' },
  { key: 'campfire', emoji: '🔥', vi: 'Lửa trại', en: 'Campfire' },
  { key: 'forest', emoji: '🌲', vi: 'Rừng xanh', en: 'Forest' },
]

const TIMERS = [15, 30, 45, 60, 90]

function createSleepBuffer(ctx: AudioContext, type: string): AudioBuffer {
  const sr = ctx.sampleRate, len = sr * 2
  const buf = ctx.createBuffer(1, len, sr)
  const out = buf.getChannelData(0)
  for (let i = 0; i < len; i++) out[i] = Math.random() * 2 - 1

  if (type === 'rain' || type === 'forest') {
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0
    for (let i = 0; i < len; i++) {
      const w = out[i]
      b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759
      b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856
      b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980
      out[i] = (b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11
      b6 = w*0.115926
    }
  } else {
    let last = 0
    for (let i = 0; i < len; i++) {
      out[i] = (last + 0.02*out[i])/1.02; last = out[i]; out[i] *= 3.5
    }
    if (type === 'ocean') {
      for (let i=0;i<len;i++) out[i] *= 0.4+0.6*((Math.sin(2*Math.PI*i/sr*0.08)+1)/2)
    }
  }
  return buf
}

export default function SleepPage() {
  const { lang } = useLangStore()
  const isEn = lang === 'en'
  const [selectedSound, setSelectedSound] = useState('brown_noise')
  const [timer, setTimer] = useState(30)
  const [volume, setVolume] = useState(30)
  const [isPlaying, setIsPlaying] = useState(false)
  const [remaining, setRemaining] = useState(0)
  const ctxRef = useRef<AudioContext | null>(null)
  const srcRef = useRef<AudioBufferSourceNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stop = useCallback(() => {
    srcRef.current?.stop()
    ctxRef.current?.close().catch(() => {})
    if (intervalRef.current) clearInterval(intervalRef.current)
    ctxRef.current = null; srcRef.current = null; gainRef.current = null
    setIsPlaying(false); setRemaining(0)
  }, [])

  const play = useCallback(() => {
    stop()
    const ctx = new AudioContext()
    ctxRef.current = ctx
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(volume / 100, ctx.currentTime)
    gain.connect(ctx.destination)
    gainRef.current = gain
    const buf = createSleepBuffer(ctx, selectedSound)
    const src = ctx.createBufferSource()
    src.buffer = buf; src.loop = true
    src.connect(gain); src.start()
    srcRef.current = src
    setIsPlaying(true)
    setRemaining(timer * 60)
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { stop(); return 0 }
        return prev - 1
      })
    }, 1000)
  }, [selectedSound, timer, volume, stop])

  useEffect(() => {
    if (gainRef.current && ctxRef.current) {
      gainRef.current.gain.setValueAtTime(volume / 100, ctxRef.current.currentTime)
    }
  }, [volume])

  useEffect(() => () => { stop() }, [stop])

  const formatTime = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

  return (
    <AuthGate feature="Sleep Mode" featureVi="Chế Độ Ngủ" emoji="🌙"
      previewItems={[
        { emoji: '🟤', label: 'Ồn nâu' },
        { emoji: '🌧️', label: 'Tiếng mưa' },
        { emoji: '⏰', label: 'Hẹn giờ' },
      ]}>
    <PremiumGate feature="Sleep Mode" featureVi="Chế Độ Ngủ">
    <div className="h-full overflow-y-auto flex flex-col items-center justify-center p-6 relative">
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/30 to-slate-950" />
        <div className="absolute top-[20%] left-[30%] w-[300px] h-[300px] rounded-full bg-indigo-600/5 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[20%] w-[200px] h-[200px] rounded-full bg-violet-600/5 blur-[100px]" />
        {/* Stars */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="absolute w-0.5 h-0.5 bg-white/20 rounded-full animate-pulse"
            style={{
              top: `${10 + (i * 37) % 80}%`, left: `${5 + (i * 53) % 90}%`,
              animationDelay: `${i * 0.3}s`, animationDuration: `${2 + i % 3}s`
            }} />
        ))}
      </div>

      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center text-3xl mb-3">
            🌙
          </div>
          <h1 className="text-xl font-bold text-white">
            {isEn ? 'Sleep Mode' : 'Chế Độ Ngủ'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isEn ? 'Gentle sounds to help you fall asleep' : 'Âm thanh nhẹ nhàng giúp bạn dễ ngủ'}
          </p>
        </div>

        {/* Timer display */}
        {isPlaying && (
          <div className="text-center">
            <div className="text-4xl font-mono font-light text-indigo-300 tracking-wider">
              {formatTime(remaining)}
            </div>
            <p className="text-[10px] text-slate-600 mt-1">{isEn ? 'remaining' : 'còn lại'}</p>
          </div>
        )}

        {/* Sound picker */}
        <div className="space-y-2">
          <p className="text-xs text-slate-500">{isEn ? 'Choose a sound' : 'Chọn âm thanh'}</p>
          <div className="grid grid-cols-2 gap-2">
            {SLEEP_SOUNDS.map(s => (
              <button key={s.key} disabled={isPlaying}
                onClick={() => setSelectedSound(s.key)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                  selectedSound === s.key
                    ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300'
                    : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.05] disabled:opacity-40'
                }`}>
                <span>{s.emoji}</span>
                <span className="text-xs">{isEn ? s.en : s.vi}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Timer picker */}
        <div className="space-y-2">
          <p className="text-xs text-slate-500">{isEn ? 'Auto-stop timer' : 'Hẹn giờ tắt'}</p>
          <div className="flex gap-2">
            {TIMERS.map(m => (
              <button key={m} disabled={isPlaying}
                onClick={() => setTimer(m)}
                className={`flex-1 py-2 text-xs rounded-lg border transition-all ${
                  timer === m
                    ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300 font-semibold'
                    : 'bg-white/[0.02] border-white/5 text-slate-500 hover:text-white disabled:opacity-40'
                }`}>
                {m}{isEn ? 'm' : 'p'}
              </button>
            ))}
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-3">
          <Volume2 size={14} className="text-slate-500" />
          <input type="range" min={0} max={100} value={volume}
            onChange={e => setVolume(+e.target.value)}
            className="flex-1 h-1 accent-indigo-500 cursor-pointer" />
          <span className="text-[10px] text-slate-500 w-6 text-right">{volume}%</span>
        </div>

        {/* Play/Stop */}
        <button onClick={isPlaying ? stop : play}
          className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
            isPlaying
              ? 'bg-red-500/15 border border-red-500/20 text-red-400 hover:bg-red-500/25'
              : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500'
          }`}>
          {isPlaying ? <><Square size={16} /> {isEn ? 'Stop' : 'Dừng'}</> : <><Play size={16} /> {isEn ? 'Start Sleep Mode' : 'Bắt đầu ngủ'}</>}
        </button>

        {/* Tip */}
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
          <p className="text-[10px] text-slate-500">
            💡 {isEn
              ? 'Tip: Try a breathing exercise before sleep for better results'
              : 'Mẹo: Thử bài tập hít thở trước khi ngủ để ngủ ngon hơn'}
          </p>
        </div>
      </div>
    </div>
    </PremiumGate>
    </AuthGate>
  )
}
