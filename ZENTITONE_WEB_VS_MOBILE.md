# 🎵 So sánh ZenTinitone (Web) vs Zentitone (Mobile)

## TL;DR

**Web ZenTinitone** = Advanced fractal music generator (như Widex Zen)
**Mobile Zentitone** = Simple tone generator với presets cố định

→ **Cần port Web ZenTinitone sang Mobile để giống nhau**

---

## 📊 Chi tiết so sánh

### Web ZenTinitone (`/web/app/(app)/zen/page.tsx`)

**Công nghệ:**
- ✅ **L-System Fractal Algorithm** - tạo giai điệu không bao giờ lặp lại
- ✅ **Pentatonic Scales** (Major + Minor) - âm nhạc dễ nghe
- ✅ **10 phong cách khác nhau** (Ocean Breeze, Starlight, Lotus, v.v.)
- ✅ **Reverb + Envelope** - âm thanh tự nhiên như chuông
- ✅ **Web Audio API** với oscillator + gain + convolver

**Features:**
- 10 styles với tham số khác nhau (tempo, octave, scale, decay, reverb, density)
- Mỗi style có màu sắc, emoji, mô tả riêng
- Sparkle animation khi đang play
- Volume control real-time
- Trial limits theo tier (Free: 1 trial, Premium: 3, Pro: unlimited)
- Demo 10 giây miễn phí (không tính trial)
- Upgrade modal khi hết trial

**Music Algorithm:**
```
1. L-System generates sequence:
   "ABCDE" → iterate 4 times with rules → long sequence

2. Map to scale degrees:
   A→0, B→1, C→2, D→3, E→4

3. Convert to MIDI notes:
   degree + baseOctave * 12 + scale interval

4. Play with oscillator:
   - Attack-decay envelope (no sustain)
   - Random velocity for naturalness
   - Subtle octave harmonic for richness
   - Reverb for spaciousness

5. Scheduler plays notes at tempo interval
   - Some notes skipped randomly (density parameter)
   - Sequence rotates at end for variation
```

**Example styles:**
- **Ocean Breeze** 🌊: Slow (1200ms), low octave (4), reverb 0.7, major scale
- **Starlight** ✨: Fast (800ms), high octave (5), reverb 0.6, major scale
- **Moonlight** 🌙: Very slow (2000ms), very low octave (3), reverb 0.9, minor scale

---

### Mobile Zentitone (`/mobile/app/zentitone.tsx`)

**Công nghệ:**
- ❌ **Simple presets** - tần số cố định
- ❌ **Manual frequency slider** - user chỉnh thủ công (20Hz - 16kHz)
- ❌ **6 presets cố định** (match, low, mid, high, notch, binaural)
- ❌ **Không có fractal generation**
- ❌ **Chưa implement audio playback** (chỉ có UI)

**Features:**
- TinniOrb animation (pulsing khi play)
- Frequency slider với log scale
- 6 presets:
  - 🎯 Khớp tần số (4000 Hz)
  - 🌊 Sóng thấp (250 Hz)
  - 🎵 Giữa (1000 Hz)
  - ✨ Tần số 528Hz (healing frequency)
  - 🎯 Anti-notch (6000 Hz)
  - 🧠 Binaural 40Hz (gamma entrainment)
- Play/stop button
- **CHƯA CÓ AUDIO ENGINE** - chỉ UI

**Vấn đề:**
```typescript
// line 99-104: togglePlay function
function togglePlay() {
  setIsPlaying(p => !p);
  Haptics.notificationAsync(...);
}
// → Không có code phát âm thanh thực sự!
```

---

## 🎯 Đề xuất: Port Web ZenTinitone → Mobile

### Option 1: Port đầy đủ Fractal Engine (Khuyến nghị) ✅

**Ưu điểm:**
- Giống 100% web
- Âm thanh chất lượng cao, không lặp lại
- 10 phong cách đa dạng
- Research-backed (dựa trên Widex Zen)

**Thách thức:**
- Cần port Web Audio API → React Native
- React Native không có Web Audio API native
- Giải pháp: Dùng `expo-audio` + `react-native-sound` hoặc Tone.js wrapper

**Công việc cần làm:**
1. ✅ Copy `fractal-engine.ts` → mobile
2. ✅ Replace Web Audio API với React Native audio library
3. ✅ Update UI để có 10 styles (grid layout giống web)
4. ✅ Add trial limits (Free/Premium/Pro)
5. ✅ Add demo mode (10 giây miễn phí)
6. ✅ Remove manual frequency slider (không cần nữa)

