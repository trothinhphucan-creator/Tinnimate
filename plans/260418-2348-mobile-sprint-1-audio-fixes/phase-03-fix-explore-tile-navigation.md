# Phase 03 — Fix Explore Tile Navigation

**Priority:** P1
**Status:** ✅ DONE — 2026-05-17
**Risk:** Low

## What Was Done
Added `trackId` field to each entry in `SOUNDS` array in `mobile/app/(tabs)/explore.tsx`.
Changed `router.push('/therapy')` → `router.push('/therapy?track=${sound.trackId}')`.

`therapy.tsx` already accepts `?track=` via `useLocalSearchParams` and maps it to `initialIdx`.

## Track ID Mapping
| Tile | trackId |
|------|---------|
| Mưa rừng | rain |
| Đại dương | ocean |
| Rừng sâu | forest |
| Bếp lửa | campfire |
| Chim hót | birds |
| Zen chuông | zen |
| White | white |
| Pink | pink |
| Brown | brown |
| 528 Hz | 528hz |

## Verification
- [x] Each tile passes correct `trackId` to `/therapy?track=`
- [x] `therapy.tsx` `useLocalSearchParams` maps track param to `initialIdx`
- [x] TS compile clean (no errors)

## Note
Category chip filter (`activeCat`) is wired to UI but not applied to `filtered` array — pre-existing bug, out of scope for this phase.
