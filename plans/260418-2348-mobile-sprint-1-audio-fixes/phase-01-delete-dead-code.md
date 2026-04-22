# Phase 01 — Delete Dead Code

**Priority:** P1 (warm-up, removes crash risk)
**Status:** In progress
**Risk:** Low

## Why
Four files are orphaned and either unused or actively broken:
- `mobile/contexts/AuthContext.tsx` — exported `AuthProvider` but `_layout.tsx` never wraps it. Any `useAuth()` caller crashes with "must be used within AuthProvider".
- `mobile/app/login.tsx` (root) — imports `useAuth()` from the unwrapped context. Crashes if the expo-router matcher ever picks this over `(auth)/login.tsx`.
- `mobile/store/userStore.ts` — zero importers. Duplicate of `use-user-store.ts`.
- `mobile/app/onboarding.tsx` — orphan route, no `router.push('/onboarding')` anywhere.

## Files to Delete
- [ ] `mobile/contexts/AuthContext.tsx`
- [ ] `mobile/app/login.tsx`
- [ ] `mobile/store/userStore.ts`
- [ ] `mobile/app/onboarding.tsx`
- [ ] Remove empty `mobile/contexts/` dir if nothing else remains

## Verification
- [ ] `rg "AuthContext|useAuth\b|AuthProvider" mobile` returns 0 hits
- [ ] `rg "@/store/userStore['\"]" mobile` returns 0 hits
- [ ] `rg "router.(push|replace).*onboarding" mobile` returns 0 hits
- [ ] `cd mobile && npm run lint` passes
- [ ] TS compile clean

## Rollback
Single commit per file group; revert commit if anything breaks.
