'use client'
// Client-side only — Sound generation for tinnitus therapy
// Supports: noise (white/pink/brown), binaural beats, nature/healing sounds (file-based)
import type { TherapySound } from '@/types'

const BINAURAL_BEATS: Partial<Record<TherapySound, number>> = {
  binaural_alpha: 10,
  binaural_theta: 6,
  binaural_delta: 2,
}

const NOISE_SOUNDS: TherapySound[] = ['white_noise', 'pink_noise', 'brown_noise']

// File-based sounds served from /sounds/audio/
const FILE_SOUNDS: Record<string, string> = {
  rain: '/sounds/audio/rain.mp3',
  ocean: '/sounds/audio/ocean.mp3',
  forest: '/sounds/audio/forest.mp3',
  campfire: '/sounds/audio/campfire.mp3',
  birds: '/sounds/audio/birds.mp3',
  creek: '/sounds/audio/creek.mp3',
  thunder: '/sounds/audio/thunder.mp3',
  wind: '/sounds/audio/wind.mp3',
  singing_bowl: '/sounds/audio/singing_bowl.mp3',
  wind_chimes: '/sounds/audio/wind_chimes.mp3',
  crickets: '/sounds/audio/crickets.mp3',
  heartbeat: '/sounds/audio/heartbeat.mp3',
  om_drone: '/sounds/audio/om_drone.mp3',
}

type NoiseType = 'white' | 'pink' | 'brown'

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

    // File-based sounds: load MP3 and loop
    const filePath = FILE_SOUNDS[soundType]
    if (filePath) {
      const ctx = new AudioContext()
      this.ctx = ctx

      const response = await fetch(filePath)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer)

      const gainNode = ctx.createGain()
      gainNode.gain.setValueAtTime(this.volumeLinear, ctx.currentTime)
      gainNode.connect(ctx.destination)

      const source = ctx.createBufferSource()
      source.buffer = audioBuffer
      source.loop = true
      // Crossfade loop for seamless transitions
      source.loopStart = 0.5
      source.loopEnd = audioBuffer.duration - 0.5
      source.connect(gainNode)
      source.start()

      this.node = { source, gainNode, type: 'file' }
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
      if (this.node.type === 'file') {
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
    if (this.node.type === 'file' && this.node.gainNode) {
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
