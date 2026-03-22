import { create } from 'zustand'

interface AudioState {
  isPlaying: boolean
  currentTrackId: string | null
  setIsPlaying: (playing: boolean) => void
  setCurrentTrack: (trackId: string | null) => void
}

export const useAudioStore = create<AudioState>((set) => ({
  isPlaying: false,
  currentTrackId: null,
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTrack: (trackId) => set({ currentTrackId: trackId }),
}))
