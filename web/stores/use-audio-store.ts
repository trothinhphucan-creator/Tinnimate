'use client'
import { create } from 'zustand'
import { TherapySound } from '@/types'

interface AudioStore {
  isPlaying: boolean
  activeSound: TherapySound | null
  volume: number
  timerMinutes: number | null
  setPlaying: (playing: boolean) => void
  setActiveSound: (sound: TherapySound | null) => void
  setVolume: (vol: number) => void
  setTimer: (mins: number | null) => void
}

export const useAudioStore = create<AudioStore>((set) => ({
  isPlaying: false,
  activeSound: null,
  volume: 0.7,
  timerMinutes: null,

  setPlaying: (playing) => set({ isPlaying: playing }),
  setActiveSound: (sound) => set({ activeSound: sound }),
  setVolume: (vol) => set({ volume: Math.max(0, Math.min(1, vol)) }),
  setTimer: (mins) => set({ timerMinutes: mins }),
}))
