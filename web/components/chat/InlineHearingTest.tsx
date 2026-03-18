'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'

/* ── Audio Engine (adapted from Pah-app) ── */
const FREQS = [1000, 2000, 4000, 8000, 500, 250] as const
const FREQ_LABELS: Record<number, string> = { 250:'Trầm', 500:'Trầm-Trung', 1000:'Trung', 2000:'Trung-Cao', 4000:'Cao', 8000:'Rất Cao' }
const FREQ_CORRECTIONS: Record<number, number> = { 250:12, 500:5, 1000:0, 2000:-4, 4000:-3, 8000:14 }
const BASE_GAIN = 0.0003

const HW = {
  START_LEVEL: 40, STEP_UP: 5, STEP_DOWN: 10,
  MIN_LEVEL: -10, MAX_LEVEL: 90, REQUIRED_ASCENDING: 2,
  PULSE_COUNT: 2, PULSE_ON_MS: 200, PULSE_OFF_MS: 150,
  WAIT_AFTER_MS: 1500, INTER_STIM_MIN: 500, INTER_STIM_MAX: 1200,
  MAX_REVERSALS: 5, ADAPTIVE_START: true,
}

const SEVERITY = [
  { max: 15, label: 'Bình thường', color: '#10b981', emoji: '✅' },
  { max: 25, label: 'Gần bình thường', color: '#84cc16', emoji: '🟢' },
  { max: 40, label: 'Giảm nhẹ', color: '#f59e0b', emoji: '🟡' },
  { max: 55, label: 'Giảm trung bình', color: '#f97316', emoji: '🟠' },
  { max: 70, label: 'Giảm trung bình-nặng', color: '#ef4444', emoji: '🔴' },
  { max: 999, label: 'Giảm nặng', color: '#dc2626', emoji: '🔴' },
]

function classify(avg: number) { return SEVERITY.find(s => avg <= s.max) ?? SEVERITY[SEVERITY.length - 1] }

function getPTA(earResults: Record<number, number>) {
  const ptaFreqs = [500, 1000, 2000, 4000]
  let sum = 0, count = 0
  ptaFreqs.forEach(f => { if (earResults[f] !== undefined) { sum += earResults[f]; count++ } })
  return count > 0 ? Math.round(sum / count) : 0
}

class AudioEngine {
  ctx: AudioContext | null = null
  _cancelled = false
  init() {
    if (!this.ctx) this.ctx = new AudioContext()
    if (this.ctx.state === 'suspended') this.ctx.resume()
  }
  dBHLtoGain(dBHL: number, freq: number) {
    return Math.min(BASE_GAIN * Math.pow(10, (dBHL + (FREQ_CORRECTIONS[freq] ?? 0)) / 20), 1.0)
  }
  playBurst(freq: number, dBHL: number, ear: string, ms: number) {
    return new Promise<void>(resolve => {
      this.init()
      const ctx = this.ctx!
      const now = ctx.currentTime, dur = ms / 1000, gain = this.dBHLtoGain(dBHL, freq)
      const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = freq
      const gn = ctx.createGain()
      gn.gain.setValueAtTime(0, now)
      gn.gain.linearRampToValueAtTime(gain, now + 0.015)
      gn.gain.setValueAtTime(gain, now + dur - 0.015)
      gn.gain.linearRampToValueAtTime(0, now + dur)
      const pan = ctx.createStereoPanner()
      pan.pan.value = ear === 'left' ? -1 : 1
      osc.connect(gn); gn.connect(pan); pan.connect(ctx.destination)
      osc.start(now); osc.stop(now + dur + 0.02)
      setTimeout(resolve, ms)
    })
  }
  async playPulsedTone(freq: number, dBHL: number, ear: string) {
    this._cancelled = false
    for (let i = 0; i < HW.PULSE_COUNT; i++) {
      if (this._cancelled) return
      await this.playBurst(freq, dBHL, ear, HW.PULSE_ON_MS)
      if (i < HW.PULSE_COUNT - 1) await this.delay(HW.PULSE_OFF_MS)
    }
  }
  playCalibrationTone(ear: string) { return this.playBurst(1000, 40, ear, 1500) }
  cancel() { this._cancelled = true }
  delay(ms: number) { return new Promise<void>(r => setTimeout(r, ms)) }
}

