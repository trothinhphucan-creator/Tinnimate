'use client'
// Client-side only — Sound generation for tinnitus therapy
// Supports: noise (white/pink/brown), binaural beats, nature sounds (rain/ocean/forest/campfire/birds)
import type { TherapySound } from '@/types'

const BINAURAL_BEATS: Partial<Record<TherapySound, number>> = {
  binaural_alpha: 10,
  binaural_theta: 6,
  binaural_delta: 2,
}

const NOISE_SOUNDS: TherapySound[] = ['white_noise', 'pink_noise', 'brown_noise']
const NATURE_SOUNDS: TherapySound[] = ['rain', 'ocean', 'forest', 'campfire']

type NoiseType = 'white' | 'pink' | 'brown'

/* ── Nature sound buffer builder (Web Audio API) ── */
function createNatureBuffer(ctx: AudioContext, type: string): AudioBuffer {
  const sr = ctx.sampleRate
  const len = sr * 2 // 2-second loop
  const buf = ctx.createBuffer(1, len, sr)
  const out = buf.getChannelData(0)

  // Start with white noise
  for (let i = 0; i < len; i++) out[i] = Math.random() * 2 - 1

  if (type === 'rain') {
    // Pink noise + rain amplitude modulation
    let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0
    for (let i = 0; i < len; i++) {
      const w = out[i]
      b0 = 0.99886*b0 + w*0.0555179; b1 = 0.99332*b1 + w*0.0750759
      b2 = 0.96900*b2 + w*0.1538520; b3 = 0.86650*b3 + w*0.3104856
      b4 = 0.55000*b4 + w*0.5329522; b5 = -0.7616*b5 - w*0.0168980
      out[i] = (b0+b1+b2+b3+b4+b5+b6+w*0.5362) * 0.11
      b6 = w * 0.115926
    }
    // Add raindrop modulation
    for (let i = 0; i < len; i++) {
      const mod = 0.5 + 0.5 * Math.sin(2*Math.PI*i/sr*0.3) * Math.sin(2*Math.PI*i/sr*1.7)
      out[i] *= (0.6 + 0.4 * mod)
    }
  } else if (type === 'ocean') {
    // Brown noise + slow wave modulation
    let last = 0
    for (let i = 0; i < len; i++) {
      out[i] = (last + 0.02 * out[i]) / 1.02
      last = out[i]
      out[i] *= 3.5
    }
    for (let i = 0; i < len; i++) {
      const waveEnv = 0.4 + 0.6 * ((Math.sin(2*Math.PI*i/sr*0.08) + 1) / 2)
      out[i] *= waveEnv
    }
  } else if (type === 'forest') {
    // Pink noise (insects) + subtle chirps
    let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0
    for (let i = 0; i < len; i++) {
      const w = out[i]
      b0 = 0.99886*b0 + w*0.0555179; b1 = 0.99332*b1 + w*0.0750759
      b2 = 0.96900*b2 + w*0.1538520; b3 = 0.86650*b3 + w*0.3104856
      b4 = 0.55000*b4 + w*0.5329522; b5 = -0.7616*b5 - w*0.0168980
      out[i] = (b0+b1+b2+b3+b4+b5+b6+w*0.5362) * 0.08 // quieter base
      b6 = w * 0.115926
    }
    // Add periodic bird chirps
    for (let i = 0; i < len; i++) {
      const t = i / sr
      const chirp = Math.sin(2*Math.PI*t*(2000+800*Math.sin(2*Math.PI*t*8)))
      const env = Math.max(0, Math.sin(2*Math.PI*t*1.5)) ** 8
      out[i] = out[i] * 0.7 + chirp * env * 0.025
    }
  } else if (type === 'campfire') {
    // Brown noise base + crackling bursts
    let last = 0
    for (let i = 0; i < len; i++) {
      out[i] = (last + 0.02 * out[i]) / 1.02
      last = out[i]
      out[i] *= 2.5
    }
    // Add crackling pops
    for (let i = 0; i < len; i++) {
      const t = i / sr
      const pop = Math.sin(2*Math.PI*t*800) * Math.max(0, Math.sin(2*Math.PI*t*3))**12
      out[i] = out[i] * 0.8 + pop * 0.15
    }
  }

  return buf
}

export class ToneGenerator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private node: any = null
  private ctx: AudioContext | null = null
  private volumeLinear = 0.3

  async play(
    soundType: TherapySound,
    options?: { volume?: number; frequency?: number }
  ): Promise<void> {
    this.stop()

    if (options?.volume !== undefined) {
      this.volumeLinear = options.volume
    }

    // Nature sounds: use Web Audio API synthesis
    if (NATURE_SOUNDS.includes(soundType)) {
      const ctx = new AudioContext()
      this.ctx = ctx
      const gainNode = ctx.createGain()
      gainNode.gain.setValueAtTime(this.volumeLinear, ctx.currentTime)
      gainNode.connect(ctx.destination)

      const buffer = createNatureBuffer(ctx, soundType)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.loop = true
      source.connect(gainNode)
      source.start()

      this.node = { source, gainNode, type: 'nature' }
      return
    }

    // Noise sounds: use Tone.js
    if (NOISE_SOUNDS.includes(soundType)) {
      const Tone = await import('tone')
      const noiseMap: Record<string, NoiseType> = {
        white_noise: 'white', pink_noise: 'pink', brown_noise: 'brown',
      }
      const noiseType = noiseMap[soundType] ?? 'white'
      const noise = new Tone.Noise(noiseType)
      const vol = new Tone.Volume(this.linearToDb(this.volumeLinear)).toDestination()
      noise.connect(vol)
      await Tone.start()
      noise.start()
      this.node = { noise, vol, type: 'tone' }
      return
    }

    // Binaural beats: use Tone.js
    const beatFreq = BINAURAL_BEATS[soundType]
    if (beatFreq !== undefined) {
      const Tone = await import('tone')
      const baseFreq = options?.frequency ?? 200
      const left = new Tone.Oscillator(baseFreq, 'sine')
      const right = new Tone.Oscillator(baseFreq + beatFreq, 'sine')
      const vol = new Tone.Volume(this.linearToDb(this.volumeLinear)).toDestination()
      left.connect(vol)
      right.connect(vol)
      await Tone.start()
      left.start()
      right.start()
      this.node = { left, right, vol, type: 'tone' }
    }
  }

  stop(): void {
    if (!this.node) return
    try {
      if (this.node.type === 'nature') {
        this.node.source?.stop()
        this.node.gainNode?.disconnect()
      } else {
        if (this.node.noise) this.node.noise.stop()
        if (this.node.left) this.node.left.stop()
        if (this.node.right) this.node.right.stop()
        if (this.node.vol) this.node.vol.dispose()
      }
    } catch {
      // ignore disposal errors
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {})
      this.ctx = null
    }
    this.node = null
  }

  // Sets volume from linear 0–1 scale
  setVolume(volume: number): void {
    this.volumeLinear = Math.max(0, Math.min(1, volume))
    if (!this.node) return
    if (this.node.type === 'nature' && this.node.gainNode) {
      this.node.gainNode.gain.setValueAtTime(this.volumeLinear, this.ctx?.currentTime ?? 0)
    } else if (this.node.vol) {
      this.node.vol.volume.value = this.linearToDb(this.volumeLinear)
    }
  }

  private linearToDb(linear: number): number {
    if (linear <= 0) return -Infinity
    return 20 * Math.log10(linear)
  }
}
