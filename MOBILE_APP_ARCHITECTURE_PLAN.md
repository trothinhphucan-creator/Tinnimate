# 📱 TinniMate Mobile App - Complete Architecture Plan

**Platform:** React Native (Expo SDK 54)
**Date:** March 22, 2026
**Goal:** Parity with web app + mobile-first optimizations

---

## 🎯 User Journey Mapping

### Web App User Journey (Current):
```
Login → Dashboard → Choose Feature → Use → Track Progress → Upgrade
```

### Mobile App User Journey (Optimized):
```
Onboarding (First Launch)
   ↓
Login/Register
   ↓
Home Tab (Dashboard)
   ├→ Quick Actions (Sound Therapy, Chat, Zen)
   ├→ Today's Stats (Check-in, Streak)
   └→ Recent Activity

Therapy Tab (Sound Library)
   ├→ Browse Sounds (White/Pink/Brown Noise, Nature)
   ├→ Play → Mixer → Sleep Timer
   └→ Favorites

Chat Tab
   ├→ AI Chat with Tinni
   ├→ Tool Suggestions (Clickable)
   └→ History

Discover Tab (Features)
   ├→ Zentones ✨ (Ultra exclusive)
   ├→ Notch Therapy
   ├→ Hearing Test
   ├→ CBT-i Program
   ├→ Breathing Exercises
   └→ Journal

Profile Tab
   ├→ User Info + Tier Badge
   ├→ Stats & Progress
   ├→ Settings
   └→ Upgrade to Ultra
```

---

## 🗂️ Navigation Architecture

### Bottom Tab Navigation (Primary - 5 Tabs)

```
┌─────────────────────────────────────────────┐
│  [🏠 Home] [🎵 Therapy] [💬 Chat] [✨ Discover] [👤 Profile]  │
└─────────────────────────────────────────────┘
```

#### Tab 1: Home (Dashboard)
**Icon:** 🏠 Headphones
**Purpose:** Central hub, quick access to main features

**Components:**
- Welcome header with time-based greeting
- Tier badge (Free/Premium/Pro/Ultra)
- Today's check-in card
- Streak counter
- Quick action buttons (3x3 grid):
  - Sound Therapy 🎵
  - Chat with Tinni 💬
  - Zentones ✨ (Ultra badge)
  - Hearing Test 👂
  - Breathing 🌬️
  - Sleep Mode 🌙
  - Notch Therapy 🎯
  - Mixer 🎛️
  - CBT-i 🧠
- Recent activity timeline
- "Tip of the day" card

#### Tab 2: Therapy (Sound Library)
**Icon:** 🎵 Music2
**Purpose:** Sound therapy - main therapeutic tool

**Components:**
- Search bar
- Category tabs:
  - Noise (White, Pink, Brown)
  - Nature (Rain, Ocean, Forest, Birds)
  - Healing (Singing Bowl, Wind Chimes)
  - Binaural Beats
- Sound cards (with waveform preview)
- Now Playing bar (sticky bottom)
- Favorites section
- Sound Mixer button (floating action)

**Player Controls:**
- Play/Pause
- Volume slider
- Timer (5/10/15/30/60 min)
- Loop toggle
- Add to favorites

#### Tab 3: Chat
**Icon:** 💬 MessageCircle
**Purpose:** AI conversation with Tinni

**Components:**
- Chat header with Tinni avatar (animated orb)
- Message bubbles (user + AI)
- Tool result cards (embedded):
  - Hearing test results
  - Quiz results
  - Sound player
- Clickable suggestions
- Input field with microphone
- Quick actions bar (tools)

#### Tab 4: Discover (Explore Features)
**Icon:** ✨ Compass
**Purpose:** Feature discovery & premium content

**Components:**
- Hero card (rotating featured content)
- Feature grid:
  - **Zentones** ✨ (Premium card with Ultra badge)
  - Notch Therapy 🎯
  - Hearing Test 👂
  - CBT-i Program 🧠
  - Sleep Mode 🌙
  - Journal 📝
  - Breathing Exercises 🌬️
  - Progress Charts 📊
