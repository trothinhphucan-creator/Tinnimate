import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, Animated, Easing, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Moon, Sun, Clock, Music, Wind, Play, Pause } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { TinniOrb } from '@/components/TinniOrb';
import { useAudioPlayer } from 'expo-audio';
import { V } from '@/constants/theme';

const { width } = Dimensions.get('window');

const TIMERS = [
  { label: '15 phút', minutes: 15, short: '15m' },
  { label: '30 phút', minutes: 30, short: '30m' },
  { label: '45 phút', minutes: 45, short: '45m' },
  { label: '1 giờ', minutes: 60, short: '1h' },
  { label: '∞', minutes: 0, short: '∞' },
];

const SOUNDS = [
  { id: 'rain', emoji: '🌧️', label: 'Mưa nhẹ', color: '#06B6D4', gradient: ['#164E63', '#06B6D4'] as const, file: require('@/assets/audio/therapy.mp3') },
  { id: 'ocean', emoji: '🌊', label: 'Sóng biển', color: '#0EA5E9', gradient: ['#0C4A6E', '#0EA5E9'] as const, file: require('@/assets/audio/therapy.mp3') },
  { id: 'white', emoji: '〰️', label: 'White Noise', color: '#938F9C', gradient: ['#2C2837', '#484551'] as const, file: require('@/assets/audio/therapy.mp3') },
  { id: 'forest', emoji: '🌲', label: 'Rừng đêm', color: '#16A34A', gradient: ['#14532D', '#16A34A'] as const, file: require('@/assets/audio/therapy.mp3') },
  { id: 'wind', emoji: '🌬️', label: 'Gió núi', color: '#8B5CF6', gradient: ['#4C1D95', '#8B5CF6'] as const, file: require('@/assets/audio/therapy.mp3') },
  { id: 'zen', emoji: '🔔', label: 'Zen bells', color: '#A855F7', gradient: ['#3D2B85', '#A855F7'] as const, file: require('@/assets/audio/therapy.mp3') },
];

const SLEEP_TIPS = [
  { emoji: '🕐', text: 'Đi ngủ và thức dậy cùng giờ mỗi ngày' },
  { emoji: '📵', text: 'Tắt màn hình 30 phút trước khi ngủ' },
  { emoji: '🌡️', text: 'Phòng ngủ mát (18–22°C) giúp ngủ sâu hơn' },
  { emoji: '☕', text: 'Tránh caffeine sau 14:00' },
  { emoji: '🧘', text: 'Thở 4-7-8 giúp hệ thần kinh thư giãn' },
  { emoji: '🔊', text: 'Âm thanh trắng che tiếng ù tai khi ngủ' },
];

