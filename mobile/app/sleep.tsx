import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, Animated, Easing, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Moon, Sun, Clock, Music, Wind } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { TinniOrb } from '@/components/TinniOrb';
import { useAudioPlayer } from 'expo-audio';

const { width } = Dimensions.get('window');

const TIMERS = [
  { label: '15 phút', minutes: 15 },
  { label: '30 phút', minutes: 30 },
  { label: '45 phút', minutes: 45 },
  { label: '1 giờ',   minutes: 60 },
  { label: '∞',       minutes: 0  },
];

const SOUNDS = [
  { id: 'rain',    emoji: '🌧️', label: 'Mưa nhẹ',    color: '#06B6D4', file: require('@/assets/audio/therapy.mp3') },
  { id: 'ocean',   emoji: '🌊', label: 'Sóng biển',   color: '#0EA5E9', file: require('@/assets/audio/therapy.mp3') },
  { id: 'white',   emoji: '⬜', label: 'White Noise',  color: '#94A3B8', file: require('@/assets/audio/therapy.mp3') },
  { id: 'forest',  emoji: '🌲', label: 'Rừng đêm',    color: '#16A34A', file: require('@/assets/audio/therapy.mp3') },
  { id: 'wind',    emoji: '🌬️', label: 'Gió núi',     color: '#8B5CF6', file: require('@/assets/audio/therapy.mp3') },
  { id: 'zen',     emoji: '🔔', label: 'Zen bells',   color: '#A855F7', file: require('@/assets/audio/therapy.mp3') },
];

const SLEEP_TIPS = [
  '🕐 Đi ngủ và thức dậy cùng giờ mỗi ngày',
  '📵 Tắt màn hình 30 phút trước khi ngủ',
  '🌡️ Phòng ngủ mát (18–22°C) giúp ngủ sâu hơn',
  '☕ Tránh caffeine sau 14:00',
  '🧘 Thở 4-7-8 giúp hệ thần kinh thư giãn',
  '🔊 Âm thanh trắng che tiếng ù tai khi ngủ',
];

export default function SleepScreen() {
  const router = useRouter();
  const [selectedSound, setSelectedSound] = useState(SOUNDS[0]);
  const [selectedTimer, setSelectedTimer] = useState(TIMERS[1]);
  const [playing, setPlaying] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const orbPulse = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const player = useAudioPlayer(selectedSound.file);

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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#94A3B8" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hỗ Trợ Giấc Ngủ</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Orb player */}
        <View style={styles.orbArea}>
          <Animated.View style={{ transform: [{ scale: orbPulse }] }}>
            <TinniOrb mode={playing ? 'playing' : 'idle'} size={130} />
          </Animated.View>
          {playing && remaining > 0 && (
            <Text style={styles.timerDisplay}>{formatTime(remaining)}</Text>
          )}
          {playing && (
            <Text style={styles.nowPlaying}>{selectedSound.emoji} {selectedSound.label}</Text>
          )}
        </View>

        {/* Sound picker */}
        <Text style={styles.sectionLabel}>Âm thanh</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.soundRow}>
          {SOUNDS.map(s => (
            <TouchableOpacity
              key={s.id}
              style={[styles.soundChip, selectedSound.id === s.id && { borderColor: s.color, backgroundColor: s.color + '15' }]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedSound(s);
                if (playing) {
                  player.pause();
                  setTimeout(() => player.play(), 100);
                }
              }}>
              <Text style={{ fontSize: 20 }}>{s.emoji}</Text>
              <Text style={[styles.soundLabel, selectedSound.id === s.id && { color: s.color }]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Timer picker */}
        <Text style={styles.sectionLabel}>Hẹn giờ tắt</Text>
        <View style={styles.timerRow}>
          {TIMERS.map(t => (
            <TouchableOpacity
              key={t.label}
              style={[styles.timerChip, selectedTimer.minutes === t.minutes && styles.timerChipActive]}
              onPress={() => { Haptics.selectionAsync(); setSelectedTimer(t); }}
              disabled={playing}>
              <Text style={[styles.timerLabel, selectedTimer.minutes === t.minutes && styles.timerLabelActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Play button */}
        <TouchableOpacity
          style={[styles.playBtn, playing && { backgroundColor: '#1E293B', borderColor: '#334155' }]}
          onPress={togglePlay}
          activeOpacity={0.85}>
          {playing
            ? <><Moon size={20} color="#94A3B8" /><Text style={[styles.playText, { color: '#64748B' }]}>Dừng</Text></>
            : <><Sun size={20} color="#0F172A" /><Text style={styles.playText}>Bắt đầu ngủ</Text></>
          }
        </TouchableOpacity>

        {/* Sleep tips */}
        <Text style={styles.sectionLabel}>Mẹo ngủ ngon</Text>
        <View style={styles.tipsGrid}>
          {SLEEP_TIPS.map((tip, i) => (
            <View key={i} style={styles.tipCard}>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#E0E7FF' },

  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  orbArea: { alignItems: 'center', paddingVertical: 24 },
  timerDisplay: { fontSize: 40, fontWeight: '200', color: '#C7D2FE', marginTop: 16, letterSpacing: 4 },
  nowPlaying: { fontSize: 14, color: '#475569', marginTop: 8 },

  sectionLabel: { fontSize: 11, color: '#334155', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },

  soundRow: { gap: 10, paddingBottom: 4, marginBottom: 24 },
  soundChip: {
    alignItems: 'center', gap: 6,
    backgroundColor: '#0F172A', borderRadius: 14, borderWidth: 1.5, borderColor: '#1E293B',
    paddingHorizontal: 14, paddingVertical: 10, minWidth: 80,
  },
  soundLabel: { fontSize: 11, fontWeight: '600', color: '#475569' },

  timerRow: { flexDirection: 'row', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
  timerChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100,
    borderWidth: 1, borderColor: '#1E293B', backgroundColor: '#0F172A',
  },
  timerChipActive: { backgroundColor: '#1E293B', borderColor: '#4F46E5' },
  timerLabel: { fontSize: 13, color: '#475569', fontWeight: '600' },
  timerLabelActive: { color: '#818CF8' },

  playBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#C7D2FE', borderRadius: 100, paddingVertical: 18,
    marginBottom: 28,
    shadowColor: '#818CF8', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  playText: { fontSize: 16, fontWeight: '700', color: '#0F172A' },

  tipsGrid: { gap: 8 },
  tipCard: {
    backgroundColor: '#0F172A', borderRadius: 14, borderWidth: 1, borderColor: '#1E293B',
    padding: 14,
  },
  tipText: { fontSize: 13, color: '#64748B', lineHeight: 20 },
});
