import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  Dimensions, Animated, Easing, PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { TinniOrb } from '@/components/TinniOrb';

// Lazy import — react-native-audio-api requires a dev build (not Expo Go)
let AudioContext: any = null;
try {
  AudioContext = require('react-native-audio-api').AudioContext;
} catch {}

type AudioContextType = any;
type OscillatorNode = any;
type GainNode = any;

const TONE_VOLUME = 0.15;
const FADE_MS = 80;

const { width } = Dimensions.get('window');

// ── Tone presets ──
const PRESETS = [
  { id: 'match',  label: '🎯 Khớp tần số',   freq: 4000, desc: 'Che phủ đúng tần số ù tai' },
  { id: 'low',    label: '🌊 Sóng thấp',      freq: 250,  desc: 'Masking âm tần thấp' },
  { id: 'mid',    label: '🎵 Giữa',           freq: 1000, desc: 'Masking âm tần giữa' },
  { id: 'high',   label: '✨ Tần số 528Hz',   freq: 528,  desc: 'Tần số chữa lành' },
  { id: 'notch',  label: '🎯 Anti-notch',     freq: 6000, desc: 'Kích thích phản notch' },
  { id: 'binaural',label:'🧠 Binaural 40Hz',  freq: 40,   desc: 'Gamma entrainment' },
];

// Animated frequency "needle" display
function FreqMeter({ freq, isPlaying }: { freq: number; isPlaying: boolean }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.96, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])).start();
    } else {
      Animated.timing(pulse, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [isPlaying]);

  return (
    <Animated.View style={[styles.meterContainer, { transform: [{ scale: pulse }] }]}>
      <TinniOrb mode={isPlaying ? 'playing' : 'idle'} size={160} />
      <View style={styles.freqOverlay}>
        <Text style={styles.freqHz}>{freq >= 1000 ? `${(freq / 1000).toFixed(1)}k` : freq}</Text>
        <Text style={styles.freqUnit}>Hz</Text>
      </View>
    </Animated.View>
  );
}

// Manual frequency slider bar
function FreqSlider({ value, onChange }: { value: number; onChange: (hz: number) => void }) {
  const MIN = 20; const MAX = 16000;
  const barRef = useRef<View>(null);
  const sliderAnim = useRef(new Animated.Value(
    ((Math.log(value) - Math.log(MIN)) / (Math.log(MAX) - Math.log(MIN)))
  )).current;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gs) => {
      const ratio = Math.max(0, Math.min(1, gs.moveX / (width - 48)));
      sliderAnim.setValue(ratio);
      // Log scale for frequency
      const hz = Math.round(Math.exp(Math.log(MIN) + ratio * (Math.log(MAX) - Math.log(MIN))));
      onChange(hz);
      Haptics.selectionAsync();
    },
  });

  const thumbX = sliderAnim.interpolate({ inputRange: [0, 1], outputRange: [0, width - 48 - 24] });

  return (
    <View style={styles.sliderWrap}>
      <View style={styles.sliderTrack} {...panResponder.panHandlers}>
        <View style={styles.sliderFill}>
          <Animated.View style={[styles.sliderFillInner, { width: thumbX }]} />
        </View>
        <Animated.View style={[styles.sliderThumb, { transform: [{ translateX: thumbX }] }]} />
      </View>
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabelText}>20 Hz</Text>
        <Text style={styles.sliderLabelText}>16k Hz</Text>
      </View>
    </View>
  );
}