- "New" badges for recently added features
- Upgrade CTA for locked features

#### Tab 5: Profile
**Icon:** 👤 User
**Purpose:** User management & settings

**Components:**
- User avatar + name
- Tier badge (clickable → pricing)
- Stats cards:
  - Therapy sessions
  - Chat messages
  - Streak days
  - Hours listened
- Menu items:
  - Edit Profile
  - Notification Settings
  - Language (EN/VI)
  - Dark Mode (toggle)
  - Subscription & Billing
  - Help & Support
  - About TinniMate
  - Privacy Policy
  - Terms of Service
  - Logout

---

## 📄 Screen Inventory & Implementation Status

### ✅ Implemented Screens
1. `/app/(tabs)/index.tsx` - Home/Dashboard
2. `/app/(tabs)/explore.tsx` - Therapy sounds
3. `/app/(tabs)/chat.tsx` - Chat with Tinni
4. `/app/(tabs)/zen.tsx` - Discover/Explore
5. `/app/(tabs)/profile.tsx` - User profile
6. `/app/(auth)/login.tsx` - Authentication
7. `/app/breathing.tsx` - Breathing exercises
8. `/app/cbti.tsx` - CBT-i program
9. `/app/journal.tsx` - Journal entries
10. `/app/mixer.tsx` - Sound mixer
11. `/app/notch-therapy.tsx` - Notch therapy
12. `/app/onboarding.tsx` - First-time user flow
13. `/app/paywall.tsx` - Subscription upgrade
14. `/app/sleep.tsx` - Sleep mode
15. `/app/zentones.tsx` - Zentones feature
16. `/app/profile.tsx` - Profile details

### 🔨 Screens to Create/Update

#### High Priority (Core Features):
1. **Home/Dashboard** - Redesign with quick actions
2. **Therapy Library** - Sound browser with player
3. **Hearing Test** - Interactive audiometry
4. **Pricing** - Subscription plans (Free/Premium/Pro/Ultra)
5. **Stats/Progress** - Charts & analytics

#### Medium Priority (Enhanced UX):
6. **Onboarding Flow** - Multi-step welcome
7. **Settings** - Comprehensive preferences
8. **Notifications** - Push notification center
9. **Search** - Global search for features/sounds

#### Low Priority (Nice to Have):
10. **Help/FAQ** - In-app support
11. **About** - App info & credits
12. **Changelog** - What's new

---

## 🎨 Design System (Mobile-First)

### Color Palette (Consistent with Web)
```typescript
const COLORS = {
  // Background
  bg: {
    primary: '#020617',   // slate-950
    secondary: '#0F172A', // slate-900
    card: '#1E293B',      // slate-800
  },

  // Text
  text: {
    primary: '#F8FAFC',   // slate-50
    secondary: '#94A3B8', // slate-400
    muted: '#64748B',     // slate-500
  },

  // Accent
  accent: {
    primary: '#818CF8',   // indigo-400
    secondary: '#06B6D4', // cyan-500
    success: '#10B981',   // emerald-500
    warning: '#F59E0B',   // amber-500
    danger: '#EF4444',    // red-500
  },

  // Tier badges
  tier: {
    free: '#64748B',      // slate-500
    premium: '#3B82F6',   // blue-500
    pro: '#A855F7',       // purple-500
    ultra: '#F59E0B',     // amber-500
  },
}
```

### Typography
```typescript
const FONTS = {
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: COLORS.text.secondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text.muted,
  },
}
```

### Spacing System
```typescript
const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}
```

### Border Radius
```typescript
const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
}
```

---

## 🔄 Feature Parity Matrix

