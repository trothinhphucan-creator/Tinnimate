# Phase 02 — Fix Paywall External URL

**Priority:** P1
**Status:** ✅ DONE — already implemented before sprint tracking began
**Risk:** Low

## What Was Done
`mobile/app/paywall.tsx` uses `WebBrowser.openBrowserAsync(CHECKOUT_BASE_URL + '?plan=' + plan)` — correct implementation.
No `router.push('https://...')` pattern exists.

## Verification
- [x] `paywall.tsx` imports `expo-web-browser`
- [x] Checkout uses `WebBrowser.openBrowserAsync` at line 157
- [x] No `router.push` with https URL