/* ── Types ── */
type Screen = 'welcome' | 'calibration' | 'testing' | 'ear_switch' | 'results'
type Results = { right: Record<number, number>; left: Record<number, number> }
interface Props {
  onResult?: (data: Record<string, unknown>) => void
}

/* ── Main Component ── */
export function InlineHearingTest({ onResult }: Props) {
  const [screen, setScreen] = useState<Screen>('welcome')
  const [ear, setEar] = useState<'right' | 'left'>('right')
  const [freq, setFreq] = useState(1000)
  const [progress, setProgress] = useState(0)
  const [isPulsing, setIsPulsing] = useState(false)
  const [results, setResults] = useState<Results | null>(null)
  const [calibDone, setCalibDone] = useState(false)
  const [calibPlaying, setCalibPlaying] = useState(false)

  const audioRef = useRef<AudioEngine | null>(null)
  const stateRef = useRef<{ aborted: boolean; responded: boolean; _clearWait?: () => void; resumeEar?: () => void }>({ aborted: false, responded: false })
  const resolveRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    audioRef.current = new AudioEngine()
    return () => { stateRef.current.aborted = true; audioRef.current?.cancel() }
  }, [])

  const playCalibration = useCallback(async (e: string) => {
    if (!audioRef.current) return
    audioRef.current.init()
    setCalibPlaying(true)
    await audioRef.current.playCalibrationTone(e)
    setCalibPlaying(false)
  }, [])

  function waitForResponse(state: typeof stateRef.current, timeoutMs: number) {
    return new Promise<void>(resolve => {
      resolveRef.current = resolve
      const timer = setTimeout(() => { resolveRef.current = null; resolve() }, timeoutMs)
      state._clearWait = () => { clearTimeout(timer); resolveRef.current = null; resolve() }
    })
  }

  const onHear = useCallback(() => {
    const s = stateRef.current
    if (!s) return
    s.responded = true
    audioRef.current?.cancel()
    if (s._clearWait) s._clearWait()
  }, [])

  // Space key for testing screen
  useEffect(() => {
    if (screen !== 'testing') return
    const h = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); onHear() } }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [screen, onHear])

  const startTest = useCallback(async () => {
    if (!audioRef.current) return
    const audio = audioRef.current; audio.init()
    const allResults: Results = { right: {}, left: {} }
    const state = stateRef.current; state.aborted = false; state.responded = false
    let completed = 0; const total = FREQS.length * 2

    for (let earIdx = 0; earIdx < 2; earIdx++) {
      const earName = earIdx === 0 ? 'right' : 'left'
      if (earIdx > 0) {
        setScreen('ear_switch')
        await new Promise<void>(r => { state.resumeEar = r })
        if (state.aborted) return
      }
      let lastThreshold = HW.START_LEVEL
      for (let fi = 0; fi < FREQS.length; fi++) {
        if (state.aborted) return
        const f = FREQS[fi]
        setEar(earName as 'right' | 'left'); setFreq(f); setProgress(completed / total)

        let level = HW.ADAPTIVE_START && fi > 0 ? Math.min(HW.MAX_LEVEL, Math.max(HW.MIN_LEVEL, lastThreshold + 10)) : HW.START_LEVEL

        // Familiarization (first frequency per ear)
        if (fi === 0) {
          state.responded = false; setIsPulsing(true)
          await audio.playPulsedTone(f, 40, earName)
          if (state.aborted) return
          setIsPulsing(false)
          await waitForResponse(state, 2000)
          if (state.aborted) return
          await audio.delay(300 + Math.random() * 300)
        }

        let direction = 'descending', ascHits = 0, ascLevel: number | null = null, reversals = 0, pres = 0
        while (!state.aborted && pres < 20) {
          pres++
          state.responded = false; setIsPulsing(true)
          await audio.playPulsedTone(f, level, earName)
          if (state.aborted) return
          setIsPulsing(false)
          await waitForResponse(state, HW.WAIT_AFTER_MS)
          if (state.aborted) return

          if (state.responded) {
            if (direction === 'ascending') {
              ascHits = ascLevel === level ? ascHits + 1 : 1; ascLevel = level
              if (ascHits >= HW.REQUIRED_ASCENDING) { allResults[earName as 'right'|'left'][f] = level; lastThreshold = level; completed++; break }
            }
            const prev = direction; direction = 'descending'; if (prev === 'ascending') reversals++
            level = Math.max(HW.MIN_LEVEL, level - HW.STEP_DOWN)
          } else {
            const prev = direction; direction = 'ascending'; if (prev === 'descending') reversals++
            level += HW.STEP_UP
            if (level > HW.MAX_LEVEL) { allResults[earName as 'right'|'left'][f] = HW.MAX_LEVEL; lastThreshold = HW.MAX_LEVEL; completed++; break }
          }
          if (reversals >= HW.MAX_REVERSALS) { allResults[earName as 'right'|'left'][f] = level; lastThreshold = level; completed++; break }
          await audio.delay(HW.INTER_STIM_MIN + Math.random() * (HW.INTER_STIM_MAX - HW.INTER_STIM_MIN))
        }
        if (pres >= 20 && !allResults[earName as 'right'|'left'][f]) { allResults[earName as 'right'|'left'][f] = level; completed++ }
      }
    }

    if (!state.aborted) {
      setResults(allResults); setProgress(1); setScreen('results')
      const rPTA = getPTA(allResults.right), lPTA = getPTA(allResults.left)
      onResult?.({
        rightPTA: rPTA, leftPTA: lPTA,
        rightLevel: classify(rPTA).label, leftLevel: classify(lPTA).label,
        overallLevel: classify(Math.max(rPTA, lPTA)).label,
        results: allResults,
      })
    }
  }, [onResult])

  const onResumeEar = useCallback(() => {
    const s = stateRef.current
    if (s?.resumeEar) { s.resumeEar(); s.resumeEar = undefined }
    setScreen('testing')
  }, [])

  const restart = useCallback(() => {
    stateRef.current.aborted = true; audioRef.current?.cancel()
    setResults(null); setProgress(0); setScreen('welcome')
  }, [])

  /* ── RENDER ── */
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/40 rounded-xl overflow-hidden mt-2">
      {/* Welcome */}
      {screen === 'welcome' && (
        <div className="p-4 text-center space-y-3">
          <div className="text-3xl">🎧</div>
          <h3 className="text-sm font-bold text-white">Kiểm Tra Thính Lực</h3>
          <p className="text-xs text-slate-400">Phương pháp Hughson-Westlake • 6 tần số × 2 tai • ~5 phút</p>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 text-xs text-blue-300">
            ⚠️ Cần tai nghe + môi trường yên tĩnh. Âm lượng 70-80%.
          </div>
          <button onClick={() => setScreen('calibration')} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors font-semibold">
            🎧 Bắt Đầu
          </button>
        </div>
      )}

      {/* Calibration */}
      {screen === 'calibration' && (
        <div className="p-4 text-center space-y-3">
          <h3 className="text-sm font-bold text-white">🔊 Hiệu Chỉnh Âm Lượng</h3>
          <p className="text-xs text-slate-400">Nghe âm 1000Hz để đảm bảo âm lượng phù hợp</p>
          <div className="flex gap-2 justify-center">
            <button disabled={calibPlaying} onClick={() => playCalibration('right')} className="px-3 py-1.5 bg-slate-700 border border-slate-600 text-xs text-slate-200 rounded-lg hover:bg-slate-600 disabled:opacity-50 transition-colors">
              {calibPlaying ? '🔊 ...' : '👉 Tai phải'}
            </button>
            <button disabled={calibPlaying} onClick={() => playCalibration('left')} className="px-3 py-1.5 bg-slate-700 border border-slate-600 text-xs text-slate-200 rounded-lg hover:bg-slate-600 disabled:opacity-50 transition-colors">
              {calibPlaying ? '🔊 ...' : '👈 Tai trái'}
            </button>
          </div>
          <label className="flex items-center gap-2 justify-center text-xs text-slate-300 cursor-pointer">
            <input type="checkbox" checked={calibDone} onChange={e => setCalibDone(e.target.checked)} className="accent-blue-500" />
            Tôi nghe rõ cả hai tai
          </label>
          <button disabled={!calibDone} onClick={() => { setScreen('testing'); setTimeout(startTest, 500) }} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors font-semibold disabled:opacity-40">
            ✓ Bắt Đầu Đo
          </button>
        </div>
      )}

      {/* Testing */}
      {screen === 'testing' && (
        <div className="p-4 text-center space-y-3">
          {/* Progress */}
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>{ear === 'right' ? '👉 Phải' : '👈 Trái'}</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-1 bg-slate-700/50 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all" style={{ width: `${progress * 100}%` }} />
          </div>
          {/* Frequency */}
          <div className="text-xl font-bold text-cyan-400">
            {freq >= 1000 ? freq / 1000 + ' kHz' : freq + ' Hz'}
          </div>
          <div className="text-[10px] text-slate-500">{FREQ_LABELS[freq]}</div>
          {/* Pulse indicator */}
          <div className={`mx-auto w-14 h-14 rounded-full border-2 flex items-center justify-center text-2xl transition-all ${isPulsing ? 'border-cyan-400 bg-cyan-400/10 animate-pulse' : 'border-slate-700 bg-slate-800'}`}>
            {isPulsing ? '🔊' : '🔇'}
          </div>
          {/* Hear button */}
          <button onClick={onHear} className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-sm rounded-xl hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-lg shadow-emerald-500/20">
            ✋ TÔI NGHE THẤY
          </button>
          <p className="text-[10px] text-slate-600">Nhấn Space hoặc click khi nghe thấy</p>
          <button onClick={restart} className="text-[10px] text-slate-500 hover:text-white transition-colors">✕ Dừng</button>
        </div>
      )}

      {/* Ear Switch */}
      {screen === 'ear_switch' && (
        <div className="p-4 text-center space-y-3">
          <div className="text-3xl">👈</div>
          <h3 className="text-sm font-bold text-white">Chuyển sang Tai Trái</h3>
          <p className="text-xs text-slate-400">Tai phải hoàn tất! Đảm bảo tai nghe trái đeo đúng.</p>
          <button onClick={onResumeEar} className="px-4 py-2 bg-blue-600 text-white text-xs rounded-lg font-semibold hover:bg-blue-500 transition-colors">
            ▶ Tiếp Tục
          </button>
        </div>
      )}

      {/* Results */}
      {screen === 'results' && results && (
        <div className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-white text-center">📊 Kết Quả Thính Lực</h3>
          <div className="grid grid-cols-2 gap-2">
            {(['right', 'left'] as const).map(e => {
              const pta = getPTA(results[e])
              const sev = classify(pta)
              return (
                <div key={e} className="bg-slate-700/50 rounded-lg p-2.5 text-center">
                  <div className="text-[10px] text-slate-400 mb-1">{e === 'right' ? '👉 Tai Phải' : '👈 Tai Trái'}</div>
                  <div className="text-lg font-bold" style={{ color: sev.color }}>{pta} dB</div>
                  <div className="text-[10px] font-medium" style={{ color: sev.color }}>{sev.emoji} {sev.label}</div>
                </div>
              )
            })}
          </div>
          {/* Detail table */}
          <div className="bg-slate-700/30 rounded-lg overflow-hidden">
            <table className="w-full text-[10px]">
              <thead><tr className="text-slate-500 border-b border-slate-700">
                <th className="py-1.5 px-2 text-left">Hz</th>
                <th className="py-1.5 px-2">👉 dB</th>
                <th className="py-1.5 px-2">👈 dB</th>
              </tr></thead>
              <tbody>
                {[250, 500, 1000, 2000, 4000, 8000].map(f => (
                  <tr key={f} className="border-b border-slate-700/50">
                    <td className="py-1 px-2 text-slate-400">{f}</td>
                    <td className="py-1 px-2 text-center text-slate-200">{results.right[f] ?? '—'}</td>
                    <td className="py-1 px-2 text-center text-slate-200">{results.left[f] ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={restart} className="w-full py-1.5 bg-slate-700 text-xs text-slate-300 rounded-lg hover:bg-slate-600 transition-colors">
            🔄 Đo lại
          </button>
        </div>
      )}
    </div>
  )
}
