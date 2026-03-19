'use client'

import { useState, useEffect, useCallback } from 'react'
import { Play, Square, Timer, Volume2, Headphones } from 'lucide-react'
import { THERAPY_PRESETS } from '@/lib/audio/therapy-presets'
import { useAudioEngine } from '@/hooks/use-audio-engine'
import { useLangStore } from '@/stores/use-lang-store'
import { t } from '@/lib/i18n'
import { AuthGate } from '@/components/auth-gate'
import type { TherapySound } from '@/types'

export default function TherapyPage() {
  const { isPlaying, activeSound, volume, toggle, stop, updateVolume } = useAudioEngine()
  const [timerMin, setTimerMin] = useState<number>(30)
  const [elapsed, setElapsed] = useState(0)

  const { lang } = useLangStore()
  const d = t(lang)

  const categories = [
    { label: d.therapy.categories.noise, color: 'from-blue-500 to-cyan-400', sounds: ['white_noise', 'pink_noise', 'brown_noise'] as TherapySound[] },
    { label: d.therapy.categories.nature, color: 'from-emerald-500 to-teal-400', sounds: ['rain', 'ocean', 'forest', 'campfire', 'birds', 'creek', 'thunder', 'wind'] as TherapySound[] },
    { label: d.therapy.categories.healing, color: 'from-amber-500 to-orange-400', sounds: ['singing_bowl', 'wind_chimes', 'om_drone', 'heartbeat'] as TherapySound[] },
    { label: d.therapy.categories.ambient, color: 'from-lime-500 to-green-400', sounds: ['crickets'] as TherapySound[] },
    { label: d.therapy.categories.binaural, color: 'from-violet-500 to-purple-400', sounds: ['binaural_alpha', 'binaural_theta', 'binaural_delta'] as TherapySound[] },
    { label: d.therapy.categories.notch, color: 'from-pink-500 to-rose-400', sounds: ['notch_therapy'] as TherapySound[] },
  ]

  useEffect(() => {
    if (!isPlaying) { setElapsed(0); return }
    const interval = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1
        if (timerMin > 0 && next >= timerMin * 60) { stop(); return 0 }
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isPlaying, timerMin, stop])

  const handlePlay = useCallback(async (sound: TherapySound) => {
    setElapsed(0)
    await toggle(sound, timerMin)
  }, [toggle, timerMin])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const remaining = timerMin > 0 ? timerMin * 60 - elapsed : 0
  const progress = timerMin > 0 ? elapsed / (timerMin * 60) : 0

  return (
    <AuthGate feature="Sound Therapy" featureVi="Âm Thanh Trị Liệu" emoji="🎵"
      previewItems={[
        { emoji: '〰️', label: 'White noise' },
        { emoji: '🌊', label: 'Ocean waves' },
        { emoji: '🧠', label: 'Binaural beats' },
      ]}>
    <div className="h-full overflow-y-auto p-6 md:p-8 max-w-5xl mx-auto relative">
      {/* Background glow */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] right-[10%] w-[300px] h-[300px] rounded-full bg-violet-600/10 blur-[100px]" />
        <div className="absolute bottom-[20%] left-[5%] w-[250px] h-[250px] rounded-full bg-blue-600/10 blur-[80px]" />
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Headphones size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{d.therapy.title}</h1>
            <p className="text-sm text-slate-400">{d.therapy.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Active player bar */}
      {isPlaying && activeSound && (
        <div className="mb-6 p-5 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl">
          <div className="flex items-center gap-4">
            {/* Circular visualizer */}
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                <circle cx="32" cy="32" r="28" fill="none" stroke="url(#grad)" strokeWidth="4"
                  strokeDasharray={`${progress * 175.93} 175.93`} strokeLinecap="round" />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-2xl">
                {THERAPY_PRESETS[activeSound]?.icon ?? '🎵'}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white">{lang === 'vi' ? THERAPY_PRESETS[activeSound]?.labelVi : THERAPY_PRESETS[activeSound]?.label}</div>
              <div className="text-xs text-slate-400 truncate">{lang === 'vi' ? THERAPY_PRESETS[activeSound]?.descriptionVi : THERAPY_PRESETS[activeSound]?.description}</div>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                <span>{formatTime(elapsed)}</span>
                <div className="flex-1 bg-white/5 rounded-full h-1">
                  <div className="bg-gradient-to-r from-violet-500 to-cyan-400 h-1 rounded-full transition-all duration-1000" style={{ width: `${progress * 100}%` }} />
                </div>
                <span>-{formatTime(remaining)}</span>
              </div>
            </div>

            <button onClick={stop} className="p-3 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 rounded-xl text-white transition-all">
              <Square size={16} />
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5">
            <div className="flex items-center gap-2 text-slate-300 flex-1">
              <Volume2 size={14} className="text-slate-500" />
              <input type="range" min={0} max={1} step={0.05} value={volume}
                onChange={e => updateVolume(Number(e.target.value))}
                className="w-full accent-violet-500 h-1" />
              <span className="text-xs text-slate-500 w-8">{Math.round(volume * 100)}%</span>
            </div>
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
              <Timer size={12} className="text-slate-500 ml-2" />
              {([15, 30, 60, 120, 0] as const).map(m => (
                <button key={m} onClick={() => setTimerMin(m)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    timerMin === m
                      ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}>{m === 0 ? '∞' : `${m}p`}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sound categories */}
      <div className="space-y-8">
        {categories.map(cat => (
          <div key={cat.label}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-1 h-5 rounded-full bg-gradient-to-b ${cat.color}`} />
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{cat.label}</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {cat.sounds.map(sound => {
                const preset = THERAPY_PRESETS[sound]
                const isActive = isPlaying && activeSound === sound
                return (
                  <button key={sound} onClick={() => handlePlay(sound)}
                    className={`group relative p-5 rounded-2xl border text-left transition-all duration-300 hover:-translate-y-0.5 ${
                      isActive
                        ? 'bg-gradient-to-br from-violet-500/15 to-blue-500/10 border-violet-500/30 shadow-xl shadow-violet-500/10'
                        : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5 hover:border-white/10 hover:shadow-lg'
                    }`}>
                    <div className={`text-3xl mb-3 transition-transform group-hover:scale-110 ${isActive ? 'animate-bounce' : ''}`}>
                      {preset?.icon ?? '🎵'}
                    </div>
                    <div className="font-medium text-sm text-white">{lang === 'vi' ? preset?.labelVi : preset?.label}</div>
                    <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">{lang === 'vi' ? preset?.descriptionVi : preset?.description}</div>
                    {isActive && (
                      <div className="absolute top-3 right-3 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
                        <span className="w-1 h-1 bg-blue-400 rounded-full animate-pulse [animation-delay:0.3s]" />
                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse [animation-delay:0.6s]" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Volume recommendation */}
      <div className="mt-6 p-4 bg-amber-500/5 backdrop-blur border border-amber-500/15 rounded-2xl">
        <p className="text-amber-400 text-xs font-medium mb-1">🔊 {lang === 'vi' ? 'Khuyến nghị âm lượng' : 'Volume Recommendation'}</p>
        <p className="text-slate-500 text-[11px] leading-relaxed">
          {lang === 'vi'
            ? 'Vặn nhỏ vừa đủ để che phủ tiếng ù — không nên to hơn tiếng ù. Nghe ở mức thấp giúp não dần quen (habituation) hiệu quả hơn.'
            : 'Set volume just loud enough to partially mask the ringing — not louder. Low-level sound helps your brain habituate more effectively.'}
        </p>
      </div>

      {/* Tips */}
      <div className="mt-4 p-5 bg-white/[0.02] backdrop-blur border border-white/5 rounded-2xl">
        <p className="text-slate-400 text-sm">
          💡 <strong className="text-slate-200">{lang === 'vi' ? 'Mẹo' : 'Tip'}:</strong>{' '}
          {lang === 'vi'
            ? 'Sử dụng tai nghe để có trải nghiệm tốt nhất. Binaural beats cần tai nghe stereo để hoạt động. Âm thanh thiên nhiên dùng tổng hợp tiếng ồn lọc.'
            : 'Use headphones for the best experience. Binaural beats require stereo headphones. Nature sounds use filtered noise synthesis.'}
        </p>
      </div>
    </div>
    </AuthGate>
  )
}