| Feature | Web | Mobile | Priority | Notes |
|---------|-----|--------|----------|-------|
| **Core Features** |
| Dashboard | ✅ | ⚠️ | HIGH | Redesign needed |
| Sound Therapy | ✅ | ✅ | HIGH | Good |
| Chat with AI | ✅ | ✅ | HIGH | Good |
| Zentones | ✅ | ✅ | HIGH | **NEW - Just added** |
| **Therapy Tools** |
| Hearing Test | ✅ | ⏳ | HIGH | Web: Hughson-Westlake |
| Notch Therapy | ✅ | ✅ | MED | Good |
| Sound Mixer | ✅ | ✅ | MED | Good |
| Breathing | ✅ | ✅ | MED | Good |
| **Program Features** |
| CBT-i | ✅ | ✅ | MED | 4-week program |
| Sleep Mode | ✅ | ✅ | MED | Good |
| Journal | ✅ | ✅ | LOW | Basic |
| **Progress & Analytics** |
| Stats Dashboard | ✅ | ⏳ | MED | Charts needed |
| Progress Charts | ✅ | ⏳ | MED | Sync with web |
| Streak Tracking | ✅ | ⏳ | MED | Gamification |
| **Account & Billing** |
| Profile | ✅ | ✅ | HIGH | Good |
| Pricing | ✅ | ⏳ | HIGH | **Add Ultra tier** |
| Subscription | ✅ | ⏳ | HIGH | Payment flow |
| **Content** |
| Blog/Knowledge | ✅ | ❌ | LOW | Web-only OK |
| FAQ/Help | ✅ | ⏳ | LOW | Basic support |

**Legend:**
- ✅ Implemented & Good
- ⚠️ Implemented but needs update
- ⏳ Not implemented yet
- ❌ Not planned

---

## 📐 Mobile-Specific Optimizations

### 1. Offline Mode
```typescript
// Cache essential data
- Recently played sounds
- Chat history (last 20 messages)
- User profile
- Subscription tier
```

### 2. Background Audio
```typescript
// Use expo-av for background playback
- Continue playing when app backgrounded
- Lock screen controls
- Notification with player controls
```

### 3. Push Notifications
```typescript
// Notification types
- Daily check-in reminder (9 AM)
- Therapy session reminder
- Streak milestone (3/7/14/30 days)
- New feature announcements
- Subscription expiry
```

### 4. Performance
```typescript
// Optimization strategies
- Lazy load tabs
- Image optimization (compressed)
- Virtual lists for long content
- Memoize expensive components
- Debounce search inputs
```

### 5. Gestures
```typescript
// Mobile-first interactions
- Swipe to navigate between sounds
- Pull-to-refresh on home
- Long-press for favorites
- Pinch-to-zoom on charts
```

---

## 🚀 Implementation Roadmap

### Phase 1: Core Functionality (Week 1-2)
**Goal:** Essential features working

- [x] Bottom tab navigation
- [x] Authentication (login/register)
- [x] User store (Zustand)
- [x] Sound player (expo-av)
- [x] Chat with AI
- [x] Zentones (fractal engine)
- [ ] Home dashboard redesign
- [ ] Therapy library UI
- [ ] Profile with tier badge

### Phase 2: Premium Features (Week 3-4)
**Goal:** Monetization ready

- [ ] Hearing test (audiometry)
- [ ] Pricing page (4 tiers)
- [ ] Paywall/upgrade flow
- [ ] Subscription management
- [ ] Premium gate logic
- [ ] Trial limits enforcement

### Phase 3: Engagement & Retention (Week 5-6)
**Goal:** User stickiness

- [ ] Daily check-in
- [ ] Streak tracking
- [ ] Progress charts
- [ ] Push notifications
- [ ] Onboarding flow
- [ ] Tutorial/tips

### Phase 4: Polish & Optimization (Week 7-8)
**Goal:** Production-ready

- [ ] Offline mode
- [ ] Background audio
- [ ] Performance optimization
- [ ] Error handling
- [ ] Analytics tracking
- [ ] A/B testing setup

---

## 📊 Screen-by-Screen Implementation Guide

