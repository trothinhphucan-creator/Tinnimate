'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Ear, ChevronRight, Volume2, RotateCcw } from 'lucide-react'

type TestStep = 'intro' | 'calibration' | 'testing' | 'results'

const TEST_FREQUENCIES = [250, 500, 1000, 2000, 4000, 8000]
const START_DB = 40 // start presenting at 40 dB HL (simulated)
const STEP_DB = 10
const MIN_DB = 0
const MAX_DB = 80

export default function HearingTestPage() {
  const [step, setStep] = useState<TestStep>('intro')
  const [currentFreqIdx, setCurrentFreqIdx] = useState(0)
  const [currentDb, setCurrentDb] = useState(START_DB)
  const [results, setResults] = useState<Record<number, number>>({})
  const [isPlayingTone, setIsPlayingTone] = useState(false)
  const oscRef = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)

  // Get or create AudioContext
  const getAudioCtx = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext()
    }
    return ctxRef.current
  }, [])

  // Play pure tone at given frequency and dB level
  const playTone = useCallback(async (freq: number, dbLevel: number, durationMs = 1500) => {
    const ctx = getAudioCtx()
    if (ctx.state === 'suspended') await ctx.resume()

    // Stop previous tone
    if (oscRef.current) {
      try { oscRef.current.stop() } catch { /* ignore */ }
    }

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.value = freq

    // Convert dB to linear gain (0 dB HL ≈ very soft, 80 dB HL ≈ loud)
    // Simulated mapping: dB 0 → gain 0.001, dB 80 → gain 0.3
    const linear = 0.001 * Math.pow(10, (dbLevel / 80) * Math.log10(0.3 / 0.001))
    gain.gain.value = linear

    // Smooth envelope to avoid clicks
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(linear, ctx.currentTime + 0.05)
    gain.gain.setValueAtTime(linear, ctx.currentTime + durationMs / 1000 - 0.05)
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + durationMs / 1000)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + durationMs / 1000)

    oscRef.current = osc
    gainRef.current = gain
    setIsPlayingTone(true)

    return new Promise<void>(resolve => {
      osc.onended = () => {
        setIsPlayingTone(false)
        resolve()
      }
    })
  }, [getAudioCtx])

  // Handle calibration
  const handleCalibration = useCallback(async () => {
    await playTone(1000, 30, 2000)
    setStep('testing')
  }, [playTone])

  // Present current tone
  const presentTone = useCallback(async () => {
    const freq = TEST_FREQUENCIES[currentFreqIdx]
    await playTone(freq, currentDb)
  }, [currentFreqIdx, currentDb, playTone])

  // Auto-play tone when testing step changes
  useEffect(() => {
    if (step === 'testing') {
      const timeout = setTimeout(() => presentTone(), 500)
      return () => clearTimeout(timeout)
    }
  }, [step, currentFreqIdx, currentDb, presentTone])

  // Handle response
  const handleResponse = useCallback((heard: boolean) => {
    const freq = TEST_FREQUENCIES[currentFreqIdx]

    if (heard) {
      if (currentDb <= MIN_DB) {
        // Found threshold at minimum
        setResults(prev => ({ ...prev, [freq]: MIN_DB }))
        advanceToNextFreq()
      } else {
        // Go quieter
        setCurrentDb(prev => Math.max(MIN_DB, prev - STEP_DB))
      }
    } else {
      if (currentDb >= MAX_DB) {
        // Can't hear even at max
        setResults(prev => ({ ...prev, [freq]: MAX_DB }))
        advanceToNextFreq()
      } else {
        // Threshold found at current + step level
        setResults(prev => ({ ...prev, [freq]: currentDb + STEP_DB }))
        advanceToNextFreq()
      }
    }
  }, [currentFreqIdx, currentDb])

  const advanceToNextFreq = useCallback(() => {
    if (currentFreqIdx < TEST_FREQUENCIES.length - 1) {
      setCurrentFreqIdx(i => i + 1)
      setCurrentDb(START_DB)
    } else {
      setStep('results')
    }
  }, [currentFreqIdx])

  const resetTest = useCallback(() => {
    setStep('intro')
    setCurrentFreqIdx(0)
    setCurrentDb(START_DB)
    setResults({})
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      if (oscRef.current) try { oscRef.current.stop() } catch { /* */ }
      if (ctxRef.current) ctxRef.current.close()
    }
  }, [])

  // Hearing level interpretation
  const getHearingLevel = (db: number) => {
    if (db <= 20) return { label: 'Bình thường', color: 'text-green-400' }
    if (db <= 40) return { label: 'Giảm nhẹ', color: 'text-yellow-400' }
    if (db <= 55) return { label: 'Giảm trung bình', color: 'text-orange-400' }
    if (db <= 70) return { label: 'Giảm nặng', color: 'text-red-400' }
    return { label: 'Giảm rất nặng', color: 'text-red-500' }
  }

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">👂 Kiểm tra thính lực</h1>
        <p className="text-slate-400">Đo ngưỡng nghe của bạn tại nhiều tần số khác nhau</p>
      </div>

      {step === 'intro' && (
        <div className="bg-slate-800/80 rounded-2xl p-8 text-center border border-slate-700/50">
          <Ear size={64} className="mx-auto mb-4 text-blue-400" />
          <h2 className="text-xl font-semibold text-white mb-3">Chuẩn bị kiểm tra</h2>
          <ul className="text-slate-400 text-sm space-y-2 mb-8 text-left max-w-sm mx-auto">
            <li>✅ Đeo tai nghe (bắt buộc, không phải loa ngoài)</li>
            <li>✅ Ở nơi yên tĩnh nhất có thể</li>
            <li>✅ Âm lượng thiết bị ở mức 60-70%</li>
            <li>✅ Nhấn "Nghe thấy" khi nghe được âm thanh</li>
          </ul>
          <button onClick={() => setStep('calibration')}
            className="flex items-center gap-2 mx-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors">
            Bắt đầu <ChevronRight size={18} />
          </button>
        </div>
      )}

      {step === 'calibration' && (
        <div className="bg-slate-800/80 rounded-2xl p-8 text-center border border-slate-700/50">
          <Volume2 size={48} className="mx-auto mb-4 text-yellow-400" />
          <h2 className="text-xl font-semibold text-white mb-3">Hiệu chỉnh âm lượng</h2>
          <p className="text-slate-400 mb-6 text-sm">Nhấn nút bên dưới để phát tone 1000Hz. Điều chỉnh âm lượng thiết bị cho đến khi bạn vừa nghe thấy rõ.</p>
          <button onClick={handleCalibration}
            className={`w-20 h-20 mx-auto mb-6 rounded-full border-2 flex items-center justify-center transition-all ${
              isPlayingTone
                ? 'bg-blue-600/30 border-blue-500 animate-pulse'
                : 'bg-blue-600/10 border-blue-500/50 hover:bg-blue-600/20'
            }`}>
            <span className="text-2xl">🔊</span>
          </button>
          <p className="text-slate-500 text-xs mb-4">Nhấn để phát → tự động chuyển sang bài test</p>
        </div>
      )}

      {step === 'testing' && (
        <div className="bg-slate-800/80 rounded-2xl p-8 text-center border border-slate-700/50">
          <div className="mb-4">
            <div className="text-sm text-slate-400 mb-2">
              Tần số {currentFreqIdx + 1}/{TEST_FREQUENCIES.length}
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full transition-all"
                style={{ width: `${((currentFreqIdx + 1) / TEST_FREQUENCIES.length) * 100}%` }} />
            </div>
          </div>

          <div className="text-5xl font-bold text-white mb-1">
            {TEST_FREQUENCIES[currentFreqIdx]}
          </div>
          <div className="text-slate-400 mb-2">Hz</div>
          <div className="text-xs text-slate-500 mb-6">Mức âm: {currentDb} dB</div>

          <div className={`w-24 h-24 mx-auto mb-8 rounded-full border-2 flex items-center justify-center transition-all ${
            isPlayingTone
              ? 'bg-blue-600/30 border-blue-500 animate-pulse'
              : 'bg-slate-700/50 border-slate-600'
          }`}>
            <span className="text-4xl">{isPlayingTone ? '🎵' : '🔇'}</span>
          </div>

          <div className="flex gap-4 justify-center">
            <button onClick={() => handleResponse(false)}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors">
              Không nghe thấy
            </button>
            <button onClick={() => { handleResponse(true); presentTone() }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors">
              Nghe thấy ✓
            </button>
          </div>
          <button onClick={() => presentTone()}
            className="mt-4 text-slate-500 text-xs hover:text-slate-300 transition-colors">
            🔄 Phát lại
          </button>
        </div>
      )}

      {step === 'results' && (
        <div className="bg-slate-800/80 rounded-2xl p-8 border border-slate-700/50">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">Kết quả thính lực đồ</h2>

          {/* Audiogram bars */}
          <div className="space-y-3 mb-6">
            {TEST_FREQUENCIES.map(freq => {
              const db = results[freq] ?? 80
              const level = getHearingLevel(db)
              const barWidth = Math.max(5, 100 - (db / MAX_DB) * 90)
              return (
                <div key={freq} className="flex items-center gap-3">
                  <span className="text-slate-400 text-sm w-16 text-right">{freq} Hz</span>
                  <div className="flex-1 bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        db <= 20 ? 'bg-green-500' : db <= 40 ? 'bg-yellow-500' : db <= 55 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="text-sm w-20 text-right">
                    <span className="text-slate-300">{db} dB</span>
                  </span>
                  <span className={`text-xs w-20 ${level.color}`}>{level.label}</span>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 justify-center mb-6 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> ≤20 dB Bình thường</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> 21-40 dB Giảm nhẹ</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> 41-55 dB Giảm TB</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> &gt;55 dB Giảm nặng</span>
          </div>

          <p className="text-slate-400 text-sm text-center mb-6">
            ⚠️ Kết quả chỉ mang tính tham khảo. Hãy đến bác sĩ tai mũi họng để kiểm tra chính xác.
          </p>

          <div className="flex gap-3">
            <button onClick={resetTest}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors">
              <RotateCcw size={16} /> Kiểm tra lại
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
