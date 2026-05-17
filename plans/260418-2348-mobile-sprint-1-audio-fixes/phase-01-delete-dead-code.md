# Phase 01 — Delete Dead Code

**Priority:** P1 (warm-up, removes crash risk)
**Status:** ✅ DONE — verified 2026-05-17 (all 4 files already deleted, contexts/ dir gone, zero references)
**Risk:** Low

## Why
Four files are orphaned and either unused or actively broken:
- `mobile/contexts/AuthContext.tsx` — exported `AuthProvider` but `_layout.tsx` never wraps it. Any `useAuth()` caller crashes with "must be used within AuthProvider".
- `mobile/app/login.tsx` (root) — imports `useAuth()` from the unwrapped context. Crashes if the expo-router matcher ever picks this over `(auth)/login.tsx`.
- `mobile/store/userStore.ts` — zero importers. Duplicate of `use-user-store.ts`.
- `mobile/app/onboarding.tsx` — orphan route, no `router.push('/onboarding')` anywhere.

## Files to Delete
- [x] `mobile/contexts/AuthContext.tsx`
- [x] `mobile/app/login.tsx`
- [x] `mobile/store/userStore.ts`
- [x] `mobile/app/onboarding.tsx`
- [x] Remove empty `mobile/contexts/` dir if nothing else remains

## Verification
- [x] `rg "AuthContext|useAuth\b|AuthProvider" mobile` returns 0 hits
- [x] `rg "@/store/userStore['\"]" mobile` returns 0 hits
- [x] `rg "router.(push|replace).*onboarding" mobile` returns 0 hits
- [x] TS compile clean

## Rollback
Single commit per file group; revert commit if anything breaks.