export default function ZentitoneScreen() {
  const [freq, setFreq]         = useState(4000);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePreset, setActivePreset] = useState('match');
  const router = useRouter();

  const ctxRef = useRef<AudioContextType | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  function stopTone() {
    const ctx = ctxRef.current;
    const gain = gainRef.current;
    const osc = oscRef.current;
    if (ctx && gain && osc) {
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + FADE_MS / 1000);
      try { osc.stop(now + FADE_MS / 1000); } catch {}
    }
    setTimeout(() => {
      try { ctxRef.current?.close(); } catch {}
      ctxRef.current = null;
      oscRef.current = null;
      gainRef.current = null;
    }, FADE_MS + 20);
  }

  function startTone(hz: number) {
    stopTone();
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(hz, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(TONE_VOLUME, ctx.currentTime + FADE_MS / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    ctxRef.current = ctx;
    oscRef.current = osc;
    gainRef.current = gain;
  }

  // Live frequency update while playing
  useEffect(() => {
    if (!isPlaying) return;
    const ctx = ctxRef.current;
    const osc = oscRef.current;
    if (ctx && osc) {
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
    }
  }, [freq, isPlaying]);

  useEffect(() => () => stopTone(), []);

  function handlePreset(preset: typeof PRESETS[0]) {
    setActivePreset(preset.id);
    setFreq(preset.freq);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  function togglePlay() {
    Haptics.notificationAsync(
      isPlaying ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success
    );
    if (isPlaying) {
      stopTone();
      setIsPlaying(false);
    } else {
      startTone(freq);
      setIsPlaying(true);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {!AudioContext ? (
        <>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ChevronLeft size={24} color="#7A9686" />
            </TouchableOpacity>
            <View>
              <Text style={styles.title}>Zentitone</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 40, marginBottom: 16 }}>🔧</Text>
            <Text style={{ fontSize: 16, color: '#F4A261', textAlign: 'center', lineHeight: 24 }}>
              Tính năng này yêu cầu Development Build.{"\n"}Không hỗ trợ trên Expo Go.
            </Text>
          </View>
        </>
      ) : (<>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#7A9686" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Zentitone</Text>
          <Text style={styles.titleSub}>Tone trị liệu cá nhân</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Orb + frequency display */}
      <View style={styles.center}>
        <FreqMeter freq={freq} isPlaying={isPlaying} />
      </View>

      {/* Manual frequency slider */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Chỉnh tần số thủ công</Text>
        <FreqSlider value={freq} onChange={setFreq} />
        <Text style={styles.freqCurrent}>{freq} Hz</Text>
      </View>

      {/* Presets */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Preset phổ biến</Text>
        <View style={styles.presetGrid}>
          {PRESETS.map(p => (
            <TouchableOpacity
              key={p.id}
              style={[styles.presetCard, activePreset === p.id && styles.presetCardActive]}
              onPress={() => handlePreset(p)}
              activeOpacity={0.75}>
              <Text style={styles.presetLabel}>{p.label}</Text>
              <Text style={styles.presetDesc}>{p.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Play button */}
      <TouchableOpacity
        style={[styles.playBtn, isPlaying && styles.playBtnActive]}
        onPress={togglePlay}
        activeOpacity={0.85}>
        <Text style={styles.playBtnText}>
          {isPlaying ? '⏸  Dừng tone' : '▶  Phát tone'}
        </Text>
      </TouchableOpacity>
      </>)}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1410', paddingHorizontal: 24 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 8, paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: '#E8F0EB', textAlign: 'center' },
  titleSub: { fontSize: 11, color: '#7A9686', textAlign: 'center' },

  center: {
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  meterContainer: { alignItems: 'center', justifyContent: 'center' },
  freqOverlay: {
    position: 'absolute', alignItems: 'center',
  },
  freqHz: { fontSize: 34, fontWeight: '900', color: '#E8F0EB' },
  freqUnit: { fontSize: 12, color: '#3D5445', marginTop: -4 },

  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 11, color: '#3D5445', fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10,
  },

  sliderWrap: { gap: 6 },
  sliderTrack: { height: 40, justifyContent: 'center' },
  sliderFill: {
    height: 6, backgroundColor: '#1F2E25', borderRadius: 3,
    overflow: 'hidden',
  },
  sliderFillInner: {
    height: '100%', backgroundColor: '#C86B2A', borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute', width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#F4A261',
    shadowColor: '#C86B2A', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 8, elevation: 6,
    top: 8,
  },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabelText: { fontSize: 10, color: '#3D5445' },
  freqCurrent: {
    fontSize: 13, color: '#F4A261', fontWeight: '700',
    textAlign: 'center', marginTop: 4,
  },

  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  presetCard: {
    width: (width - 48 - 8) / 2,
    backgroundColor: '#141E18', borderRadius: 14,
    borderWidth: 1, borderColor: '#1F2E25',
    padding: 12,
  },
  presetCardActive: { borderColor: '#C86B2A', backgroundColor: '#00A89618' },
  presetLabel: { fontSize: 13, fontWeight: '700', color: '#BDD0C3', marginBottom: 2 },
  presetDesc: { fontSize: 10, color: '#7A9686' },

  playBtn: {
    backgroundColor: '#7A3B1E', borderRadius: 100, paddingVertical: 16,
    alignItems: 'center', marginBottom: 24,
    shadowColor: '#7A3B1E', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 14, elevation: 8,
  },
  playBtnActive: { backgroundColor: '#009678', shadowColor: '#009678' },
  playBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
