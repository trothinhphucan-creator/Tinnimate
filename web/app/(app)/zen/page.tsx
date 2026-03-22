'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Play, Square, Volume2, Lock, Crown, Sparkles } from 'lucide-react'
import { useLangStore } from '@/stores/use-lang-store'
import { useUserStore } from '@/stores/use-user-store'
import { FractalToneEngine, ZEN_STYLES } from '@/lib/audio/fractal-engine'
import { AuthGate } from '@/components/auth-gate'
import Link from 'next/link'

// Trial limits per tier — Ultra-only feature
const TRIAL_LIMITS: Record<string, number> = {
  guest: 0,     // must login first (AuthGate handles this)
  free: 0,      // no access
  premium: 0,   // no access
  pro: 0,       // no access
  ultra: Infinity, // unlimited for Ultra tier only
}

const STORAGE_KEY = 'zentones_trials'
const DEMO_DURATION_MS = 10000 // 10-second demo

function getTrialCount(): number {
  if (typeof window === 'undefined') return 0
  return parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10)
}

function incrementTrialCount(): number {
  const current = getTrialCount() + 1
  localStorage.setItem(STORAGE_KEY, String(current))
  return current
}

export default function ZenPage() {
  const { lang } = useLangStore()
  const isEn = lang === 'en'
  const { user } = useUserStore()

  const [selectedIdx, setSelectedIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(50)
  const [trialCount, setTrialCount] = useState(0)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [isDemoPlaying, setIsDemoPlaying] = useState(false)
  const demoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const engineRef = useRef<FractalToneEngine | null>(null)

  // Sparkle animation state
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number; size: number }[]>([])
  const sparkleIdRef = useRef(0)

  const selected = ZEN_STYLES[selectedIdx]
  const tier = user?.subscription_tier ?? 'free'
  const maxTrials = TRIAL_LIMITS[tier] ?? 1
  const trialsRemaining = Math.max(0, maxTrials - trialCount)
  const canPlay = trialsRemaining > 0 || maxTrials === Infinity

  // Load trial count
  useEffect(() => {
    setTrialCount(getTrialCount())
  }, [])

  // Add sparkles when playing
  useEffect(() => {
    if (!isPlaying) { setSparkles([]); return }
    const interval = setInterval(() => {
      sparkleIdRef.current++
      setSparkles(prev => {
        const newSparkle = {
          id: sparkleIdRef.current,
          x: 15 + Math.random() * 70,
          y: 10 + Math.random() * 80,
          size: 2 + Math.random() * 4,
        }
        const next = [...prev, newSparkle]
        if (next.length > 12) next.shift()
        return next
      })
    }, selected.tempoMs * 0.8)
    return () => clearInterval(interval)
  }, [isPlaying, selected.tempoMs])

  const getEngine = useCallback(() => {
    if (!engineRef.current) engineRef.current = new FractalToneEngine()
    return engineRef.current
  }, [])

  const handlePlay = useCallback(async () => {
    const engine = getEngine()
    if (isPlaying) {
      engine.stop()
      setIsPlaying(false)
    } else {
      if (!canPlay) {
        setShowUpgrade(true)
        return
      }
      const newCount = incrementTrialCount()
      setTrialCount(newCount)
      await engine.start(selected, volume / 100)
      setIsPlaying(true)
    }
  }, [getEngine, isPlaying, selected, volume, canPlay])

  // Demo preview (10 seconds, no trial count)
  const handleDemo = useCallback(async () => {
    if (isPlaying || isDemoPlaying) return
    const engine = getEngine()
    setIsDemoPlaying(true)
    await engine.start(selected, volume / 100)
    demoTimeoutRef.current = setTimeout(() => {
      engine.stop()
      setIsDemoPlaying(false)
    }, DEMO_DURATION_MS)
  }, [getEngine, isPlaying, isDemoPlaying, selected, volume])

  const handleStyleChange = useCallback(async (idx: number) => {
    setSelectedIdx(idx)
    if (isPlaying) {
      const engine = getEngine()
      engine.stop()
      await engine.start(ZEN_STYLES[idx], volume / 100)
    }
  }, [getEngine, isPlaying, volume])

  const handleVolumeChange = useCallback((val: number) => {
    setVolume(val)
    if (engineRef.current) engineRef.current.setVolume(val / 100)
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      engineRef.current?.stop()
      if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current)
    }
  }, [])

  return (
    <AuthGate feature="Zentones" featureVi="Zentones" emoji="🎵"
      previewItems={[
        { emoji: '🌊', label: 'Ocean Breeze' },
        { emoji: '✨', label: 'Starlight' },
        { emoji: '🌙', label: 'Moonlight' },
      ]}>
    <div className="h-full overflow-y-auto flex flex-col items-center justify-start p-4 sm:p-6 relative">
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/95 to-slate-950" />
        <div
          className="absolute top-[20%] left-[30%] w-[400px] h-[400px] rounded-full blur-[150px] transition-colors duration-1000"
          style={{ backgroundColor: `${selected.color}12` }}
        />
        <div
          className="absolute bottom-[20%] right-[20%] w-[300px] h-[300px] rounded-full blur-[120px] transition-colors duration-1000"
          style={{ backgroundColor: `${selected.colorTo}10` }}
        />
      </div>

      {/* Upgrade Modal */}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowUpgrade(false)}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
                <Crown size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {isEn ? 'Upgrade to Zentones Ultra' : 'Nâng cấp Zentones Ultra'}
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                {isEn
                  ? 'Zentones is an Ultra-tier exclusive feature. Upgrade to unlock unlimited access.'
                  : 'Zentones là tính năng độc quyền gói Ultra. Nâng cấp để mở khóa không giới hạn.'}
              </p>

              {/* Tier comparison */}
              <div className="space-y-2 mb-5">
                {[
                  { tier: 'Free', trials: 'Không có quyền', trialsEn: 'No access', active: tier === 'free' },
                  { tier: 'Premium', trials: 'Không có quyền', trialsEn: 'No access', active: tier === 'premium' },
                  { tier: 'Pro', trials: 'Không có quyền', trialsEn: 'No access', active: tier === 'pro' },
                  { tier: 'Ultra', trials: 'Không giới hạn ♾️', trialsEn: 'Unlimited ♾️', active: tier === 'ultra' },
                ].map(t => (
                  <div key={t.tier} className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
                    t.active ? 'border-amber-500/30 bg-amber-500/10' : 'border-white/5 bg-white/[0.02]'
                  }`}>
                    <span className="text-slate-300 font-medium">
                      {t.active && '→ '}{t.tier}
                    </span>
                    <span className="text-slate-500">{isEn ? t.trialsEn : t.trials}</span>
                  </div>
                ))}
              </div>

              <Link href="/pricing"
                className="block w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all">
                {isEn ? '✨ View Plans' : '✨ Xem bảng giá'}
              </Link>
              <button onClick={() => setShowUpgrade(false)} className="mt-2 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                {isEn ? 'Maybe later' : 'Để sau'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md space-y-5">
        {/* Header */}
        <div className="text-center pt-1">
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-white">
              🎵 Zentones
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              Ultra
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {isEn
              ? 'Melodies that flow like wind chimes — each time different, always soothing for your brain'
              : 'Giai điệu như chuông gió — mỗi lần khác nhau, luôn giúp não thư giãn tự nhiên'}
          </p>
        </div>

        {/* Trial counter */}
        {maxTrials !== Infinity && (
          <div className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs ${
            trialsRemaining > 0
              ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            <Sparkles size={12} />
            {trialsRemaining > 0
              ? (isEn ? `${trialsRemaining} trial${trialsRemaining > 1 ? 's' : ''} remaining` : `Còn ${trialsRemaining} lần dùng thử`)
              : (isEn ? 'No trials remaining — upgrade for unlimited' : 'Hết lượt thử — nâng cấp để dùng không giới hạn')}
          </div>
        )}

        {/* Visualizer / Now Playing */}
        <div
          className="relative rounded-2xl border p-6 text-center overflow-hidden transition-all duration-500"
          style={{
            background: `linear-gradient(135deg, ${selected.color}15, ${selected.colorTo}10)`,
            borderColor: `${selected.color}25`,
          }}
        >
          {/* Sparkle effects */}
          {sparkles.map(s => (
            <div
              key={s.id}
              className="absolute rounded-full animate-ping"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: s.size,
                height: s.size,
                backgroundColor: selected.color,
                opacity: 0.6,
                animationDuration: `${selected.decay}s`,
              }}
            />
          ))}

          <div className="text-4xl mb-2">{selected.emoji}</div>
          <h2 className="text-base font-bold text-white mb-0.5">
            {isEn ? selected.name : selected.nameVi}
          </h2>
          <p className="text-[10px] text-slate-400 mb-5">
            {isEn ? selected.description : selected.descriptionVi}
          </p>

          {/* Play button */}
          <button
            onClick={handlePlay}
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: !canPlay
                ? 'rgba(255,255,255,0.05)'
                : isPlaying
                  ? `linear-gradient(135deg, ${selected.color}, ${selected.colorTo})`
                  : `linear-gradient(135deg, ${selected.color}30, ${selected.colorTo}20)`,
              boxShadow: isPlaying ? `0 0 30px ${selected.color}40` : 'none',
            }}
          >
            {!canPlay ? (
              <Lock size={18} className="text-slate-500" />
            ) : isPlaying ? (
              <Square size={18} className="text-white" fill="white" />
            ) : (
              <Play size={20} className="text-white ml-0.5" fill="white" />
            )}
          </button>

          {isPlaying && (
            <p className="text-[9px] text-slate-500 mt-2 animate-pulse">
              ♪ {isEn ? 'Generating melodies...' : 'Đang tạo giai điệu...'}
            </p>
          )}
          {isDemoPlaying && (
            <p className="text-[9px] text-emerald-400 mt-2 animate-pulse">
              🎧 {isEn ? 'Demo preview — 10 seconds (not counted as trial)' : 'Nghe thử 10 giây (không tính lượt dùng thử)'}
            </p>
          )}
          {!isPlaying && !isDemoPlaying && canPlay && (
            <button onClick={handleDemo} className="mt-2 text-[9px] text-slate-600 hover:text-slate-400 transition-colors underline underline-offset-2">
              {isEn ? '🎧 Listen to 10s demo (free)' : '🎧 Nghe thử 10 giây (miễn phí)'}
            </button>
          )}
        </div>

        {/* Style selector — scrollable grid */}
        <div>
          <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            {isEn ? '🎨 Choose Style' : '🎨 Chọn Phong Cách'} ({ZEN_STYLES.length})
          </h3>
          <div className="grid grid-cols-5 gap-1.5">
            {ZEN_STYLES.map((style, idx) => (
              <button
                key={idx}
                onClick={() => handleStyleChange(idx)}
                className={`py-2.5 rounded-xl border text-center transition-all duration-200 ${
                  selectedIdx === idx
                    ? 'scale-[1.02]'
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                }`}
                style={selectedIdx === idx ? {
                  background: `linear-gradient(135deg, ${style.color}20, ${style.colorTo}10)`,
                  borderColor: `${style.color}40`,
                } : undefined}
              >
                <div className="text-lg mb-0.5">{style.emoji}</div>
                <div className="text-[7px] text-slate-400 leading-tight px-0.5 truncate">
                  {isEn ? style.name.split(' ')[0] : style.nameVi.split(' ')[0]}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Volume */}
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
          <div className="flex items-center gap-3">
            <Volume2 size={14} className="text-slate-500 flex-shrink-0" />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg"
            />
            <span className="text-[10px] text-slate-500 w-8 text-right">{volume}%</span>
          </div>
        </div>

        {/* Info */}
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 space-y-2">
          <h3 className="text-[10px] font-semibold text-slate-300">
            {isEn ? '💡 How Zentones works' : '💡 Zentones hoạt động thế nào'}
          </h3>
          <div className="space-y-1.5">
            {[
              { step: '1', icon: '🎶', vi: 'Thuật toán tạo giai điệu như chuông gió — mỗi lần phát đều khác nhau', en: 'Algorithm generates wind-chime-like melodies — different each time' },
              { step: '2', icon: '🧠', vi: 'Não bạn lắng nghe thụ động, dần hình thành thói quen không chú ý đến tiếng ù', en: 'Your brain listens passively, gradually learning to ignore the ringing' },
              { step: '3', icon: '✨', vi: 'Sau 4-8 tuần sử dụng đều, cường độ cảm nhận ù tai giảm rõ rệt', en: 'After 4-8 weeks of regular use, perceived tinnitus intensity decreases significantly' },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-2">
                <span className="text-[9px] text-slate-600">{s.icon}</span>
                <p className="text-[9px] text-slate-500 leading-relaxed">{isEn ? s.en : s.vi}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-1.5 pt-1">
            {[
              { emoji: '🔬', label: isEn ? 'Research-backed' : 'Có nghiên cứu' },
              { emoji: '♾️', label: isEn ? 'Never repeats' : 'Không lặp lại' },
              { emoji: '🎵', label: isEn ? '10 styles' : '10 phong cách' },
            ].map(badge => (
              <div key={badge.emoji} className="flex-1 bg-white/[0.03] border border-white/5 rounded-lg p-1.5 text-center">
                <div className="text-xs">{badge.emoji}</div>
                <div className="text-[7px] text-slate-600">{badge.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </AuthGate>
  )
}