### Home Tab (Dashboard)
```typescript
// /app/(tabs)/index.tsx

Components:
1. Header
   - Greeting (Good morning, {name}!)
   - Tier badge (clickable)
   - Settings icon

2. Today's Check-in Card
   - Mood slider (1-5)
   - Tinnitus loudness (1-10)
   - Sleep quality (1-5)
   - Quick check-in button

3. Streak Card
   - Fire icon with streak count
   - Progress bar to next milestone
   - Motivational message

4. Quick Actions Grid (3x3)
   - Large touchable cards
   - Icon + Label
   - Premium badges where applicable

5. Recent Activity
   - Timeline of last 5 actions
   - Time ago + description
   - View all button

6. Tip of the Day
   - Rotating educational content
   - Swipeable carousel
```

### Therapy Tab (Sound Library)
```typescript
// /app/(tabs)/explore.tsx

Components:
1. Search Bar
   - Icon + placeholder
   - Filter button (right)

2. Category Tabs
   - Horizontal scroll
   - Active indicator

3. Sound Grid
   - 2 columns on phone
   - Card with:
     - Waveform visualization
     - Title
     - Duration/Type
     - Favorite heart icon

4. Now Playing Bar (sticky)
   - Thumbnail
   - Title
   - Play/Pause
   - Expand arrow

5. Player Modal (full screen)
   - Large waveform
   - Title + description
   - Volume slider
   - Timer picker
   - Loop toggle
   - Favorite button
   - Close button

States:
- Loading sounds
- Playing
- Paused
- Timer active
```

### Chat Tab
```typescript
// /app/(tabs)/chat.tsx

Components:
1. Header
   - Tinni avatar (animated)
   - Online status
   - Menu (clear history)

2. Message List
   - Reverse chronological
   - User bubbles (right, blue)
   - AI bubbles (left, gray)
   - Tool result cards (embedded)
   - Typing indicator

3. Tool Results
   - Hearing test → Chart
   - Quiz → Score card
   - Sound → Mini player
   - Diagnosis → Info card

4. Input Area
   - Text field
   - Microphone button
   - Send button
   - Quick actions drawer

5. Quick Actions Drawer
   - Bottom sheet
   - Tool grid
   - Close on selection

States:
- Idle
- User typing
- AI thinking
- Tool executing
- Error
```

### Discover Tab (Features)
```typescript
// /app/(tabs)/zen.tsx (renamed from 'zen' to 'discover')

Components:
1. Hero Card
   - Featured content
   - Auto-rotating
   - CTA button

2. Feature Grid
   - 2 columns
   - Premium cards with badge
   - Locked overlay for non-subscribers

3. Feature Card
   - Icon
   - Title
   - Description (1 line)
   - Premium badge
   - Tap to navigate

Features List:
- Zentones ✨ (Ultra only)
- Notch Therapy
- Hearing Test
- CBT-i Program
- Sleep Mode
- Journal
- Breathing
- Progress

Navigation:
- Card tap → Navigate to feature
- If locked → Show upgrade modal
```

### Profile Tab
```typescript
// /app/(tabs)/profile.tsx

Components:
1. Header
   - Avatar (editable)
   - Name
   - Email
   - Edit button

2. Tier Card
   - Large badge
   - Current tier
   - Benefits list
   - Upgrade CTA

3. Stats Grid (2x2)
   - Sessions count
   - Messages sent
   - Streak days
   - Hours listened

4. Menu List
   - Icon + Label + Arrow
   - Sections:
     - Account (Edit, Notifications)
     - App (Language, Theme)
     - Subscription (Manage, Billing)
     - Support (Help, FAQ)
     - About (Terms, Privacy)
     - Logout (destructive)

States:
- Logged in
- Editing profile
- Loading stats
```

---

## 🎵 Special Feature: Zentones Mobile

Already implemented! See `/mobile/app/zentones.tsx`

**Features:**
- 10 zen styles with fractal algorithm
- Tone.js audio synthesis
- Volume slider
- Style grid (5x2)
- TinniOrb visualization
- Ultra-tier exclusive
- Trial limits (Free/Premium/Pro: 0, Ultra: ∞)

---

## 🔐 Premium Features & Paywalls

### Free Tier (Trial Mode)
**Limits:**
- Chat: 5 messages/day
- Sounds: 3 basic (White/Pink/Brown)
- Hearing Test: 1/month
- No Zentones access

