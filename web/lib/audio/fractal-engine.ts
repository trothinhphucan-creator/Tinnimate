'use client'
/**
 * Fractal Tone Engine — Zen-style generative music for tinnitus therapy
 * 
 * Based on Widex Zen research: L-System fractal algorithm generates
 * never-repeating, wind-chime-like melodies using pentatonic scales.
 * 
 * Architecture:
 *   L-System → Scale Mapper → Note Scheduler → Oscillator + Envelope → Reverb → Output
 */

// ── Musical Scales ──
const PENTATONIC_MAJOR = [0, 2, 4, 7, 9]     // C D E G A
const PENTATONIC_MINOR = [0, 3, 5, 7, 10]     // C Eb F G Bb

// Convert MIDI note to frequency
function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

// ── L-System Fractal Generator ──
interface LSystemRule {
  [key: string]: string
}

function generateLSystem(axiom: string, rules: LSystemRule, iterations: number): string {
  let current = axiom
  for (let i = 0; i < iterations; i++) {
    current = current.split('').map(ch => rules[ch] ?? ch).join('')
  }
  return current
}

// Map L-System characters to scale degree indices
function mapToScaleDegrees(sequence: string): number[] {
  const mapping: Record<string, number> = {
    'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4,
    'F': 0, 'G': 1, 'H': 2, 'I': 3, 'J': 4,  // wrap around
  }
  return sequence.split('')
    .filter(ch => ch in mapping)
    .map(ch => mapping[ch])
}

// ── Zen Style Definitions ──
export interface ZenStyle {
  name: string
  nameVi: string
  emoji: string
  description: string
  descriptionVi: string
  color: string        // gradient from color
  colorTo: string      // gradient to color
  // Musical parameters
  baseOctave: number   // 3-6
  tempoMs: number      // ms between notes (lower = faster)
  scale: number[]      // pentatonic intervals
  decay: number        // note decay in seconds
  reverbMix: number    // 0-1 reverb wetness
  dynamicRange: number // 0-1 (0 = narrow, 1 = wide)
  density: number      // 0-1 (probability of playing a note)
  waveform: OscillatorType
  // L-System config
  axiom: string
  rules: LSystemRule
  iterations: number
}

