'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useLangStore } from '@/stores/use-lang-store'
import { Play, Square, Volume2, Plus, X, Layers } from 'lucide-react'
import { PremiumGate } from '@/components/premium-gate'
import { AuthGate } from '@/components/auth-gate'

const SOUNDS = [
  { key: 'white', emoji: '〰️', vi: 'Ồn trắng', en: 'White Noise' },
  { key: 'pink', emoji: '🌸', vi: 'Ồn hồng', en: 'Pink Noise' },
  { key: 'brown', emoji: '🟤', vi: 'Ồn nâu', en: 'Brown Noise' },
  { key: 'rain', emoji: '🌧️', vi: 'Tiếng mưa', en: 'Rain' },
  { key: 'ocean', emoji: '🌊', vi: 'Sóng biển', en: 'Ocean' },
  { key: 'forest', emoji: '🌲', vi: 'Rừng', en: 'Forest' },
  { key: 'campfire', emoji: '🔥', vi: 'Lửa trại', en: 'Campfire' },
  { key: 'birds', emoji: '🐦', vi: 'Tiếng chim', en: 'Birds' },
]

interface MixLayer { key: string; volume: number }

function createBuffer(ctx: AudioContext, type: string): AudioBuffer {
  const sr = ctx.sampleRate, len = sr * 2
  const buf = ctx.createBuffer(1, len, sr)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1

  if (type === 'pink' || type === 'rain' || type === 'forest' || type === 'birds') {
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0
    for (let i = 0; i < len; i++) {
      const w = d[i]
      b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759
      b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856
      b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980
      d[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11; b6=w*0.115926
    }
  } else if (type === 'brown' || type === 'campfire') {
    let last = 0
    for (let i = 0; i < len; i++) { d[i]=(last+0.02*d[i])/1.02; last=d[i]; d[i]*=3.5 }
  }
  if (type === 'ocean') {
    let last = 0
    for (let i = 0; i < len; i++) { d[i]=(last+0.02*d[i])/1.02; last=d[i]; d[i]*=3.5 }
    for (let i = 0; i < len; i++) d[i] *= 0.4+0.6*((Math.sin(2*Math.PI*i/sr*0.08)+1)/2)
  }
  return buf
}

// Persist mix to localStorage
function loadSavedMix(): MixLayer[] {
  if (typeof window === 'undefined') return [{ key: 'rain', volume: 50 }, { key: 'brown', volume: 30 }]
  try {
    const saved = localStorage.getItem('tinnimate-mix')
    if (saved) return JSON.parse(saved)
  } catch {}
  return [{ key: 'rain', volume: 50 }, { key: 'brown', volume: 30 }]
}

export default function SoundMixerPage() {
  const { lang } = useLangStore()
  const isEn = lang === 'en'
  const [layers, setLayers] = useState<MixLayer[]>(() => loadSavedMix())
  const [masterVol, setMasterVol] = useState(60)
  const [isPlaying, setIsPlaying] = useState(false)
  const ctxRef = useRef<AudioContext | null>(null)
  const sourcesRef = useRef<Map<string, { src: AudioBufferSourceNode; gain: GainNode }>>(new Map())
  const masterRef = useRef<GainNode | null>(null)

  // Save layers to localStorage
  useEffect(() => {
    try { localStorage.setItem('tinnimate-mix', JSON.stringify(layers)) } catch {}
  }, [layers])

  const stopAll = useCallback(() => {
    sourcesRef.current.forEach(s => { try { s.src.stop() } catch {} })
    sourcesRef.current.clear()
    try { ctxRef.current?.close() } catch {}
    ctxRef.current = null; masterRef.current = null
    setIsPlaying(false)
  }, [])

  const playMix = useCallback(() => {
    stopAll()
    if (layers.length === 0) return
    const ctx = new AudioContext()
    ctxRef.current = ctx
    const master = ctx.createGain()
    master.gain.setValueAtTime(masterVol / 100, ctx.currentTime)
    master.connect(ctx.destination)
    masterRef.current = master

    layers.forEach(layer => {
      const buf = createBuffer(ctx, layer.key)
      const src = ctx.createBufferSource()
      src.buffer = buf; src.loop = true
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(layer.volume / 100, ctx.currentTime)
      src.connect(gain); gain.connect(master); src.start()
      sourcesRef.current.set(layer.key, { src, gain })
    })
    setIsPlaying(true)
  }, [layers, masterVol, stopAll])

  // Live master volume
  useEffect(() => {
    if (masterRef.current && ctxRef.current) {
      masterRef.current.gain.setValueAtTime(masterVol / 100, ctxRef.current.currentTime)
    }
  }, [masterVol])

  const updateLayerVol = (key: string, vol: number) => {
    setLayers(ls => ls.map(l => l.key === key ? { ...l, volume: vol } : l))
    const s = sourcesRef.current.get(key)
    if (s && ctxRef.current) s.gain.gain.setValueAtTime(vol / 100, ctxRef.current.currentTime)
  }

  const addLayer = (key: string) => {
    if (layers.length >= 4 || layers.some(l => l.key === key)) return
    setLayers(prev => [...prev, { key, volume: 40 }])
  }

  const removeLayer = (key: string) => {
    // Stop and disconnect this particular layer if playing
    const s = sourcesRef.current.get(key)
    if (s) { try { s.src.stop() } catch {}; sourcesRef.current.delete(key) }
    setLayers(ls => ls.filter(l => l.key !== key))
    // If no layers left, stop everything
    if (layers.length <= 1 && isPlaying) stopAll()
  }

  useEffect(() => () => { stopAll() }, [stopAll])

  const availableSounds = SOUNDS.filter(s => !layers.some(l => l.key === s.key))

  return (
    <AuthGate feature="Sound Mixer" featureVi="Trộn Âm Thanh" emoji="🏛️"
      previewItems={[
        { emoji: '〰️', label: 'White noise' },
        { emoji: '🌧️', label: 'Rain' },
        { emoji: '🌊', label: 'Ocean' },
      ]}>
    <PremiumGate feature="Sound Mixer" featureVi="Trộn Âm Thanh">
    <div className="h-full overflow-y-auto p-4 sm:p-6 md:p-8 max-w-md mx-auto">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-blue-950/15 to-slate-950" />
        <div className="absolute top-[25%] right-[25%] w-[250px] h-[250px] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center text-3xl mb-3">
          🎛️
        </div>
        <h1 className="text-xl font-bold text-white">
          {isEn ? 'Sound Mixer' : 'Trộn Âm Thanh'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isEn ? 'Mix up to 4 sounds for your perfect therapy' : 'Trộn tối đa 4 âm thanh cho liệu pháp hoàn hảo'}
        </p>
      </div>

      {/* Layers */}
      <div className="space-y-3 mb-4">
        {layers.map(layer => {
          const sound = SOUNDS.find(s => s.key === layer.key)!
          return (
            <div key={layer.key} className="bg-white/[0.03] border border-white/5 rounded-xl p-3 flex items-center gap-3">
              <span className="text-xl flex-shrink-0">{sound.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-white">{isEn ? sound.en : sound.vi}</span>
                  <span className="text-[10px] text-slate-500">{layer.volume}%</span>
                </div>
                <input type="range" min={0} max={100} value={layer.volume}
                  onChange={e => updateLayerVol(layer.key, +e.target.value)}
                  className="w-full h-1 accent-blue-500 cursor-pointer" />
              </div>
              <button onClick={() => removeLayer(layer.key)}
                className="text-slate-600 hover:text-red-400 transition-colors p-1">
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>

      {/* Add sound */}
      {layers.length < 4 && (
        <div className="mb-4">
          <p className="text-[10px] text-slate-500 mb-2">{isEn ? 'Add sound layer' : 'Thêm lớp âm thanh'}</p>
          <div className="flex flex-wrap gap-1.5">
            {availableSounds.map(s => (
              <button key={s.key} onClick={() => addLayer(s.key)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-white/[0.03] border border-white/5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all">
                <Plus size={10} /> {s.emoji} {isEn ? s.en : s.vi}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Master volume */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Volume2 size={14} className="text-slate-400" />
          <span className="text-xs text-slate-400">{isEn ? 'Master Volume' : 'Âm lượng chung'}</span>
          <span className="text-xs text-white ml-auto">{masterVol}%</span>
        </div>
        <input type="range" min={0} max={100} value={masterVol}
          onChange={e => setMasterVol(+e.target.value)}
          className="w-full h-1.5 accent-blue-500 cursor-pointer" />
      </div>

      {/* Play / Stop */}
      <button onClick={isPlaying ? stopAll : playMix} disabled={layers.length === 0}
        className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 ${
          isPlaying
            ? 'bg-red-500/15 border border-red-500/20 text-red-400'
            : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
        }`}>
        {isPlaying
          ? <><Square size={16} /> {isEn ? 'Stop Mix' : 'Dừng'}</>
          : <><Layers size={16} /> {isEn ? 'Play Mix' : 'Phát Hỗn Hợp'} ({layers.length} {isEn ? 'layers' : 'lớp'})</>}
      </button>

      {/* Tip */}
      {isPlaying && (
        <p className="text-center text-[10px] text-blue-400 mt-3 animate-pulse">
          🎶 {isEn ? 'Adjust volume sliders in real-time while playing!' : 'Điều chỉnh âm lượng từng lớp khi đang phát!'}
        </p>
      )}
    </div>
    </PremiumGate>
    </AuthGate>
  )
}
