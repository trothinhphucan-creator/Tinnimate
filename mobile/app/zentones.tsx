import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  Dimensions, Modal, Switch, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { ChevronLeft, Play, Square, Volume2, Crown, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FractalToneEngine, ZEN_STYLES } from '@/lib/audio/fractal-engine';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '@/store/use-user-store';
import { V } from '@/constants/theme';

const { width } = Dimensions.get('window');

// ─── Squircle icon size ───
const ICON_SIZE = (width - 20 * 2 - 8 * 4) / 5;

// ─── Style colors for squircle tints ───
const STYLE_COLORS = [
  '#0ea5e9', '#a78bfa', '#ec4899', '#f59e0b', '#6366f1',
  '#22c55e', '#67e8f9', '#d97706', '#f472b6', '#34d399',
];

// ─── Animated waveform bars ───
function WaveformBars({ isPlaying, color }: { isPlaying: boolean; color: string }) {
  const bars = [0.4, 0.8, 0.55, 1.0, 0.65, 0.45, 0.85, 0.7];
  const anims = useRef(bars.map(h => new Animated.Value(h))).current;

  useEffect(() => {
    if (!isPlaying) {
      anims.forEach((a, i) => {
        Animated.timing(a, { toValue: bars[i], duration: 300, useNativeDriver: false }).start();
      });
      return;
    }
    const loops = anims.map((a, i) => {
      const dur = 350 + i * 80;
      return Animated.loop(
        Animated.sequence([
          Animated.timing(a, { toValue: Math.random() * 0.6 + 0.3, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
          Animated.timing(a, { toValue: Math.random() * 0.4 + 0.6, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        ])
      );
    });
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, [isPlaying]);

  return (
    <View style={wavStyles.container}>
      {anims.map((a, i) => (
        <Animated.View
          key={i}
          style={[
            wavStyles.bar,
            {
              backgroundColor: color,
              height: a.interpolate({ inputRange: [0, 1], outputRange: [4, 28] }),
            },
          ]}
        />
      ))}
    </View>
  );
}

const wavStyles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    gap: 3, height: 32, marginTop: 12,
  },
  bar: { width: 3, borderRadius: 2 },
});

// ─── Pulsing ring (for play button orbit) ───
function PulsingRing({ isPlaying }: { isPlaying: boolean }) {
  const scale1 = useRef(new Animated.Value(1)).current;
  const scale2 = useRef(new Animated.Value(1)).current;
  const opacity1 = useRef(new Animated.Value(0.3)).current;
  const opacity2 = useRef(new Animated.Value(0.15)).current;

  useEffect(() => {
    if (!isPlaying) {
      Animated.timing(scale1, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      Animated.timing(opacity1, { toValue: 0.3, duration: 300, useNativeDriver: true }).start();
      return;
    }
    const pulse = (scaleAnim: Animated.Value, opacityAnim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scaleAnim, { toValue: 1.5, duration: 1200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scaleAnim, { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0.3, duration: 0, useNativeDriver: true }),
          ]),
        ])
      );
    const l1 = pulse(scale1, opacity1, 0);
    const l2 = pulse(scale2, opacity2, 600);
    l1.start(); l2.start();
    return () => { l1.stop(); l2.stop(); };
  }, [isPlaying]);

  return (
    <View style={ringStyles.container} pointerEvents="none">
      <Animated.View style={[ringStyles.ring, { transform: [{ scale: scale1 }], opacity: opacity1 }]} />
      <Animated.View style={[ringStyles.ring, { transform: [{ scale: scale2 }], opacity: opacity2, borderColor: 'rgba(251,188,0,0.2)' }]} />
    </View>
  );
}

const ringStyles = StyleSheet.create({
  container: {
    position: 'absolute', alignItems: 'center', justifyContent: 'center',
    width: 80, height: 80,
  },
  ring: {
    position: 'absolute',
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 1.5, borderColor: 'rgba(199,191,255,0.3)',
  },
});

// Trial limits
const TRIAL_LIMITS: Record<string, number> = {
  free: 0, premium: 0, pro: 0, ultra: Infinity,
};
const STORAGE_KEY = 'zentones_trials';

