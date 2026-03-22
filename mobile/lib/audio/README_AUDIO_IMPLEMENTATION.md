# 🎵 Audio Implementation for Fractal Tone Engine

## Current Status

✅ **fractal-engine.ts created** - Logic layer complete
❌ **Audio playback not implemented** - Needs audio library

## Problem

React Native doesn't have Web Audio API's `OscillatorNode` for real-time tone generation.

## Solutions

### Option 1: Use Tone.js with React Native (Recommended) ⭐

**Pros:**
- Most similar to web implementation
- Real-time synthesis
- Full control over waveforms, envelopes, effects

**Cons:**
- Requires polyfills for Web Audio API
- May have performance issues on older devices

**Installation:**
```bash
npm install tone
npm install expo-web-browser  # For polyfills
```

**Implementation:**
```typescript
import * as Tone from 'tone';

// Replace playNextNote() with:
private async playNextNote(): Promise<void> {
  const midi = this.noteSequence[this.noteIndex];
  const freq = midiToFreq(midi);

  const synth = new Tone.Synth({
    oscillator: { type: this.currentStyle!.waveform },
    envelope: {
      attack: 0.02,
      decay: this.currentStyle!.decay,
      sustain: 0,
      release: 0.1,
    },
  }).toDestination();

  synth.volume.value = Tone.gainToDb(velocity * this.volume);
  synth.triggerAttackRelease(freq, this.currentStyle!.decay);

  this.advanceIndex();
}
```

---

### Option 2: Pre-render Audio Files

**Pros:**
- Guaranteed compatibility
- No runtime synthesis overhead
- Better battery life

**Cons:**
- Large app size (need ~500 audio files: 10 octaves × 5 notes × 10 styles)
- Less flexible
- No real-time parameter changes

**Implementation:**
1. Pre-generate sine wave samples for each MIDI note (60-96) using ffmpeg
2. Store in `/assets/tones/`
3. Load and play with Expo Audio:

```typescript
import { Audio } from 'expo-av';

const noteFiles: Record<number, any> = {
  60: require('@/assets/tones/C4.mp3'),
  61: require('@/assets/tones/C#4.mp3'),
  // ... all notes
};

private async playNextNote(): Promise<void> {
  const midi = this.noteSequence[this.noteIndex];
  const { sound } = await Audio.Sound.createAsync(
    noteFiles[midi],
    {
      volume: velocity * this.volume,
      shouldPlay: true,
    }
  );

  // Auto-unload after decay
  setTimeout(() => sound.unloadAsync(), style.decay * 1000);

  this.advanceIndex();
}
```

---

### Option 3: Native Module (Advanced)

**Pros:**
- Best performance
- Full control
- Native audio engine

**Cons:**
- Complex implementation
- Requires native iOS/Android code
- Maintenance overhead

**Skip this unless you have native development experience.**

---

## Recommended Implementation Path

### Phase 1: Quick MVP (Option 2 - Pre-rendered files)

1. Generate 40 sine wave samples (MIDI 48-88, covers most styles):
   ```bash
   cd mobile/assets/tones
   for midi in {48..88}; do
     freq=$(echo "440 * 2^(($midi - 69) / 12)" | bc -l)
     ffmpeg -f lavfi -i "sine=frequency=$freq:duration=3" \
       -af "afade=t=in:st=0:d=0.02,afade=t=out:st=2.9:d=0.1" \
       "note-$midi.mp3"
   done
   ```

2. Update `fractal-engine.ts` to use these files

3. Test basic playback

### Phase 2: Full Implementation (Option 1 - Tone.js)

1. Install Tone.js + polyfills
2. Replace file-based playback with Tone.js synthesis
3. Add reverb, envelope shaping
4. Test on iOS & Android

---

## Metro Config for Tone.js

If using Option 1, add to `metro.config.js`:

```javascript
const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

  return config;
})();
```

---

## Current Placeholder

The engine currently logs notes to console:
```
Playing note: 523.3Hz, velocity: 0.42, decay: 2.5s
```

This confirms the logic is working. Now we just need to replace `console.log` with actual audio playback.

---

## Testing Checklist

- [ ] Install audio dependencies
- [ ] Implement playback (Option 1 or 2)
- [ ] Test on iOS simulator
- [ ] Test on Android emulator
- [ ] Test on physical device
- [ ] Verify volume control works
- [ ] Verify stop() cleans up properly
- [ ] Test battery usage during playback
- [ ] Test background audio (iOS)

---

## Questions?

Ask Claude to implement Option 1 or Option 2 based on your preference!
