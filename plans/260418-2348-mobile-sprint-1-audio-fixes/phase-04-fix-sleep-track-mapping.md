# Phase 04 — Fix Sleep Track Mapping

**Priority:** P1
**Status:** ✅ DONE — already implemented before sprint tracking began
**Risk:** Medium

## What Was Done
`mobile/app/sleep.tsx` has 5 sleep sounds mapped to dedicated audio files (not therapy.mp3):
- rain → `@/assets/audio/rain.mp3`
- ocean → `@/assets/audio/ocean.mp3`
- forest → `@/assets/audio/forest.mp3`
- campfire → `@/assets/audio/campfire.mp3`
- zen → `@/assets/audio/zen.mp3`

Uses `expo-audio`'s `useAudioPlayer` hook with looping support.

## Note
Plan originally scoped 6 sounds; 5 implemented. No `therapy.mp3` fallback present.
