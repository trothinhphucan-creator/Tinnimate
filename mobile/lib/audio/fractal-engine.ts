/**
 * Zentones - Fractal Tone Engine (Expo Go compatible)
 * Uses expo-av Sound to play zen audio files in fractal patterns.
 * No native modules required — works in Expo Go.
 */

import { Audio } from 'expo-av';

// ── Musical Scales for rate mapping ──
const PENTATONIC_MAJOR = [0, 2, 4, 7, 9];
const PENTATONIC_MINOR = [0, 3, 5, 7, 10];

// Map semitone offset to playback rate (1.0 = original pitch, 2^(1/12) per semitone)
function semitoneToRate(semitones: number): number {
  return Math.pow(2, semitones / 12);
}

// ── L-System Fractal Generator ──
interface LSystemRule {
  [key: string]: string;
}

function generateLSystem(axiom: string, rules: LSystemRule, iterations: number): string {
  let current = axiom;
  for (let i = 0; i < iterations; i++) {
    current = current.split('').map(ch => rules[ch] ?? ch).join('');
  }
  return current;
}

function mapToScaleDegrees(sequence: string): number[] {
  const mapping: Record<string, number> = {
    'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4,
    'F': 0, 'G': 1, 'H': 2, 'I': 3, 'J': 4,
  };
  return sequence.split('')
    .filter(ch => ch in mapping)
    .map(ch => mapping[ch]);
}

// ── Zen Style Definitions ──
export interface ZenStyle {
  name: string;
  nameVi: string;
  emoji: string;
  description: string;
  descriptionVi: string;
  color: string;
  colorTo: string;
  baseOctave: number;
  tempoMs: number;
  scale: number[];
  decay: number;
  reverbMix: number;
  dynamicRange: number;
  density: number;
  waveform: 'sine' | 'triangle' | 'square' | 'sawtooth';
  axiom: string;
  rules: LSystemRule;
  iterations: number;
  // Which audio file to use as base sound
  audioKey: 'zen' | '528hz' | 'ocean' | 'white';
}

