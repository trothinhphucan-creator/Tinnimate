import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  Dimensions, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

// Lazy import — react-native-audio-api requires a dev build (not Expo Go)
let AudioContext: any = null;
try {
  AudioContext = require('react-native-audio-api').AudioContext;
} catch {}

type AudioContextType = any;
type AudioBufferSourceNode = any;
type BiquadFilterNode = any;
type GainNode = any;
type AudioBuffer = any;

// Paul Kellett pink noise filter — cheap, loop-safe
function createPinkNoiseBuffer(ctx: AudioContextType, seconds: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  return buffer;
}

const NOTCH_Q = 30;          // ~1 semitone-wide notch
const NOISE_GAIN = 0.35;
const FADE_MS = 200;

const { width } = Dimensions.get('window');

const FREQ_OPTIONS = [
  { hz: 1000,  label: '1000 Hz' },
  { hz: 2000,  label: '2000 Hz' },
  { hz: 3000,  label: '3000 Hz' },
  { hz: 4000,  label: '4000 Hz' },
  { hz: 6000,  label: '6000 Hz' },
  { hz: 8000,  label: '8000 Hz' },
];

// Notch waveform shape SVG-like using Views
function NotchWaveform({ freq, isActive }: { freq: number; isActive: boolean }) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(0);
    }
  }, [isActive]);

  // Simulate waveform bars with a notch in the center
  const BAR_COUNT = 40;
  const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
    const center = BAR_COUNT / 2;
    const dist   = Math.abs(i - center);
    const notchDepth = Math.max(0, 1 - dist / 5); // deep notch at center
    const baseH  = 20 + Math.sin((i / BAR_COUNT) * Math.PI * 3) * 30 + Math.random() * 15;
    const h      = baseH * (1 - notchDepth * 0.9);
    return { h: Math.max(4, h), isNotch: notchDepth > 0.3 };
  });

  return (
    <View style={styles.waveContainer}>
      {/* Waveform bars */}
      <View style={styles.waveform}>
        {bars.map((b, i) => (
          <View
            key={i}
            style={[
              styles.waveBar,
              {
                height: b.h,
                backgroundColor: b.isNotch ? '#EC4899' : '#3B82F6',
                opacity: b.isNotch ? 0.9 : 0.5,
              },
            ]}
          />
        ))}
      </View>

      {/* Notch indicator dot */}
      <Animated.View style={[
        styles.notchDot,
        {
          opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }),
          transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] }) }],
        },
      ]}>
        <View style={styles.notchDotInner} />
        <View style={styles.notchDotGlow} />
      </Animated.View>

      {/* Freq label */}
      <Text style={styles.freqLabel}>{freq} Hz</Text>
    </View>
  );
}