export const ZEN_STYLES: ZenStyle[] = [
  {
    name: 'Ocean Breeze',
    nameVi: 'Gió Biển',
    emoji: '🌊',
    description: 'Low, slow chimes — deep calm like ocean waves',
    descriptionVi: 'Chuông trầm, chậm rãi — bình yên sâu như sóng biển',
    color: '#0ea5e9',
    colorTo: '#06b6d4',
    baseOctave: 4,
    tempoMs: 1200,
    scale: PENTATONIC_MAJOR,
    decay: 2.5,
    reverbMix: 0.7,
    dynamicRange: 0.3,
    density: 0.7,
    waveform: 'sine',
    axiom: 'ABCDE',
    rules: { A: 'AC', B: 'DA', C: 'BE', D: 'CB', E: 'AD' },
    iterations: 4,
  },
  {
    name: 'Starlight',
    nameVi: 'Ánh Sao',
    emoji: '✨',
    description: 'Bright, sparkling tones — clear night sky',
    descriptionVi: 'Âm thanh lấp lánh — bầu trời đêm trong vắt',
    color: '#a78bfa',
    colorTo: '#7c3aed',
    baseOctave: 5,
    tempoMs: 800,
    scale: PENTATONIC_MAJOR,
    decay: 1.8,
    reverbMix: 0.6,
    dynamicRange: 0.6,
    density: 0.8,
    waveform: 'sine',
    axiom: 'CADBE',
    rules: { A: 'BD', B: 'EC', C: 'AB', D: 'CE', E: 'DA' },
    iterations: 4,
  },
  {
    name: 'Lotus',
    nameVi: 'Hoa Sen',
    emoji: '🪷',
    description: 'Gentle minor tones — meditative and introspective',
    descriptionVi: 'Giai điệu thứ nhẹ nhàng — thiền định và nội tâm',
    color: '#ec4899',
    colorTo: '#db2777',
    baseOctave: 4,
    tempoMs: 1400,
    scale: PENTATONIC_MINOR,
    decay: 2.8,
    reverbMix: 0.8,
    dynamicRange: 0.25,
    density: 0.6,
    waveform: 'sine',
    axiom: 'DCBAE',
    rules: { A: 'CE', B: 'AD', C: 'BA', D: 'EC', E: 'DB' },
    iterations: 4,
  },
  {
    name: 'Sunrise',
    nameVi: 'Bình Minh',
    emoji: '🌅',
    description: 'Warm, uplifting tones — new day energy',
    descriptionVi: 'Âm ấm áp, nâng cao — năng lượng ngày mới',
    color: '#f59e0b',
    colorTo: '#ef4444',
    baseOctave: 5,
    tempoMs: 700,
    scale: PENTATONIC_MAJOR,
    decay: 1.5,
    reverbMix: 0.5,
    dynamicRange: 0.7,
    density: 0.85,
    waveform: 'triangle',
    axiom: 'EABCD',
    rules: { A: 'DB', B: 'AE', C: 'BC', D: 'EA', E: 'CD' },
    iterations: 4,
  },
  {
    name: 'Moonlight',
    nameVi: 'Ánh Trăng',
    emoji: '🌙',
    description: 'Very slow, deep — perfect for sleep',
    descriptionVi: 'Rất chậm, sâu lắng — hoàn hảo cho giấc ngủ',
    color: '#6366f1',
    colorTo: '#312e81',
    baseOctave: 3,
    tempoMs: 2000,
    scale: PENTATONIC_MINOR,
    decay: 3.5,
    reverbMix: 0.9,
    dynamicRange: 0.2,
    density: 0.5,
    waveform: 'sine',
    axiom: 'AEBDC',
    rules: { A: 'BA', B: 'CB', C: 'DC', D: 'ED', E: 'AE' },
    iterations: 4,
  },
  {
    name: 'Bamboo Grove',
    nameVi: 'Rừng Tre',
    emoji: '🎋',
    description: 'Hollow, woody tones — zen garden atmosphere',
    descriptionVi: 'Âm gỗ trầm — không khí vườn thiền',
    color: '#22c55e',
    colorTo: '#15803d',
    baseOctave: 4,
    tempoMs: 1100,
    scale: PENTATONIC_MAJOR,
    decay: 2.0,
    reverbMix: 0.5,
    dynamicRange: 0.4,
    density: 0.65,
    waveform: 'triangle',
    axiom: 'BCADE',
    rules: { A: 'EA', B: 'CD', C: 'AB', D: 'BE', E: 'DC' },
    iterations: 4,
  },
  {
    name: 'Crystal Cave',
    nameVi: 'Hang Pha Lê',
    emoji: '💎',
    description: 'Crystalline high tones with long reverb — ethereal',
    descriptionVi: 'Âm pha lê cao với reverb dài — huyền ảo',
    color: '#67e8f9',
    colorTo: '#22d3ee',
    baseOctave: 6,
    tempoMs: 1500,
    scale: PENTATONIC_MAJOR,
    decay: 3.0,
    reverbMix: 0.95,
    dynamicRange: 0.15,
    density: 0.5,
    waveform: 'sine',
    axiom: 'EDCBA',
    rules: { A: 'AB', B: 'BC', C: 'CD', D: 'DE', E: 'EA' },
    iterations: 4,
  },
  {
    name: 'Sacred Temple',
    nameVi: 'Đền Thiêng',
    emoji: '🛕',
    description: 'Deep bell-like tones — sacred and grounding',
    descriptionVi: 'Âm chuông sâu — linh thiêng và vững chãi',
    color: '#d97706',
    colorTo: '#92400e',
    baseOctave: 3,
    tempoMs: 1800,
    scale: PENTATONIC_MINOR,
    decay: 4.0,
    reverbMix: 0.85,
    dynamicRange: 0.3,
    density: 0.45,
    waveform: 'sine',
    axiom: 'ACEBD',
    rules: { A: 'DA', B: 'EB', C: 'AC', D: 'BD', E: 'CE' },
    iterations: 4,
  },
  {
    name: 'Cherry Blossom',
    nameVi: 'Hoa Anh Đào',
    emoji: '🌸',
    description: 'Delicate, floating tones — spring breeze',
    descriptionVi: 'Âm thanh mỏng manh, bay bổng — gió xuân',
    color: '#f472b6',
    colorTo: '#e879f9',
    baseOctave: 5,
    tempoMs: 900,
    scale: PENTATONIC_MAJOR,
    decay: 2.0,
    reverbMix: 0.65,
    dynamicRange: 0.5,
    density: 0.75,
    waveform: 'sine',
    axiom: 'DEBAC',
    rules: { A: 'CB', B: 'DE', C: 'EA', D: 'AC', E: 'BD' },
    iterations: 4,
  },
  {
    name: 'Northern Lights',
    nameVi: 'Cực Quang',
    emoji: '🌌',
    description: 'Shifting, otherworldly tones — aurora borealis',
    descriptionVi: 'Âm chuyển động, siêu thực — ánh cực quang',
    color: '#34d399',
    colorTo: '#818cf8',
    baseOctave: 4,
    tempoMs: 1300,
    scale: PENTATONIC_MINOR,
    decay: 3.0,
    reverbMix: 0.8,
    dynamicRange: 0.55,
    density: 0.6,
    waveform: 'sine',
    axiom: 'ACDBE',
    rules: { A: 'EB', B: 'CA', C: 'DA', D: 'AE', E: 'BC' },
    iterations: 4,
  },
]

// ── Impulse Response for Reverb ──
function createReverbImpulse(ctx: AudioContext, duration = 2, decay = 2): AudioBuffer {
  const length = ctx.sampleRate * duration
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch)
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay)
    }
  }
  return impulse
}