export default function SleepScreen() {
  const router = useRouter();
  const [selectedSound, setSelectedSound] = useState(SOUNDS[0]);
  const [selectedTimer, setSelectedTimer] = useState(TIMERS[1]);
  const [playing, setPlaying] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const orbPulse = useRef(new Animated.Value(1)).current;
  const starTwinkle = useRef(new Animated.Value(0.3)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const player = useAudioPlayer(selectedSound.file);

  useEffect(() => {
    // Twinkling stars animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(starTwinkle, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(starTwinkle, { toValue: 0.3, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (playing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(orbPulse, { toValue: 1.06, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(orbPulse, { toValue: 0.94, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
      player.play();
    } else {
      orbPulse.stopAnimation();
      Animated.timing(orbPulse, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      player.pause();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [playing]);

  function togglePlay() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!playing) {
      if (selectedTimer.minutes > 0) {
        setRemaining(selectedTimer.minutes * 60);
        timerRef.current = setInterval(() => {
          setRemaining(r => {
            if (r <= 1) {
              clearInterval(timerRef.current!);
              setPlaying(false);
              return 0;
            }
            return r - 1;
          });
        }, 1000);
      }
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRemaining(0);
    }
    setPlaying(p => !p);
  }

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Gradient Hero ── */}
        <LinearGradient
          colors={['#1a0e3e', '#2d1b69', '#3D2B85', V.bg]}
          locations={[0, 0.2, 0.6, 1]}
          style={styles.heroGradient}
        >
          <SafeAreaView edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                <ChevronLeft size={22} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <Moon size={16} color={V.secondary} />
                <Text style={styles.headerTitle}>Hỗ Trợ Giấc Ngủ</Text>
              </View>
              <View style={{ width: 40 }} />
            </View>

            {/* Orb player area */}
            <View style={styles.orbArea}>
              {/* Decorative star dots */}
              <Animated.View style={[styles.starDot, { top: 20, left: 40, opacity: starTwinkle }]} />
              <Animated.View style={[styles.starDot, { top: 60, right: 50, opacity: starTwinkle, width: 4, height: 4 }]} />
              <Animated.View style={[styles.starDot, { bottom: 40, left: 60, opacity: starTwinkle, width: 3, height: 3 }]} />
              <Animated.View style={[styles.starDot, { top: 80, left: 100, opacity: starTwinkle, width: 2, height: 2 }]} />
              <Animated.View style={[styles.starDot, { bottom: 60, right: 80, opacity: starTwinkle }]} />

              <Animated.View style={{ transform: [{ scale: orbPulse }] }}>
                {/* Glow ring */}
                <View style={styles.orbGlow}>
                  <TinniOrb mode={playing ? 'playing' : 'idle'} size={130} />
                </View>
              </Animated.View>

              {playing && remaining > 0 && (
                <Text style={styles.timerDisplay}>{formatTime(remaining)}</Text>
              )}
              {playing && (
                <Text style={styles.nowPlaying}>{selectedSound.emoji} {selectedSound.label}</Text>
              )}
              {!playing && (
                <Text style={styles.sleepHint}>Chọn âm thanh để bắt đầu</Text>
              )}
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* ── Sound picker (horizontal cards) ── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>ÂM THANH</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.soundRow}>
            {SOUNDS.map(s => (
              <TouchableOpacity
                key={s.id}
                style={[styles.soundCard, selectedSound.id === s.id && styles.soundCardActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedSound(s);
                  if (playing) {
                    player.pause();
                    setTimeout(() => player.play(), 100);
                  }
                }}
              >
                <LinearGradient
                  colors={selectedSound.id === s.id ? [...s.gradient] : [V.surface, V.surface]}
                  style={styles.soundCardGradient}
                >
                  <Text style={styles.soundEmoji}>{s.emoji}</Text>
                  <Text style={[styles.soundLabel, selectedSound.id === s.id && { color: '#fff' }]}>
                    {s.label}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Timer picker ── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>HẸN GIỜ TẮT</Text>
          <View style={styles.timerRow}>
            {TIMERS.map(t => (
              <TouchableOpacity
                key={t.label}
                style={[styles.timerChip, selectedTimer.minutes === t.minutes && styles.timerChipActive]}
                onPress={() => { Haptics.selectionAsync(); setSelectedTimer(t); }}
                disabled={playing}
              >
                <Text style={[styles.timerLabel, selectedTimer.minutes === t.minutes && styles.timerLabelActive]}>
                  {t.short}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Play button ── */}
        <View style={styles.playSection}>
          <TouchableOpacity
            style={styles.playBtnWrap}
            onPress={togglePlay}
            activeOpacity={0.85}
          >
            {playing ? (
              <View style={styles.stopBtn}>
                <Pause size={22} color={V.textMuted} />
                <Text style={styles.stopText}>Dừng</Text>
              </View>
            ) : (
              <LinearGradient
                colors={[V.primary, '#FFA726']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.playBtnGradient}
              >
                <Moon size={20} color={V.primaryDark} />
                <Text style={styles.playText}>Bắt đầu ngủ</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Sleep tips ── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>MẸO NGỦ NGON</Text>
          <View style={styles.tipsGrid}>
            {SLEEP_TIPS.map((tip, i) => (
              <View key={i} style={styles.tipCard}>
                <Text style={styles.tipEmoji}>{tip.emoji}</Text>
                <Text style={styles.tipText}>{tip.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: V.bg },
  scroll: { paddingBottom: 40 },

  // ── Hero ──
  heroGradient: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },

  // ── Orb ──
  orbArea: { alignItems: 'center', paddingVertical: 32, position: 'relative' },
  orbGlow: {
    padding: 16,
    borderRadius: 100,
    backgroundColor: 'rgba(91,75,196,0.15)',
  },
  starDot: {
    position: 'absolute', width: 3, height: 3, borderRadius: 3,
    backgroundColor: '#C7BFFF',
  },
  timerDisplay: { fontSize: 42, fontWeight: '200', color: V.secondary, marginTop: 20, letterSpacing: 6 },
  nowPlaying: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 8 },
  sleepHint: { fontSize: 13, color: V.textMuted, marginTop: 16 },

  // ── Sections ──
  sectionWrap: { paddingHorizontal: 20, marginTop: 24 },
  sectionLabel: {
    fontSize: 11, color: V.textMuted, fontWeight: '700',
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12,
  },

  // ── Sound Cards ──
  soundRow: { gap: 10, paddingBottom: 4 },
  soundCard: {
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'transparent',
  },
  soundCardActive: {
    borderColor: 'rgba(199,191,255,0.3)',
  },
  soundCardGradient: {
    alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 14, minWidth: 90,
    borderRadius: 14,
  },
  soundEmoji: { fontSize: 24 },
  soundLabel: { fontSize: 11, fontWeight: '600', color: V.textMuted },

  // ── Timer ──
  timerRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  timerChip: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 100,
    borderWidth: 1, borderColor: V.outlineVariant + '30',
    backgroundColor: V.surface,
  },
  timerChipActive: { backgroundColor: V.secondaryContainer, borderColor: V.secondaryContainer },
  timerLabel: { fontSize: 14, color: V.textMuted, fontWeight: '600' },
  timerLabelActive: { color: '#fff' },

  // ── Play Button ──
  playSection: { paddingHorizontal: 20, marginTop: 28 },
  playBtnWrap: {
    borderRadius: 100, overflow: 'hidden',
    shadowColor: V.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
  },
  playBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 18, borderRadius: 100,
  },
  playText: { fontSize: 16, fontWeight: '700', color: V.primaryDark },
  stopBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 18, backgroundColor: V.surfaceHigh, borderRadius: 100,
    borderWidth: 1, borderColor: V.outlineVariant + '30',
  },
  stopText: { fontSize: 16, fontWeight: '700', color: V.textMuted },

  // ── Tips ──
  tipsGrid: { gap: 8 },
  tipCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: V.surface, borderRadius: 14,
    borderWidth: 1, borderColor: V.outlineVariant + '20',
    padding: 14,
  },
  tipEmoji: { fontSize: 18 },
  tipText: { flex: 1, fontSize: 13, color: V.textSecondary, lineHeight: 20 },
});