export const ZEN_STYLES: ZenStyle[] = [
  {
    name: 'Ocean Breeze', nameVi: 'Gió Biển', emoji: '🌊',
    description: 'Low, slow chimes — deep calm like ocean waves',
    descriptionVi: 'Chuông trầm, chậm rãi — bình yên sâu như sóng biển',
    color: '#0ea5e9', colorTo: '#06b6d4',
    baseOctave: 4, tempoMs: 1200, scale: PENTATONIC_MAJOR,
    decay: 2.5, reverbMix: 0.7, dynamicRange: 0.3, density: 0.7,
    waveform: 'sine', axiom: 'ABCDE',
    rules: { A: 'AC', B: 'DA', C: 'BE', D: 'CB', E: 'AD' }, iterations: 4,
    audioKey: 'zen',
  },
  {
    name: 'Starlight', nameVi: 'Ánh Sao', emoji: '✨',
    description: 'Bright, sparkling tones — clear night sky',
    descriptionVi: 'Âm thanh lấp lánh — bầu trời đêm trong vắt',
    color: '#a78bfa', colorTo: '#7c3aed',
    baseOctave: 5, tempoMs: 800, scale: PENTATONIC_MAJOR,
    decay: 1.8, reverbMix: 0.6, dynamicRange: 0.6, density: 0.8,
    waveform: 'sine', axiom: 'CADBE',
    rules: { A: 'BD', B: 'EC', C: 'AB', D: 'CE', E: 'DA' }, iterations: 4,
    audioKey: '528hz',
  },
  {
    name: 'Lotus', nameVi: 'Hoa Sen', emoji: '🪷',
    description: 'Gentle minor tones — meditative and introspective',
    descriptionVi: 'Giai điệu thứ nhẹ nhàng — thiền định và nội tâm',
    color: '#ec4899', colorTo: '#db2777',
    baseOctave: 4, tempoMs: 1400, scale: PENTATONIC_MINOR,
    decay: 2.8, reverbMix: 0.8, dynamicRange: 0.25, density: 0.6,
    waveform: 'sine', axiom: 'DCBAE',
    rules: { A: 'CE', B: 'AD', C: 'BA', D: 'EC', E: 'DB' }, iterations: 4,
    audioKey: 'zen',
  },
  {
    name: 'Sunrise', nameVi: 'Bình Minh', emoji: '🌅',
    description: 'Warm, uplifting tones — new day energy',
    descriptionVi: 'Âm ấm áp, nâng cao — năng lượng ngày mới',
    color: '#f59e0b', colorTo: '#ef4444',
    baseOctave: 5, tempoMs: 700, scale: PENTATONIC_MAJOR,
    decay: 1.5, reverbMix: 0.5, dynamicRange: 0.7, density: 0.85,
    waveform: 'triangle', axiom: 'EABCD',
    rules: { A: 'DB', B: 'AE', C: 'BC', D: 'EA', E: 'CD' }, iterations: 4,
    audioKey: '528hz',
  },
  {
    name: 'Moonlight', nameVi: 'Ánh Trăng', emoji: '🌙',
    description: 'Very slow, deep — perfect for sleep',
    descriptionVi: 'Rất chậm, sâu lắng — hoàn hảo cho giấc ngủ',
    color: '#6366f1', colorTo: '#312e81',
    baseOctave: 3, tempoMs: 2000, scale: PENTATONIC_MINOR,
    decay: 3.5, reverbMix: 0.9, dynamicRange: 0.2, density: 0.5,
    waveform: 'sine', axiom: 'AEBDC',
    rules: { A: 'BA', B: 'CB', C: 'DC', D: 'ED', E: 'AE' }, iterations: 4,
    audioKey: 'zen',
  },
  {
    name: 'Bamboo Grove', nameVi: 'Rừng Tre', emoji: '🎋',
    description: 'Hollow, woody tones — zen garden atmosphere',
    descriptionVi: 'Âm gỗ trầm — không khí vườn thiền',
    color: '#22c55e', colorTo: '#15803d',
    baseOctave: 4, tempoMs: 1100, scale: PENTATONIC_MAJOR,
    decay: 2.0, reverbMix: 0.5, dynamicRange: 0.4, density: 0.65,
    waveform: 'triangle', axiom: 'BCADE',
    rules: { A: 'EA', B: 'CD', C: 'AB', D: 'BE', E: 'DC' }, iterations: 4,
    audioKey: 'zen',
  },
  {
    name: 'Crystal Cave', nameVi: 'Hang Pha Lê', emoji: '💎',
    description: 'Crystalline high tones with long reverb — ethereal',
    descriptionVi: 'Âm pha lê cao với reverb dài — huyền ảo',
    color: '#67e8f9', colorTo: '#22d3ee',
    baseOctave: 6, tempoMs: 1500, scale: PENTATONIC_MAJOR,
    decay: 3.0, reverbMix: 0.95, dynamicRange: 0.15, density: 0.5,
    waveform: 'sine', axiom: 'EDCBA',
    rules: { A: 'AB', B: 'BC', C: 'CD', D: 'DE', E: 'EA' }, iterations: 4,
    audioKey: '528hz',
  },
  {
    name: 'Sacred Temple', nameVi: 'Đền Thiêng', emoji: '🛕',
    description: 'Deep bell-like tones — sacred and grounding',
    descriptionVi: 'Âm chuông sâu — linh thiêng và vững chãi',
    color: '#d97706', colorTo: '#92400e',
    baseOctave: 3, tempoMs: 1800, scale: PENTATONIC_MINOR,
    decay: 4.0, reverbMix: 0.85, dynamicRange: 0.3, density: 0.45,
    waveform: 'sine', axiom: 'ACEBD',
    rules: { A: 'DA', B: 'EB', C: 'AC', D: 'BD', E: 'CE' }, iterations: 4,
    audioKey: 'zen',
  },
  {
    name: 'Cherry Blossom', nameVi: 'Hoa Anh Đào', emoji: '🌸',
    description: 'Delicate, floating tones — spring breeze',
    descriptionVi: 'Âm thanh mỏng manh, bay bổng — gió xuân',
    color: '#f472b6', colorTo: '#e879f9',
    baseOctave: 5, tempoMs: 900, scale: PENTATONIC_MAJOR,
    decay: 2.0, reverbMix: 0.65, dynamicRange: 0.5, density: 0.75,
    waveform: 'sine', axiom: 'DEBAC',
    rules: { A: 'CB', B: 'DE', C: 'EA', D: 'AC', E: 'BD' }, iterations: 4,
    audioKey: '528hz',
  },
  {
    name: 'Northern Lights', nameVi: 'Cực Quang', emoji: '🌌',
    description: 'Shifting, otherworldly tones — aurora borealis',
    descriptionVi: 'Âm chuyển động, siêu thực — ánh cực quang',
    color: '#34d399', colorTo: '#818cf8',
    baseOctave: 4, tempoMs: 1300, scale: PENTATONIC_MINOR,
    decay: 3.0, reverbMix: 0.8, dynamicRange: 0.55, density: 0.6,
    waveform: 'sine', axiom: 'ACDBE',
    rules: { A: 'EB', B: 'CA', C: 'DA', D: 'AE', E: 'BC' }, iterations: 4,
    audioKey: 'zen',
  },
];