// ── Main Engine ──
export class FractalToneEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private reverbNode: ConvolverNode | null = null
  private dryGain: GainNode | null = null
  private wetGain: GainNode | null = null
  private isPlaying = false
  private schedulerTimer: ReturnType<typeof setInterval> | null = null
  private noteSequence: number[] = []
  private noteIndex = 0
  private currentStyle: ZenStyle | null = null
  private volume = 0.5

  get playing(): boolean { return this.isPlaying }

  async start(style: ZenStyle, vol = 0.5): Promise<void> {
    this.stop()
    this.volume = vol
    this.currentStyle = style

    // Create audio context
    const ctx = new AudioContext()
    this.ctx = ctx

    // Master gain
    const masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(vol, ctx.currentTime)
    masterGain.connect(ctx.destination)
    this.masterGain = masterGain

    // Reverb
    const reverb = ctx.createConvolver()
    reverb.buffer = createReverbImpulse(ctx, 3, 2.5)
    this.reverbNode = reverb

    // Dry/wet mix
    const dryGain = ctx.createGain()
    dryGain.gain.setValueAtTime(1 - style.reverbMix, ctx.currentTime)
    dryGain.connect(masterGain)
    this.dryGain = dryGain

    const wetGain = ctx.createGain()
    wetGain.gain.setValueAtTime(style.reverbMix, ctx.currentTime)
    reverb.connect(wetGain)
    wetGain.connect(masterGain)
    this.wetGain = wetGain

    // Generate fractal note sequence
    const lSystemOutput = generateLSystem(style.axiom, style.rules, style.iterations)
    const scaleDegrees = mapToScaleDegrees(lSystemOutput)
    
    // Map scale degrees to MIDI notes
    this.noteSequence = scaleDegrees.map(degree => {
      const semitone = style.scale[degree % style.scale.length]
      const octaveShift = Math.floor(degree / style.scale.length)
      return (style.baseOctave + octaveShift) * 12 + semitone
    })
    this.noteIndex = 0
    this.isPlaying = true

    // Start scheduler
    this.schedulerTimer = setInterval(() => {
      if (!this.isPlaying || !this.ctx || !this.currentStyle) return
      this.playNextNote()
    }, style.tempoMs)

    // Play first note immediately
    this.playNextNote()
  }

  private playNextNote(): void {
    if (!this.ctx || !this.currentStyle || !this.dryGain || !this.reverbNode) return

    const style = this.currentStyle
    
    // Density check — skip some notes randomly for natural feel
    if (Math.random() > style.density) {
      this.advanceIndex()
      return
    }

    const midi = this.noteSequence[this.noteIndex]
    const freq = midiToFreq(midi)

    // Random velocity for natural feel
    const baseVelocity = 0.3
    const velocityRange = style.dynamicRange * 0.4
    const velocity = baseVelocity + (Math.random() * velocityRange)

    // Create oscillator
    const osc = this.ctx.createOscillator()
    osc.type = style.waveform
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime)

    // Optional: add subtle harmonic for richness
    const osc2 = this.ctx.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(freq * 2, this.ctx.currentTime) // octave harmonic

    // Envelope (attack-decay, no sustain)
    const env = this.ctx.createGain()
    const now = this.ctx.currentTime
    const attack = 0.02
    const decayTime = style.decay + (Math.random() * 0.5 - 0.25) // slight randomization

    env.gain.setValueAtTime(0, now)
    env.gain.linearRampToValueAtTime(velocity, now + attack)
    env.gain.exponentialRampToValueAtTime(0.001, now + attack + decayTime)

    // Connect: osc → env → dry + reverb
    osc.connect(env)
    osc2.connect(env)
    osc2.connect(env) // harmonic is quieter by default (same env)
    env.connect(this.dryGain)
    env.connect(this.reverbNode)

    // Reduce harmonic volume
    const harmGain = this.ctx.createGain()
    harmGain.gain.setValueAtTime(0.15, now)
    osc2.disconnect()
    osc2.connect(harmGain)
    harmGain.connect(env)

    // Play
    osc.start(now)
    osc.stop(now + attack + decayTime + 0.1)
    osc2.start(now)
    osc2.stop(now + attack + decayTime + 0.1)

    this.advanceIndex()
  }

  private advanceIndex(): void {
    this.noteIndex = (this.noteIndex + 1) % this.noteSequence.length
    // When wrapping around, add slight variation by shifting
    if (this.noteIndex === 0 && this.noteSequence.length > 5) {
      // Rotate sequence by a random amount for variety
      const shift = Math.floor(Math.random() * 3) + 1
      this.noteSequence = [
        ...this.noteSequence.slice(shift),
        ...this.noteSequence.slice(0, shift),
      ]
    }
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol))
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime)
    }
  }

  stop(): void {
    this.isPlaying = false
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer)
      this.schedulerTimer = null
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {})
      this.ctx = null
    }
    this.masterGain = null
    this.reverbNode = null
    this.dryGain = null
    this.wetGain = null
    this.currentStyle = null
  }
}
