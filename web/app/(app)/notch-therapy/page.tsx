'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useLangStore } from '@/stores/use-lang-store'
import { Play, Square, Volume2, Target } from 'lucide-react'

export default function NotchTherapyPage() {
  const { lang } = useLangStore()
  const isEn = lang === 'en'
  const [step, setStep] = useState<'calibrate' | 'therapy'>('calibrate')
  const [freq, setFreq] = useState(4000)
  const [notchWidth, setNotchWidth] = useState(1)
  const [volume, setVolume] = useState(40)
  const [isPlaying, setIsPlaying] = useState(false)
  const [calibrating, setCalibrating] = useState(false)
  const ctxRef = useRef<AudioContext | null>(null)
  const oscRef = useRef<OscillatorNode | null>(null)
  const nodesRef = useRef<{ src?: AudioBufferSourceNode; gain?: GainNode; notch?: BiquadFilterNode }>({})

  const stopAll = useCallback(() => {
    try { oscRef.current?.stop() } catch {}
    try { nodesRef.current.src?.stop() } catch {}
    try { ctxRef.current?.close() } catch {}
    ctxRef.current = null
    oscRef.current = null
    nodesRef.current = {}
    setIsPlaying(false)
    setCalibrating(false)
  }, [])

  // Calibration: play pure tone at selected frequency — LIVE update via AudioParam
  const playCalibration = useCallback(() => {
    stopAll()
    const ctx = new AudioContext()
    ctxRef.current = ctx
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    oscRef.current = osc
    nodesRef.current.gain = gain
    setCalibrating(true)
  }, [freq, stopAll])

  // Live-update oscillator frequency while calibrating
  useEffect(() => {
    if (calibrating && oscRef.current && ctxRef.current) {
      oscRef.current.frequency.setTargetAtTime(freq, ctxRef.current.currentTime, 0.02)
    }
  }, [freq, calibrating])

  // Notch therapy: play broadband noise with notch filter
  const playTherapy = useCallback(() => {
    stopAll()
    const ctx = new AudioContext()
    ctxRef.current = ctx
    const sr = ctx.sampleRate
    const len = sr * 2
    const buf = ctx.createBuffer(1, len, sr)
    const data = buf.getChannelData(0)
    // Pink noise
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1
      b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759
      b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856
      b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980
      data[i] = (b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11
      b6 = w*0.115926
    }
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.loop = true

    // Notch filter at tinnitus frequency
    const notch = ctx.createBiquadFilter()
    notch.type = 'notch'
    notch.frequency.setValueAtTime(freq, ctx.currentTime)
    notch.Q.setValueAtTime(freq / (notchWidth * 100), ctx.currentTime)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(volume / 100, ctx.currentTime)

    src.connect(notch)
    notch.connect(gain)
    gain.connect(ctx.destination)
    src.start()
    nodesRef.current = { src, gain, notch }
    setIsPlaying(true)
  }, [freq, notchWidth, volume, stopAll])

  // Live volume during therapy
  useEffect(() => {
    if (nodesRef.current.gain && ctxRef.current) {
      nodesRef.current.gain.gain.setValueAtTime(volume / 100, ctxRef.current.currentTime)
    }
  }, [volume])

  useEffect(() => () => { stopAll() }, [stopAll])

  const freqLabel = freq >= 1000 ? `${(freq/1000).toFixed(1)} kHz` : `${freq} Hz`

  // Pre-compute stable random heights for visualization (no flickering)
  const barHeights = useMemo(() => Array.from({ length: 40 }, () => 30 + Math.random() * 55), [])

  return (
    <div className="h-full overflow-y-auto flex flex-col items-center justify-center p-6">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-teal-950/20 to-slate-950" />
        <div className="absolute top-[30%] left-[40%] w-[300px] h-[300px] rounded-full bg-teal-500/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/20 flex items-center justify-center text-3xl mb-3">
            🎵
          </div>
          <h1 className="text-xl font-bold text-white">
            {isEn ? 'Notch Therapy' : 'Liệu Pháp Lọc Âm'}
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {isEn
              ? 'Removes your tinnitus frequency from sound to retrain your brain'
              : 'Lọc bỏ tần số ù tai để huấn luyện lại não bộ'}
          </p>
        </div>

        {/* Step tabs */}
        <div className="flex bg-white/[0.03] rounded-xl p-1">
          {(['calibrate', 'therapy'] as const).map(s => (
            <button key={s} onClick={() => { stopAll(); setStep(s) }}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                step === s ? 'bg-teal-600/20 text-teal-300' : 'text-slate-500 hover:text-white'
              }`}>
              {s === 'calibrate'
                ? (isEn ? '1. Find Frequency' : '1. Tìm Tần Số')
                : (isEn ? '2. Start Therapy' : '2. Bắt Đầu Trị Liệu')}
            </button>
          ))}
        </div>

        {step === 'calibrate' && (
          <div className="space-y-4">
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
              <p className="text-xs text-slate-400 mb-4">
                {isEn
                  ? 'Adjust the slider until the tone matches your tinnitus pitch. Use headphones for best results.'
                  : 'Điều chỉnh thanh trượt đến khi âm thanh khớp với tiếng ù tai. Sử dụng tai nghe.'}
              </p>

              <div className="text-center mb-4">
                <div className="text-3xl font-mono font-light text-teal-300">{freqLabel}</div>
                <p className="text-[10px] text-slate-600">{isEn ? 'Tinnitus frequency' : 'Tần số ù tai'}</p>
              </div>

              <input type="range" min={500} max={12000} step={50} value={freq}
                onChange={e => setFreq(+e.target.value)}
                className="w-full h-2 accent-teal-500 cursor-pointer mb-1" />
              <div className="flex justify-between text-[9px] text-slate-600">
                <span>500 Hz</span><span>4 kHz</span><span>8 kHz</span><span>12 kHz</span>
              </div>

              {/* Frequency guide */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  { f: 2000, label: isEn ? 'Low hum' : 'Âm trầm', emoji: '🔊' },
                  { f: 4000, label: isEn ? 'Ringing' : 'Tiếng rít', emoji: '🔔' },
                  { f: 8000, label: isEn ? 'High hiss' : 'Rít cao', emoji: '📡' },
                ].map(g => (
                  <button key={g.f} onClick={() => setFreq(g.f)}
                    className={`py-2 rounded-lg border text-xs transition-all ${freq === g.f ? 'bg-teal-600/15 border-teal-500/30 text-teal-300' : 'bg-white/[0.02] border-white/5 text-slate-500 hover:text-white'}`}>
                    <div className="text-base">{g.emoji}</div>
                    <div className="text-[10px]">{g.label}</div>
                    <div className="text-[9px] text-slate-600">{g.f >= 1000 ? `${g.f/1000}k` : g.f} Hz</div>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={calibrating ? stopAll : playCalibration}
              className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                calibrating
                  ? 'bg-red-500/15 border border-red-500/20 text-red-400'
                  : 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white'
              }`}>
              {calibrating
                ? <><Square size={16} /> {isEn ? 'Stop Test Tone' : 'Dừng Âm Thử'}</>
                : <><Target size={16} /> {isEn ? 'Play Test Tone' : 'Phát Âm Thử'}</>}
            </button>

            {calibrating && (
              <p className="text-center text-[10px] text-teal-400 animate-pulse">
                🎵 {isEn ? 'Move the slider — tone updates live!' : 'Kéo thanh trượt — âm thanh thay đổi trực tiếp!'}
              </p>
            )}

            <button onClick={() => { stopAll(); setStep('therapy') }}
              className="w-full py-2.5 text-xs text-teal-400 hover:text-teal-300 transition-colors">
              {isEn ? `Confirm ${freqLabel} → Start Therapy` : `Xác nhận ${freqLabel} → Bắt Đầu`} →
            </button>
          </div>
        )}

        {step === 'therapy' && (
          <div className="space-y-4">
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400">{isEn ? 'Notch at' : 'Lọc tại'}</span>
                <span className="text-sm font-mono text-teal-300">{freqLabel}</span>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>{isEn ? 'Notch width' : 'Độ rộng lọc'}</span>
                  <span>{notchWidth === 0.5 ? (isEn ? 'Narrow' : 'Hẹp') : notchWidth === 1 ? (isEn ? 'Medium' : 'Vừa') : (isEn ? 'Wide' : 'Rộng')}</span>
                </div>
                <div className="flex gap-2">
                  {[0.5, 1, 2].map(w => (
                    <button key={w} disabled={isPlaying}
                      onClick={() => setNotchWidth(w)}
                      className={`flex-1 py-1.5 text-xs rounded-lg border transition-all ${
                        notchWidth === w
                          ? 'bg-teal-600/20 border-teal-500/30 text-teal-300'
                          : 'bg-white/[0.02] border-white/5 text-slate-500 disabled:opacity-40'
                      }`}>
                      {w === 0.5 ? (isEn ? 'Narrow' : 'Hẹp') : w === 1 ? (isEn ? 'Medium' : 'Vừa') : (isEn ? 'Wide' : 'Rộng')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Volume2 size={14} className="text-slate-500" />
                <input type="range" min={0} max={100} value={volume}
                  onChange={e => setVolume(+e.target.value)}
                  className="flex-1 h-1 accent-teal-500 cursor-pointer" />
                <span className="text-[10px] text-slate-500 w-6 text-right">{volume}%</span>
              </div>
            </div>

            {/* Visualization — stable bars, no flickering */}
            {isPlaying && (
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                <div className="relative h-16 flex items-end gap-[2px]">
                  {barHeights.map((h, i) => {
                    const f = 200 + i * 300
                    const isNotched = Math.abs(f - freq) < notchWidth * 150
                    return (
                      <div key={i}
                        className={`flex-1 rounded-t transition-all duration-500 ${isNotched ? 'bg-red-500/30' : 'bg-teal-500/40'}`}
                        style={{
                          height: isNotched ? '8%' : `${h}%`,
                        }} />
                    )
                  })}
                </div>
                <div className="flex justify-between text-[8px] text-slate-600 mt-1">
                  <span>200 Hz</span>
                  <span className="text-red-400">↓ {isEn ? 'Notch' : 'Lọc'} @ {freqLabel}</span>
                  <span>12 kHz</span>
                </div>
              </div>
            )}

            <button onClick={isPlaying ? stopAll : playTherapy}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                isPlaying
                  ? 'bg-red-500/15 border border-red-500/20 text-red-400'
                  : 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white'
              }`}>
              {isPlaying ? <><Square size={16} /> {isEn ? 'Stop' : 'Dừng'}</> : <><Play size={16} /> {isEn ? 'Start Notch Therapy' : 'Bắt Đầu Trị Liệu'}</>}
            </button>

            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-500">
                💡 {isEn
                  ? 'Use headphones. Listen 1-2 hours daily for 3+ months for best results.'
                  : 'Sử dụng tai nghe. Nghe 1-2 giờ/ngày trong 3+ tháng để có kết quả tốt nhất.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
