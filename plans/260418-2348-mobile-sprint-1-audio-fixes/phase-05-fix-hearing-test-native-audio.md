# Phase 05 — Fix Hearing Test Native Audio

**Priority:** P1
**Status:** ✅ DONE — already implemented before sprint tracking began
**Risk:** High

## What Was Done
`mobile/app/hearing-test.tsx` uses `react-native-audio-api` (v0.11.7) via lazy try/catch import:
```ts
let AudioContext: any = null;
try { AudioContext = require('react-native-audio-api').AudioContext; } catch {}
```
Gracefully degrades — shows "requires dev build" message if `AudioContext` is null (Expo Go fallback).
Creates oscillator + gain node per frequency test; cleans up on component unmount.
