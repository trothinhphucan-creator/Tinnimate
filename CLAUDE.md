# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TinniMate** — Vietnam's first tinnitus therapy app. Combines proprietary audio tech (Zentones, Notch Therapy) with clinical tools (THI, TFI, PHQ-9, GAD-7, ISI questionnaires) and an AI chatbot (Tinni AI). Pre-launch stage targeting the Vietnamese market.

## Monorepo Structure

```
tinnimate/
├── mobile/       # Expo (React Native) — iOS, Android, web
├── web/          # Next.js 16 — dashboard, public pages, admin
└── video-intro/  # Remotion standalone video project
```

## Commands

### Mobile (`cd mobile`)
```bash
npm start           # Expo dev server
npm run android     # Android emulator
npm run ios         # iOS simulator
npm run web         # Web via Expo
npm run lint        # ESLint
```

### Web (`cd web`)
```bash
npm run dev         # Next.js dev server (port 3000, Turbopack)
npm run build       # Production build
npm run start       # Production server
npm run lint        # ESLint
```

## Architecture

### Mobile (Expo Router + Zustand)
- **Routing**: Expo Router v6 — file-based. Tabs: `breathing`, `cbti`, `hearing-test`, `journal`, `mixer`, `therapy`, `sleep`, `zentones`, `paywall`, `profile`
- **Audio engine**: `mobile/lib/audio/fractal-engine.ts` — proprietary Zentones synthesis using Tone.js
- **State**: Zustand stores; auth via Supabase with AsyncStorage
- **Push notifications**: `hooks/usePushNotifications.ts` via Expo + Capacitor

### Web (Next.js App Router + Zustand)
- **Routing**: App Router with route groups: `/(app)` (authenticated), `/(auth)`, `/admin`, `/api`
- **UI**: shadcn/ui + Radix + Tailwind CSS v4
- **LLM abstraction**: `web/lib/api/` — switchable between Gemini/OpenAI/Anthropic for Tinni AI chatbot
- **Auth**: Supabase SSR auth; rate limiting in `web/lib/rate-limit.ts`
- **Payments**: Stripe integration in `web/lib/stripe/`
- **Localization**: Vietnamese primary; `web/lib/i18n.ts`

### Shared
- **Database/Auth**: Supabase (`@supabase/supabase-js`)
- **Audio**: Tone.js v15 for sound generation across both platforms
- **State**: Zustand v5

## Key Domain Concepts

- **Zentones**: Proprietary fractal melody system — self-similar audio patterns that promote tinnitus habituation
- **Notch Therapy**: User completes audiometry → app filters their specific tinnitus frequency (Hughson-Westlake method, 6 frequencies)
- **Tinni AI**: Bilingual (VI/EN) chatbot — empathetic, non-diagnostic, includes crisis resource routing (1800 599 920)
- **Freemium tiers**: Free (5 msgs/day, 3 sounds), Premium (99K VND/mo), Pro (199K VND/mo + audiologist consultation)

## Docs

Project docs live in `docs/`:
- `project-overview-pdr.md` — full product spec, personas, pricing, KPIs
- `project-roadmap.md` — development phases
- `brand-guidelines.md` — voice, tone, visual identity