**UI:**
- "🆓 Free" badge
- Locked features with blur + lock icon
- Upgrade CTA on every locked tap

### Premium Tier ($4.99/mo)
**Access:**
- Chat: Unlimited
- Sounds: All 11+ sounds
- Mixer: Unlocked
- Notch Therapy: Unlocked
- Sleep Mode: Unlocked
- No Zentones

**UI:**
- "⭐ Premium" badge (blue)

### Pro Tier ($9.99/mo)
**Access:**
- All Premium features
- Priority AI responses
- ENT specialist consultation
- Family plan (up to 3 users)
- No Zentones

**UI:**
- "💎 Pro" badge (purple)

### Ultra Tier ($14.99/mo) **NEW!**
**Access:**
- All Pro features
- **Zentones ✨** (exclusive)
- Fractal music therapy
- Never-repeating melodies

**UI:**
- "✨ Ultra" badge (amber/gold)
- Zentones unlocked in Discover tab

---

## 📱 Responsive Design Guidelines

### Screen Sizes
```typescript
const BREAKPOINTS = {
  small: 375,  // iPhone SE
  medium: 390, // iPhone 12/13/14
  large: 428,  // iPhone 14 Pro Max
  tablet: 768, // iPad Mini
}
```

### Safe Areas
```typescript
// Use react-native-safe-area-context
import { SafeAreaView } from 'react-native-safe-area-context'

// Respect notch/home indicator
<SafeAreaView edges={['top', 'bottom']}>
```

### Adaptive Layouts
- Phone (portrait): 1 column grids
- Phone (landscape): 2 columns where makes sense
- Tablet: 2-3 columns, sidebar navigation

---

## 🧪 Testing Strategy

### Unit Tests
- Audio engine (Tone.js)
- User store (Zustand)
- Utility functions

### Integration Tests
- Login flow
- Sound playback
- Chat interaction
- Subscription upgrade

### E2E Tests (Detox)
- Onboarding → Login → Play Sound
- Chat → Ask question → Get response
- Discover → Tap Zentones → Upgrade modal
- Profile → Logout

---

## 📦 Dependencies Summary

### Already Installed:
```json
{
  "expo": "~54.0.0",
  "expo-av": "Audio playback",
  "expo-router": "File-based routing",
  "expo-haptics": "Haptic feedback",
  "lucide-react-native": "Icons",
  "@react-native-async-storage/async-storage": "Storage",
  "zustand": "State management",
  "tone": "Audio synthesis",
  "@react-native-community/slider": "UI component"
}
```

### To Add:
```json
{
  "@react-native-charts/line": "Progress charts",
  "expo-notifications": "Push notifications",
  "react-native-reanimated": "Animations",
  "react-native-gesture-handler": "Gestures",
  "@gorhom/bottom-sheet": "Bottom sheets"
}
```

---

## 🎯 Success Metrics

### User Engagement
- Daily Active Users (DAU)
- Session duration (target: 10+ min)
- Sounds played per session (target: 2+)
- Chat messages sent (target: 5+)

### Retention
- Day 1 retention: >40%
- Day 7 retention: >20%
- Day 30 retention: >10%

### Monetization
- Free → Premium conversion: >5%
- Premium → Ultra conversion: >10%
- Churn rate: <5%/month

---

## 📝 Next Steps

1. **Update Home Tab**
   - Redesign with quick actions grid
   - Add today's check-in card
   - Implement streak tracking

2. **Create Pricing Screen**
   - 4 tier cards (Free/Premium/Pro/Ultra)
   - Feature comparison table
   - Payment integration (Stripe/MoMo/VNPay)

3. **Implement Hearing Test**
   - Port Hughson-Westlake from web
   - Mobile-optimized UI
   - Save results to profile

4. **Add Progress Charts**
   - Install charting library
   - Create stats screen
   - Sync with web data

5. **Push Notifications**
   - Setup expo-notifications
   - Create notification service
   - Schedule daily reminders

---

**Created by:** Claude (Sonnet 4.5)
**Date:** March 22, 2026
**Version:** 1.0
**Status:** 🚀 Ready for implementation