export default function ZentonesScreen() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [hapticOn, setHapticOn] = useState(true);
  const [trialCount, setTrialCount] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const router = useRouter();
  const engineRef = useRef<FractalToneEngine | null>(null);

  const { user } = useUserStore();
  const tier = (user?.subscription_tier ?? 'free') as 'free' | 'premium' | 'pro' | 'ultra';
  const maxTrials = TRIAL_LIMITS[tier] ?? 0;
  const trialsRemaining = maxTrials === Infinity ? Infinity : Math.max(0, maxTrials - trialCount);
  const canPlay = trialsRemaining > 0 || maxTrials === Infinity;

  const selected = ZEN_STYLES[selectedIdx];
  const selectedColor = STYLE_COLORS[selectedIdx] ?? V.secondary;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      setTrialCount(parseInt(val ?? '0', 10));
    });
  }, []);

  const getEngine = () => {
    if (!engineRef.current) engineRef.current = new FractalToneEngine();
    return engineRef.current;
  };

  const handlePlay = async () => {
    const engine = getEngine();
    if (isPlaying) {
      await engine.stop();
      setIsPlaying(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      if (!canPlay) { setShowUpgrade(true); return; }
      const newCount = trialCount + 1;
      setTrialCount(newCount);
      await AsyncStorage.setItem(STORAGE_KEY, String(newCount));
      await engine.start(selected, volume);
      setIsPlaying(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleStyleChange = async (idx: number) => {
    setSelectedIdx(idx);
    if (isPlaying) {
      const engine = getEngine();
      await engine.stop();
      await engine.start(ZEN_STYLES[idx], volume);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    engineRef.current?.setVolume(val);
  };

  const toggleHaptic = (val: boolean) => {
    setHapticOn(val);
    engineRef.current?.setHapticEnabled(val);
  };

  useEffect(() => {
    return () => { engineRef.current?.stop(); };
  }, []);

  return (
    <View style={styles.root}>
      {/* ─── Upgrade Modal ─── */}
      <Modal visible={showUpgrade} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowUpgrade(false)}>
              <X size={20} color={V.textMuted} />
            </TouchableOpacity>
            <View style={styles.crownWrap}>
              <Crown size={26} color={V.primary} />
            </View>
            <Text style={styles.modalTitle}>Zentones Ultra</Text>
            <Text style={styles.modalDesc}>
              Tính năng độc quyền gói Ultra. Nâng cấp để mở khóa không giới hạn.
            </Text>
            <TouchableOpacity
              style={styles.upgradeBtn}
              onPress={() => { setShowUpgrade(false); router.push('/pricing' as any); }}>
              <Text style={styles.upgradeBtnText}>✨ Xem bảng giá</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* ─── Header ─── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={22} color={V.textSecondary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Zentones</Text>
            <Text style={styles.headerSub}>Giai điệu fractal trị liệu</Text>
          </View>
          {/* ULTRA badge */}
          <View style={styles.ultraBadge}>
            <Text style={styles.ultraText}>ULTRA</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* ─── HERO NOW PLAYING ─── */}
          <View style={styles.heroWrap}>
            {/* Background gradient layers */}
            <LinearGradient
              colors={['#2A1F6E', '#1E1640', '#0D1410']}
              locations={[0, 0.55, 1]}
              style={StyleSheet.absoluteFill}
            />
            {/* Decorative bokeh rings */}
            <View style={[styles.bokehRing, { width: 260, height: 260, top: -20, right: -40, borderColor: 'rgba(199,191,255,0.04)' }]} />
            <View style={[styles.bokehRing, { width: 180, height: 180, top: 30, right: 20, borderColor: 'rgba(199,191,255,0.06)' }]} />
            <View style={[styles.bokehRing, { width: 320, height: 320, top: -60, left: -60, borderColor: 'rgba(69,51,173,0.15)' }]} />

            {/* Content */}
            <View style={styles.heroContent}>
              {/* Style name */}
              <Text style={styles.heroName}>{selected.nameVi}</Text>
              <Text style={styles.heroDesc}>{selected.descriptionVi}</Text>

              {/* Waveform */}
              <WaveformBars isPlaying={isPlaying} color={selectedColor} />

              {/* Play button with rings */}
              <View style={styles.playArea}>
                <PulsingRing isPlaying={isPlaying} />
                <TouchableOpacity
                  style={styles.playBtn}
                  onPress={handlePlay}
                  activeOpacity={0.85}>
                  {isPlaying ? (
                    <Square size={22} color="#271B00" fill="#271B00" />
                  ) : (
                    <Play size={22} color="#271B00" fill="#271B00" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Meta pills */}
              <View style={styles.metaRow}>
                <View style={styles.metaPill}>
                  <Text style={styles.metaText}>♩ {Math.round(1000 / selected.tempoMs * 60)} bpm</Text>
                </View>
                {hapticOn && (
                  <View style={styles.metaPill}>
                    <Text style={styles.metaText}>📳 {selected.hapticPattern.toUpperCase()}</Text>
                  </View>
                )}
                {isPlaying && (
                  <View style={[styles.metaPill, { backgroundColor: 'rgba(199,191,255,0.08)', borderColor: selectedColor + '40' }]}>
                    <Text style={[styles.metaText, { color: selectedColor }]}>● LIVE</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* ─── Style Selector ─── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PHONG CÁCH</Text>
            <View style={styles.iconGrid}>
              {ZEN_STYLES.map((style, idx) => {
                const color = STYLE_COLORS[idx];
                const isActive = idx === selectedIdx;
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleStyleChange(idx)}
                    activeOpacity={0.75}
                    style={styles.iconWrap}
                  >
                    {/* Squircle */}
                    <View style={[
                      styles.squircle,
                      isActive && { borderColor: color + '80', borderWidth: 1.5, backgroundColor: color + '18' },
                    ]}>
                      {/* Tint layer */}
                      {!isActive && (
                        <View style={[StyleSheet.absoluteFill, styles.squircleTint, { backgroundColor: color + '12' }]} />
                      )}
                      <Text style={styles.squircleEmoji}>{style.emoji}</Text>
                    </View>
                    <Text
                      style={[styles.squircleLabel, isActive && { color: color }]}
                      numberOfLines={1}
                    >
                      {style.nameVi.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ─── Volume ─── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ÂM LƯỢNG — {Math.round(volume * 100)}%</Text>
            <View style={styles.sliderRow}>
              <Volume2 size={14} color={V.textMuted} />
              <Slider
                style={{ flex: 1, height: 36 }}
                minimumValue={0}
                maximumValue={1}
                value={volume}
                onValueChange={handleVolumeChange}
                minimumTrackTintColor={V.secondary}
                maximumTrackTintColor={V.surfaceHigh}
                thumbTintColor={V.secondary}
              />
            </View>
          </View>

          {/* ─── Haptic toggle ─── */}
          <View style={styles.hapticRow}>
            <Text style={styles.hapticLabel}>📳  Nhịp rung haptic</Text>
            <Text style={styles.hapticSub}>
              {hapticOn ? `${selected.hapticPattern.toUpperCase()} · đồng bộ với nốt nhạc` : 'tắt'}
            </Text>
            <Switch
              value={hapticOn}
              onValueChange={toggleHaptic}
              trackColor={{ false: V.surfaceHigh, true: V.secondary + '50' }}
              thumbColor={hapticOn ? V.secondary : V.textMuted}
            />
          </View>

          {/* ─── Info ─── */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>💡 Zentones hoạt động thế nào</Text>
            {[
              { icon: '🎶', text: 'Thuật toán fractal tạo giai điệu như chuông gió — mỗi lần phát đều khác nhau' },
              { icon: '🧠', text: 'Não bạn lắng nghe thụ động, dần hình thành thói quen không chú ý đến tiếng ù' },
              { icon: '✨', text: 'Sau 4–8 tuần sử dụng đều, cường độ cảm nhận ù tai giảm rõ rệt' },
            ].map((item, i) => (
              <View key={i} style={styles.infoRow}>
                <Text style={{ fontSize: 13 }}>{item.icon}</Text>
                <Text style={styles.infoText}>{item.text}</Text>
              </View>
            ))}
            <View style={styles.badgeRow}>
              {[{ e: '🔬', l: 'Có nghiên cứu' }, { e: '♾️', l: 'Không lặp lại' }, { e: '🎵', l: '10 phong cách' }].map(b => (
                <View key={b.e} style={styles.badge}>
                  <Text style={{ fontSize: 16 }}>{b.e}</Text>
                  <Text style={styles.badgeLabel}>{b.l}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: V.bg },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 8, gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 13,
    backgroundColor: V.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: V.textPrimary, letterSpacing: -0.3 },
  headerSub: { fontSize: 11, color: V.textMuted, marginTop: 1 },
  ultraBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100,
    backgroundColor: V.primary + '18',
    borderWidth: 1, borderColor: V.primary + '40',
  },
  ultraText: { fontSize: 10, fontWeight: '800', color: V.primary, letterSpacing: 1.2 },

  // ── Scroll ──
  scroll: { paddingBottom: 40 },

  // ── Hero ──
  heroWrap: {
    marginHorizontal: 16, borderRadius: 24,
    overflow: 'hidden', marginBottom: 24,
  },
  heroContent: {
    paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24,
    alignItems: 'center',
  },
  heroName: {
    fontSize: 26, fontWeight: '800', color: V.textPrimary,
    letterSpacing: -0.5, textAlign: 'center',
  },
  heroDesc: {
    fontSize: 12, color: V.textMuted, textAlign: 'center',
    marginTop: 6, maxWidth: 240, lineHeight: 18,
  },

  // ── Play ──
  playArea: {
    marginTop: 24, marginBottom: 20,
    alignItems: 'center', justifyContent: 'center',
    width: 80, height: 80,
  },
  playBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: V.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: V.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 24, elevation: 12,
  },

  // ── Meta pills ──
  metaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  metaPill: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  metaText: { fontSize: 11, color: V.textMuted, fontWeight: '600' },

  // ── Bokeh ──
  bokehRing: {
    position: 'absolute', borderRadius: 999,
    borderWidth: 1,
  },

  // ── Section ──
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionLabel: {
    fontSize: 10, color: V.textMuted, fontWeight: '700',
    letterSpacing: 1.5, marginBottom: 14,
  },

  // ── Squircle grid ──
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconWrap: { width: ICON_SIZE, alignItems: 'center', gap: 6 },
  squircle: {
    width: ICON_SIZE, height: ICON_SIZE, borderRadius: 18,
    backgroundColor: V.surface,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1, borderColor: V.surfaceHigh,
  },
  squircleTint: { borderRadius: 18 },
  squircleEmoji: { fontSize: 26 },
  squircleLabel: {
    fontSize: 9, color: V.textMuted, fontWeight: '600',
    textAlign: 'center', letterSpacing: 0.3,
  },

  // ── Volume ──
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  // ── Haptic ──
  hapticRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 20,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: V.surface, borderRadius: 16,
    borderWidth: 1, borderColor: V.surfaceHigh,
  },
  hapticLabel: { fontSize: 14, color: V.textPrimary, fontWeight: '600', marginRight: 6 },
  hapticSub: { flex: 1, fontSize: 10, color: V.textMuted },

  // ── Info ──
  infoCard: {
    marginHorizontal: 16, padding: 16,
    backgroundColor: V.surface, borderRadius: 18,
    borderWidth: 1, borderColor: V.surfaceHigh,
  },
  infoTitle: { fontSize: 13, fontWeight: '700', color: V.textPrimary, marginBottom: 14 },
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: 12, color: V.textMuted, lineHeight: 18 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  badge: {
    flex: 1, padding: 10, borderRadius: 12,
    backgroundColor: V.surfaceHigh, alignItems: 'center', gap: 4,
  },
  badgeLabel: { fontSize: 9, color: V.textMuted, textAlign: 'center' },

  // ── Modal ──
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  modal: {
    width: '100%', maxWidth: 360, backgroundColor: V.surface,
    borderRadius: 24, padding: 24, borderWidth: 1, borderColor: V.surfaceHigh,
  },
  modalClose: {
    position: 'absolute', top: 16, right: 16,
    width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
  },
  crownWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: V.primary + '20',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: V.primary + '40',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: V.textPrimary, textAlign: 'center', marginBottom: 8 },
  modalDesc: { fontSize: 13, color: V.textMuted, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  upgradeBtn: {
    paddingVertical: 14, borderRadius: 100, backgroundColor: V.primary,
    alignItems: 'center',
    shadowColor: V.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  upgradeBtnText: { fontSize: 14, fontWeight: '700', color: '#271B00' },
});
