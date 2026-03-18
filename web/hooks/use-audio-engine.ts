'use client'
// Hook wrapping ToneGenerator with lifecycle management
import { useEffect, useRef, useCallback } from 'react'
import { ToneGenerator } from '@/lib/audio/tone-generator'
import { useAudioStore } from '@/stores/use-audio-store'
import type { TherapySound } from '@/types'

export function useAudioEngine() {
  const generatorRef = useRef<ToneGenerator | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const {
    isPlaying, activeSound, volume, timerMinutes,
    setPlaying, setActiveSound, setVolume, setTimer,
  } = useAudioStore()

  // Lazy-init generator
  const getGenerator = useCallback(() => {
    if (!generatorRef.current) {
      generatorRef.current = new ToneGenerator()
    }
    return generatorRef.current
  }, [])

  // Play a sound
  const play = useCallback(async (sound: TherapySound, durationMin?: number) => {
    const gen = getGenerator()
    await gen.play(sound, { volume })
    setActiveSound(sound)
    setPlaying(true)

    // Clear previous timer
    if (timerRef.current) clearTimeout(timerRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)

    if (durationMin) {
      setTimer(durationMin)
      timerRef.current = setTimeout(() => {
        gen.stop()
        setPlaying(false)
        setActiveSound(null)
        setTimer(null)
      }, durationMin * 60 * 1000)
    }
  }, [getGenerator, volume, setActiveSound, setPlaying, setTimer])

  // Stop playing
  const stop = useCallback(() => {
    getGenerator().stop()
    setPlaying(false)
    setActiveSound(null)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
    setTimer(null)
  }, [getGenerator, setPlaying, setActiveSound, setTimer])

  // Toggle play/stop
  const toggle = useCallback(async (sound: TherapySound, durationMin?: number) => {
    if (isPlaying && activeSound === sound) {
      stop()
    } else {
      await play(sound, durationMin)
    }
  }, [isPlaying, activeSound, play, stop])

  // Update volume in real-time
  const updateVolume = useCallback((vol: number) => {
    setVolume(vol)
    getGenerator().setVolume(vol)
  }, [getGenerator, setVolume])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      generatorRef.current?.stop()
      if (timerRef.current) clearTimeout(timerRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [])

  return {
    isPlaying,
    activeSound,
    volume,
    timerMinutes,
    play,
    stop,
    toggle,
    updateVolume,
  }
}
