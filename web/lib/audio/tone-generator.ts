'use client'
// Client-side only — Tone.js sound generation for tinnitus therapy
import type { TherapySound } from '@/types'

const BINAURAL_BEATS: Partial<Record<TherapySound, number>> = {
  binaural_alpha: 10,
  binaural_theta: 6,
  binaural_delta: 2,
}

const NOISE_SOUNDS: TherapySound[] = ['white_noise', 'pink_noise', 'brown_noise']
const NATURE_SOUNDS: TherapySound[] = ['rain', 'ocean', 'forest', 'campfire', 'notch_therapy']

type NoiseType = 'white' | 'pink' | 'brown'

export class ToneGenerator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private node: any = null
  private volumeDb = 0 // decibels

  async play(
    soundType: TherapySound,
    options?: { volume?: number; frequency?: number }
  ): Promise<void> {
    this.stop()

    if (options?.volume !== undefined) {
      this.volumeDb = this.linearToDb(options.volume)
    }

    if (NATURE_SOUNDS.includes(soundType)) {
      console.warn('[ToneGenerator] Nature sounds use audio files, not Tone.js')
      return
    }

    // Dynamic import to avoid SSR issues
    const Tone = await import('tone')

    if (NOISE_SOUNDS.includes(soundType)) {
      const noiseMap: Record<string, NoiseType> = {
        white_noise: 'white',
        pink_noise: 'pink',
        brown_noise: 'brown',
      }
      const noiseType = noiseMap[soundType] ?? 'white'
      const noise = new Tone.Noise(noiseType)
      const vol = new Tone.Volume(this.volumeDb).toDestination()
      noise.connect(vol)
      await Tone.start()
      noise.start()
      this.node = { noise, vol }
      return
    }

    const beatFreq = BINAURAL_BEATS[soundType]
    if (beatFreq !== undefined) {
      const baseFreq = options?.frequency ?? 200
      const left = new Tone.Oscillator(baseFreq, 'sine')
      const right = new Tone.Oscillator(baseFreq + beatFreq, 'sine')
      const vol = new Tone.Volume(this.volumeDb).toDestination()
      left.connect(vol)
      right.connect(vol)
      await Tone.start()
      left.start()
      right.start()
      this.node = { left, right, vol }
    }
  }

  stop(): void {
    if (!this.node) return
    try {
      if (this.node.noise) this.node.noise.stop()
      if (this.node.left) this.node.left.stop()
      if (this.node.right) this.node.right.stop()
      if (this.node.vol) this.node.vol.dispose()
    } catch {
      // ignore disposal errors
    }
    this.node = null
  }

  // Sets volume from linear 0–1 scale
  setVolume(volume: number): void {
    this.volumeDb = this.linearToDb(Math.max(0, Math.min(1, volume)))
    if (this.node?.vol) {
      this.node.vol.volume.value = this.volumeDb
    }
  }

  private linearToDb(linear: number): number {
    if (linear <= 0) return -Infinity
    return 20 * Math.log10(linear)
  }
}