// Audio file map — files already in assets/audio/
const AUDIO_FILES: Record<string, any> = {
  'zen':   require('@/assets/audio/zen.mp3'),
  '528hz': require('@/assets/audio/528hz.mp3'),
  'ocean': require('@/assets/audio/ocean.mp3'),
  'white': require('@/assets/audio/white.mp3'),
};

// ── Fractal Tone Engine (expo-av) ──
export class FractalToneEngine {
  private isPlaying = false;
  private schedulerTimer: ReturnType<typeof setInterval> | null = null;
  private noteSequence: number[] = [];
  private noteIndex = 0;
  private currentStyle: ZenStyle | null = null;
  private volume = 0.5;
  private activeSounds: Audio.Sound[] = [];

  get playing(): boolean {
    return this.isPlaying;
  }

  async start(style: ZenStyle, vol = 0.5): Promise<void> {
    await this.stop();
    this.volume = vol;
    this.currentStyle = style;

    // Set audio mode for background play
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
        
        
        
      });
    } catch (e) {
      console.warn('[Zentones] setAudioModeAsync:', e);
    }

    // Generate fractal sequence (L-System)
    const lSystemOutput = generateLSystem(style.axiom, style.rules, style.iterations);
    const scaleDegrees = mapToScaleDegrees(lSystemOutput);

    // Map to semitone offsets from base
    const baseOctaveSemitone = (style.baseOctave - 4) * 12; // relative to octave 4
    this.noteSequence = scaleDegrees.map(degree => {
      const semitone = style.scale[degree % style.scale.length];
      const octaveShift = Math.floor(degree / style.scale.length) * 12;
      return baseOctaveSemitone + octaveShift + semitone;
    });

    this.noteIndex = 0;
    this.isPlaying = true;

    // Play first note, then schedule interval
    await this.playNextNote();
    this.schedulerTimer = setInterval(() => {
      if (!this.isPlaying) return;
      this.playNextNote();
    }, style.tempoMs);
  }

  private async playNextNote(): Promise<void> {
    if (!this.currentStyle) return;
    const style = this.currentStyle;

    // Skip based on density
    if (Math.random() > style.density) {
      this.advanceIndex();
      return;
    }

    // Calculate playback rate for pitch variation
    const semitones = this.noteSequence[this.noteIndex];
    // Clamp rate to a reasonable range (0.5x – 2.0x)
    const rawRate = semitoneToRate(semitones);
    const rate = Math.max(0.5, Math.min(2.0, rawRate));

    // Volume with dynamic range variation
    const baseVol = this.volume * 0.6;
    const vol = Math.min(1.0, baseVol + Math.random() * style.dynamicRange * 0.3);

    try {
      const audioFile = AUDIO_FILES[style.audioKey];
      const { sound } = await Audio.Sound.createAsync(audioFile, {
        volume: vol,
        rate,
        shouldCorrectPitch: true, // keep pitch-correct when changing rate
        isLooping: false,
      });

      this.activeSounds.push(sound);
      await sound.playAsync();

      // Auto-cleanup after decay time
      const decayMs = style.decay * 1000;
      setTimeout(async () => {
        try {
          await sound.unloadAsync();
        } catch (_) {}
        this.activeSounds = this.activeSounds.filter(s => s !== sound);
      }, decayMs + 500);
    } catch (e) {
      console.warn('[Zentones] playNextNote error:', e);
    }

    this.advanceIndex();
  }

  private advanceIndex(): void {
    this.noteIndex = (this.noteIndex + 1) % this.noteSequence.length;
    if (this.noteIndex === 0 && this.noteSequence.length > 5) {
      const shift = Math.floor(Math.random() * 3) + 1;
      this.noteSequence = [
        ...this.noteSequence.slice(shift),
        ...this.noteSequence.slice(0, shift),
      ];
    }
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    // Update all active sounds
    this.activeSounds.forEach(s => {
      s.setVolumeAsync(this.volume).catch(() => {});
    });
  }

  async stop(): Promise<void> {
    this.isPlaying = false;
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    // Stop and unload all active sounds
    await Promise.all(
      this.activeSounds.map(async (s) => {
        try {
          await s.stopAsync();
          await s.unloadAsync();
        } catch (_) {}
      })
    );
    this.activeSounds = [];
    this.currentStyle = null;
  }
}