---

### Option 2: Simple Tone Generator (Nhanh hơn)

**Ưu điểm:**
- Đơn giản hơn, implement nhanh
- Không cần fractal algorithm

**Nhược điểm:**
- Không giống web
- Âm thanh đơn điệu, lặp lại
- Ít giá trị trị liệu hơn

**Công việc:**
1. Add simple tone oscillator với Expo Audio
2. Play fixed frequencies theo presets
3. Add volume control
4. Keep manual slider

---

## 🚀 Recommended Plan: Port Fractal Engine

### Step 1: Install audio library

```bash
cd /home/haichu/tinnimate/mobile
npm install expo-audio @react-native-community/audio-toolkit
# Hoặc
npm install tone  # Tone.js works in React Native with polyfill
```

### Step 2: Create mobile fractal engine

```typescript
// mobile/lib/audio/fractal-engine.ts
// Port from web, replace:
// - AudioContext → Expo Audio.Sound
// - Oscillator → Expo Audio Synthesizer (nếu có) hoặc pre-rendered samples
```

**Vấn đề:** React Native không có oscillator native
**Giải pháp:**
- Option A: Pre-render audio samples cho mỗi note, play theo schedule
- Option B: Dùng Tone.js (có support React Native)
- Option C: Native module (phức tạp)

### Step 3: Update UI

Copy layout từ web:
- Grid of 10 styles (5 columns x 2 rows)
- Each style: emoji + name (first word)
- Selected style: highlight with border + gradient
- Play button in center with orb
- Volume slider at bottom
- Trial counter (if not Pro tier)

### Step 4: Add trial logic

```typescript
const TRIAL_LIMITS = {
  free: 1,
  premium: 3,
  pro: Infinity,
};

// Check subscription_tier from user profile
// Track trials in AsyncStorage
```

---

## 💡 Giải pháp đơn giản nhất: Dùng WebView

**Idea:** Embed web `/zen` page trong mobile app qua WebView

**Ưu điểm:**
- ✅ Không cần port code
- ✅ 100% giống web
- ✅ Auto-update khi web thay đổi

**Nhược điểm:**
- ❌ UX không native (scrolling, gestures khác)
- ❌ Cần internet connection (hoặc cache static)
- ❌ Performance có thể kém hơn

**Implementation:**
```typescript
import { WebView } from 'react-native-webview';

export default function ZentitoneScreen() {
  return (
    <WebView
      source={{ uri: 'https://tinnimate.vuinghe.com/zen' }}
      // Hoặc local: require('./zen-page.html')
    />
  );
}
```

---

## 🎯 Kết luận & Khuyến nghị

### Nếu muốn quality cao & giống web 100%:
→ **Option 1: Port Fractal Engine** với Tone.js

### Nếu muốn nhanh & đơn giản:
→ **Giải pháp WebView**

### Nếu muốn native performance:
→ **Option 2: Simple Tone Generator** (nhưng sẽ khác web)

---

## 📝 Implementation Checklist (Option 1 - Recommended)

- [ ] Install Tone.js in mobile: `npm install tone`
- [ ] Create `/mobile/lib/audio/fractal-engine.ts` (port from web)
- [ ] Test Tone.js works in React Native (may need metro config)
- [ ] Copy ZEN_STYLES array (10 styles with all params)
- [ ] Update `/mobile/app/zentitone.tsx`:
  - [ ] Replace current presets with 10 zen styles
  - [ ] Replace manual slider with style grid
  - [ ] Add fractal engine playback
  - [ ] Add volume control
  - [ ] Add trial counter logic
  - [ ] Add demo mode (10s free)
  - [ ] Add upgrade modal
- [ ] Test on iOS & Android
- [ ] Match web styling (colors, gradients, sparkles)

---

## 🔗 Files to reference

**Web:**
- `/home/haichu/tinnimate/web/app/(app)/zen/page.tsx` - UI + logic
- `/home/haichu/tinnimate/web/lib/audio/fractal-engine.ts` - Audio engine

**Mobile:**
- `/home/haichu/tinnimate/mobile/app/zentitone.tsx` - Current implementation

---

**Bạn muốn tôi implement Option nào?**
1. Port Fractal Engine (giống web 100%)
2. Simple WebView embed
3. Giữ nguyên mobile, chỉ add audio playback đơn giản
