'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'

/* ── Sound Types Configuration ── */
const SOUND_TYPES: Record<string, { label: string; emoji: string; description: string; freq?: number; type: OscillatorType | 'noise' }> = {
  white_noise: { label: 'White Noise', emoji: '🌊', description: 'Tiếng ồn trắng — che lấp ù tai', type: 'noise' },
  pink_noise: { label: 'Pink Noise', emoji: '🌸', description: 'Tiếng ồn hồng — tự nhiên, thoải mái', type: 'noise' },
  brown_noise: { label: 'Brown Noise', emoji: '🍂', description: 'Tiếng ồn nâu — trầm, thư giãn', type: 'noise' },
  rain: { label: 'Tiếng mưa', emoji: '🌧️', description: 'Âm thanh mưa rơi', type: 'noise' },
  tone_440: { label: 'Tone 440 Hz', emoji: '🎵', description: 'Âm thanh thuần 440Hz', freq: 440, type: 'sine' },
  tone_1000: { label: 'Tone 1000 Hz', emoji: '🎶', description: 'Âm thanh thuần 1kHz', freq: 1000, type: 'sine' },
}

interface Props {
  soundType?: string
  durationMinutes?: number
  onResult?: (data: Record<string, unknown>) => void
}

export function InlineSoundPlayer({ soundType = 'white_noise', durationMinutes = 15, onResult }: Props) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(30)
  const [elapsed, setElapsed] = useState(0)
  const [selectedSound, setSelectedSound] = useState(soundType)
  const ctxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const totalSeconds = durationMinutes * 60
  const config = SOUND_TYPES[selectedSound] ?? SOUND_TYPES.white_noise

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop()
    }
  }, [])

  // Update volume in real-time
  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.setValueAtTime(volume / 100, ctxRef.current?.currentTime ?? 0)
    }
  }, [volume])

  const createNoiseBuffer = useCallback((ctx: AudioContext, type: string) => {
    const sampleRate = ctx.sampleRate
    const bufferSize = sampleRate * 2 // 2 seconds buffer (loops)
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate)
    const output = buffer.getChannelData(0)

    // White noise
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }

    if (type === 'pink_noise' || type === 'rain') {
      // Apply pink noise filter (1/f)
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = output[i]
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.96900 * b2 + white * 0.1538520
        b3 = 0.86650 * b3 + white * 0.3104856
        b4 = 0.55000 * b4 + white * 0.5329522
        b5 = -0.7616 * b5 - white * 0.0168980
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
        output[i] *= 0.11 // normalize
        b6 = white * 0.115926
      }
    } else if (type === 'brown_noise') {
      let lastOut = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = output[i]
        output[i] = (lastOut + (0.02 * white)) / 1.02
        lastOut = output[i]
        output[i] *= 3.5 // normalize
      }
    }

    return buffer
  }, [])

  const play = useCallback(() => {
    const ctx = new AudioContext()
    ctxRef.current = ctx
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(volume / 100, ctx.currentTime)
    gain.connect(ctx.destination)
    gainRef.current = gain

    if (config.type === 'noise') {
      const buffer = createNoiseBuffer(ctx, selectedSound)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.loop = true
      source.connect(gain)
      source.start()
      sourceRef.current = source
    } else {
      const osc = ctx.createOscillator()
      osc.type = config.type
      osc.frequency.value = config.freq ?? 440
      osc.connect(gain)
      osc.start()
      sourceRef.current = osc
    }

    setIsPlaying(true)
    setElapsed(0)

    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1
        if (next >= totalSeconds) {
          stop()
          onResult?.({ sound_type: selectedSound, duration_played: next, completed: true })
        }
        return next
      })
    }, 1000)
  }, [config, selectedSound, volume, totalSeconds, onResult, createNoiseBuffer])

  const stop = useCallback(() => {
    try { sourceRef.current?.stop() } catch { /* ignore */ }
    try { ctxRef.current?.close() } catch { /* ignore */ }
    if (timerRef.current) clearInterval(timerRef.current)
    sourceRef.current = null
    ctxRef.current = null
    gainRef.current = null
    timerRef.current = null
    setIsPlaying(false)
  }, [])

  const togglePlay = useCallback(() => {
    if (isPlaying) stop()
    else play()
  }, [isPlaying, play, stop])

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
  const progressPct = totalSeconds > 0 ? (elapsed / totalSeconds) * 100 : 0

  return (
    <div className="bg-gradient-to-br from-emerald-900/30 to-slate-800 border border-emerald-500/20 rounded-xl overflow-hidden mt-2">
      <div className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.emoji}</span>
          <div>
            <p className="text-xs font-semibold text-emerald-300">🎧 Liệu pháp âm thanh</p>
            <p className="text-[10px] text-slate-400">{config.description}</p>
          </div>
        </div>

        {/* Sound selector */}
        <div className="flex gap-1.5 flex-wrap">
          {Object.entries(SOUND_TYPES).map(([key, s]) => (
            <button
              key={key}
              disabled={isPlaying}
              onClick={() => setSelectedSound(key)}
              className={`px-2 py-1 text-[10px] rounded-md border transition-colors ${
                selectedSound === key
                  ? 'bg-emerald-600/30 border-emerald-500/40 text-emerald-200'
                  : 'bg-slate-700/40 border-slate-600/30 text-slate-400 hover:bg-slate-600/40'
              } disabled:opacity-50`}
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
            <span>{formatTime(elapsed)}</span>
            <span>{formatTime(totalSeconds)}</span>
          </div>
          <div className="h-1 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-green-400 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all ${
              isPlaying
                ? 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-500/20'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20'
            }`}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          {/* Volume */}
          <div className="flex-1 flex items-center gap-2">
            <span className="text-[10px] text-slate-500">🔊</span>
            <input
              type="range"
              min={0} max={100}
              value={volume}
              onChange={e => setVolume(Number(e.target.value))}
              className="flex-1 h-1 accent-emerald-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 w-6 text-right">{volume}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