export default function NotchTherapyScreen() {
  const [selectedHz, setSelectedHz] = useState(4000);
  const [progress, setProgress]     = useState(14);  // days completed
  const [isActive, setIsActive]     = useState(false);
  const router = useRouter();

  const ctxRef = useRef<AudioContextType | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  function stopNotch() {
    const ctx = ctxRef.current;
    const gain = gainRef.current;
    const src = sourceRef.current;
    if (ctx && gain && src) {
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + FADE_MS / 1000);
      try { src.stop(now + FADE_MS / 1000); } catch {}
    }
    setTimeout(() => {
      try { ctxRef.current?.close(); } catch {}
      ctxRef.current = null;
      sourceRef.current = null;
      filterRef.current = null;
      gainRef.current = null;
    }, FADE_MS + 40);
  }

  function startNotch(hz: number) {
    stopNotch();
    const ctx = new AudioContext();
    const buffer = createPinkNoiseBuffer(ctx, 2);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'notch';
    filter.frequency.setValueAtTime(hz, ctx.currentTime);
    filter.Q.setValueAtTime(NOTCH_Q, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(NOISE_GAIN, ctx.currentTime + FADE_MS / 1000);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(ctx.currentTime);

    ctxRef.current = ctx;
    sourceRef.current = src;
    filterRef.current = filter;
    gainRef.current = gain;
  }

  // Retune filter live if user changes frequency while playing
  useEffect(() => {
    if (!isActive) return;
    const ctx = ctxRef.current;
    const filter = filterRef.current;
    if (ctx && filter) {
      filter.frequency.setValueAtTime(selectedHz, ctx.currentTime);
    }
  }, [selectedHz, isActive]);

  useEffect(() => () => stopNotch(), []);

  function toggleActive() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (isActive) {
      stopNotch();
      setIsActive(false);
    } else {
      startNotch(selectedHz);
      setIsActive(true);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Fallback if native module not available (Expo Go) */}
      {!AudioContext && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ChevronLeft size={24} color="#7A9686" />
            </TouchableOpacity>
            <Text style={styles.title}>Notch Therapy</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 40, marginBottom: 16 }}>🔧</Text>
            <Text style={{ fontSize: 16, color: '#F4A261', textAlign: 'center', lineHeight: 24 }}>
              Tính năng này yêu cầu Development Build.{"\n"}Không hỗ trợ trên Expo Go.
            </Text>
          </View>
        </View>
      )}
      {AudioContext && <>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#7A9686" />
        </TouchableOpacity>
        <Text style={styles.title}>Notch Therapy</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Waveform */}
      <NotchWaveform freq={selectedHz} isActive={isActive} />

      {/* Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Tần số ù tai:</Text>
        <Text style={styles.infoHz}>{selectedHz.toLocaleString()} Hz</Text>
        <Text style={styles.infoDesc}>Kích thích thần kinh chữa lành</Text>
      </View>

      {/* Frequency selector */}
      <View style={styles.freqGrid}>
        {FREQ_OPTIONS.map(f => (
          <TouchableOpacity
            key={f.hz}
            style={[styles.freqChip, selectedHz === f.hz && styles.freqChipActive]}
            onPress={() => { setSelectedHz(f.hz); Haptics.selectionAsync(); }}>
            <Text style={[styles.freqChipText, selectedHz === f.hz && styles.freqChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Progress ring */}
      <View style={styles.progressRow}>
        <View style={styles.progressRing}>
          <Text style={styles.progressNum}>{progress}/30</Text>
          <Text style={styles.progressSub}>ngày</Text>
        </View>
        <View style={styles.progressInfo}>
          <Text style={styles.progressTitle}>Tiến trình điều trị</Text>
          <Text style={styles.progressDesc}>
            Liệu pháp notch cần được duy trì đều đặn{'\n'}ít nhất 30 ngày để hiệu quả tốt nhất.
          </Text>
        </View>
      </View>

      {/* Start button */}
      <TouchableOpacity
        style={[styles.startBtn, isActive && styles.startBtnActive]}
        onPress={toggleActive}
        activeOpacity={0.85}>
        <Text style={styles.startBtnText}>
          {isActive ? '⏸ Dừng liệu trình' : '▶ Bắt đầu liệu trình'}
        </Text>
      </TouchableOpacity>
      </>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1410', paddingHorizontal: 24 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 8, paddingBottom: 16,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#E8F0EB' },

  waveContainer: {
    height: 180, width: width - 48,
    backgroundColor: '#0A0F1E',
    borderRadius: 20, borderWidth: 1, borderColor: '#1F2E25',
    marginBottom: 24,
    alignItems: 'center', justifyContent: 'flex-end',
    overflow: 'hidden', paddingBottom: 16,
  },
  waveform: {
    flexDirection: 'row', alignItems: 'flex-end',
    gap: 3, height: 100, paddingHorizontal: 12,
  },
  waveBar: { width: 5, borderRadius: 2.5, minHeight: 4 },
  notchDot: {
    position: 'absolute', top: 30, alignItems: 'center', justifyContent: 'center',
  },
  notchDotInner: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#EC4899',
    shadowColor: '#EC4899', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 10, elevation: 8,
  },
  notchDotGlow: {
    position: 'absolute', width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#EC489920',
  },
  freqLabel: {
    position: 'absolute', bottom: 8,
    fontSize: 12, color: '#7A9686', fontWeight: '600',
  },

  infoCard: {
    alignItems: 'center', paddingVertical: 16,
    backgroundColor: '#141E18', borderRadius: 16,
    borderWidth: 1, borderColor: '#1F2E25', marginBottom: 20,
  },
  infoLabel: { fontSize: 11, color: '#7A9686', textTransform: 'uppercase', letterSpacing: 1 },
  infoHz: { fontSize: 32, fontWeight: '800', color: '#EC4899', marginVertical: 4 },
  infoDesc: { fontSize: 12, color: '#3D5445' },

  freqGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  freqChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100,
    borderWidth: 1, borderColor: '#1F2E25', backgroundColor: '#141E18',
  },
  freqChipActive: { borderColor: '#EC4899', backgroundColor: '#EC489918' },
  freqChipText: { fontSize: 13, color: '#7A9686', fontWeight: '600' },
  freqChipTextActive: { color: '#EC4899' },

  progressRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: '#141E18', borderRadius: 16,
    borderWidth: 1, borderColor: '#1F2E25',
    padding: 16, marginBottom: 24,
  },
  progressRing: {
    width: 70, height: 70, borderRadius: 35,
    borderWidth: 3, borderColor: '#7A3B1E',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0A0F1E',
  },
  progressNum: { fontSize: 15, fontWeight: '800', color: '#F4A261' },
  progressSub: { fontSize: 10, color: '#7A9686' },
  progressInfo: { flex: 1 },
  progressTitle: { fontSize: 14, fontWeight: '700', color: '#E8F0EB', marginBottom: 4 },
  progressDesc: { fontSize: 12, color: '#3D5445', lineHeight: 18 },

  startBtn: {
    backgroundColor: '#7A3B1E', borderRadius: 100,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: '#7A3B1E', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 14, elevation: 8,
  },
  startBtnActive: { backgroundColor: '#009678' },
  startBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
