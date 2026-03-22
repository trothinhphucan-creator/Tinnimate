import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  Dimensions, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#94A3B8" />
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
        onPress={() => { setIsActive(!isActive); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }}
        activeOpacity={0.85}>
        <Text style={styles.startBtnText}>
          {isActive ? '⏸ Dừng liệu trình' : '▶ Bắt đầu liệu trình'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', paddingHorizontal: 24 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 8, paddingBottom: 16,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#E0E7FF' },

  waveContainer: {
    height: 180, width: width - 48,
    backgroundColor: '#0A0F1E',
    borderRadius: 20, borderWidth: 1, borderColor: '#1E293B',
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
    fontSize: 12, color: '#475569', fontWeight: '600',
  },

  infoCard: {
    alignItems: 'center', paddingVertical: 16,
    backgroundColor: '#0F172A', borderRadius: 16,
    borderWidth: 1, borderColor: '#1E293B', marginBottom: 20,
  },
  infoLabel: { fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: 1 },
  infoHz: { fontSize: 32, fontWeight: '800', color: '#EC4899', marginVertical: 4 },
  infoDesc: { fontSize: 12, color: '#64748B' },

  freqGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  freqChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100,
    borderWidth: 1, borderColor: '#1E293B', backgroundColor: '#0F172A',
  },
  freqChipActive: { borderColor: '#EC4899', backgroundColor: '#EC489918' },
  freqChipText: { fontSize: 13, color: '#475569', fontWeight: '600' },
  freqChipTextActive: { color: '#EC4899' },

  progressRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: '#0F172A', borderRadius: 16,
    borderWidth: 1, borderColor: '#1E293B',
    padding: 16, marginBottom: 24,
  },
  progressRing: {
    width: 70, height: 70, borderRadius: 35,
    borderWidth: 3, borderColor: '#4F46E5',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0A0F1E',
  },
  progressNum: { fontSize: 15, fontWeight: '800', color: '#818CF8' },
  progressSub: { fontSize: 10, color: '#475569' },
  progressInfo: { flex: 1 },
  progressTitle: { fontSize: 14, fontWeight: '700', color: '#E0E7FF', marginBottom: 4 },
  progressDesc: { fontSize: 12, color: '#64748B', lineHeight: 18 },

  startBtn: {
    backgroundColor: '#4F46E5', borderRadius: 100,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 14, elevation: 8,
  },
  startBtnActive: { backgroundColor: '#7C3AED' },
  startBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
