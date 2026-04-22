# Sprint 1 — Mobile Audio Fixes & Dead Code Cleanup

**Duration:** 2 weeks (2026-04-18 → 2026-05-02)
**Goal:** Unblock pre-launch by making 5 broken audio screens actually work, fix paywall navigation, and delete dead code that risks runtime crashes.

## Context
- Decision ref: memory `project-sprint-plan-mobile-fix-vs-rewrite-decision.md`
- Broken features ref: memory `project-mobile-broken-features-pre-launch.md`
- Stack: Expo 54 + expo-router v6 + Zustand + Supabase + Tone.js/expo-audio

## Phases

| # | File | Scope | Risk |
|---|------|-------|------|
| 01 | [phase-01-delete-dead-code.md](phase-01-delete-dead-code.md) | Delete 4 orphan files (AuthContext, root login, userStore dup, orphan onboarding) | Low |
| 02 | [phase-02-fix-paywall-external-url.md](phase-02-fix-paywall-external-url.md) | Replace `router.push('https://...')` with `WebBrowser.openBrowserAsync` | Low |
| 03 | [phase-03-fix-explore-tile-navigation.md](phase-03-fix-explore-tile-navigation.md) | Wire explore tile onPress to `/therapy?track=...` | Low |
| 04 | [phase-04-fix-sleep-track-mapping.md](phase-04-fix-sleep-track-mapping.md) | Map 6 sleep sounds to real files, not therapy.mp3 | Med |
| 05 | [phase-05-fix-hearing-test-native-audio.md](phase-05-fix-hearing-test-native-audio.md) | Replace web-only `window.AudioContext` with native tone | High |
| 06 | [phase-06-implement-zentitone-synth.md](phase-06-implement-zentitone-synth.md) | Real tone output on zentitone screen | High |
| 07 | [phase-07-implement-notch-therapy-filter.md](phase-07-implement-notch-therapy-filter.md) | Biquad notch filter on audio stream (paid USP) | High |

## Ordering
Low-risk deletions first (01–03) → verify nothing regresses → medium fix (04) → high-risk audio work (05–07). Audio phases share an engine utility, so phase 05 lays groundwork reused by 06–07.

## Success Criteria
- `expo start --clear` launches without crashes on iOS/Android
- All 7 phases land as separate commits
- No reference to `window.AudioContext` in `mobile/`
- `mobile_sessions` analytics still fires on navigation (regression check)
- Each tile/button on `explore`, `paywall`, `sleep`, `zentitone`, `hearing-test`, `notch-therapy` produces expected behaviour

## Out of Scope
- Central audioStore refactor → Sprint 2
- expo-av → expo-audio migration → Sprint 2
- RevenueCat IAP → Sprint 3
- Clinical questionnaires (THI/TFI/PHQ-9/GAD-7/ISI) → Sprint 3
