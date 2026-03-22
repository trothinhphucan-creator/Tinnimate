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

  function handlePreset(preset: typeof PRESETS[0]) {
    setActivePreset(preset.id);
    setFreq(preset.freq);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  function togglePlay() {
    setIsPlaying(p => !p);
    Haptics.notificationAsync(
      isPlaying ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#94A3B8" />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', paddingHorizontal: 24 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 8, paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: '#E0E7FF', textAlign: 'center' },
  titleSub: { fontSize: 11, color: '#475569', textAlign: 'center' },

  center: {
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  meterContainer: { alignItems: 'center', justifyContent: 'center' },
  freqOverlay: {
    position: 'absolute', alignItems: 'center',
  },
  freqHz: { fontSize: 34, fontWeight: '900', color: '#E0E7FF' },
  freqUnit: { fontSize: 12, color: '#64748B', marginTop: -4 },

  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 11, color: '#334155', fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10,
  },

  sliderWrap: { gap: 6 },
  sliderTrack: { height: 40, justifyContent: 'center' },
  sliderFill: {
    height: 6, backgroundColor: '#1E293B', borderRadius: 3,
    overflow: 'hidden',
  },
  sliderFillInner: {
    height: '100%', backgroundColor: '#6366F1', borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute', width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#818CF8',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 8, elevation: 6,
    top: 8,
  },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabelText: { fontSize: 10, color: '#334155' },
  freqCurrent: {
    fontSize: 13, color: '#818CF8', fontWeight: '700',
    textAlign: 'center', marginTop: 4,
  },

  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  presetCard: {
    width: (width - 48 - 8) / 2,
    backgroundColor: '#0F172A', borderRadius: 14,
    borderWidth: 1, borderColor: '#1E293B',
    padding: 12,
  },
  presetCardActive: { borderColor: '#6366F1', backgroundColor: '#6366F118' },
  presetLabel: { fontSize: 13, fontWeight: '700', color: '#CBD5E1', marginBottom: 2 },
  presetDesc: { fontSize: 10, color: '#475569' },

  playBtn: {
    backgroundColor: '#4F46E5', borderRadius: 100, paddingVertical: 16,
    alignItems: 'center', marginBottom: 24,
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 14, elevation: 8,
  },
  playBtnActive: { backgroundColor: '#7C3AED', shadowColor: '#7C3AED' },
  playBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
