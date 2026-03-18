'use client'
// Vibration API wrapper for haptic feedback patterns — SSR-safe

function isVibrationSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator
}

// Wraps navigator.vibrate with SSR guard
export function vibrate(pattern: number | number[]): void {
  if (!isVibrationSupported()) return
  navigator.vibrate(pattern)
}

// 4-second inhale vibration
export function breatheIn(): void {
  vibrate(4000)
}

// 4-second exhale with short pause (200ms gap then 3800ms)
export function breatheOut(): void {
  vibrate([200, 100, 3700])
}

// Box breathing: 4s inhale, 4s hold, 4s exhale, 4s hold
export function boxBreathing(): void {
  vibrate([4000, 4000, 4000, 4000, 4000, 4000, 4000])
}

// 4-7-8 breathing: 4s inhale, 7s hold, 8s exhale
export function breathing478(): void {
  vibrate([4000, 7000, 8000])
}
