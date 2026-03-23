import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, TouchableOpacity, Text, View,
  Dimensions, ScrollView, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import {
  Shuffle, SkipBack, Play, Pause, SkipForward, Repeat,
  ChevronLeft,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { TinniOrb } from '@/components/TinniOrb';
import { useRouter } from 'expo-router';
import { useLangStore } from '@/store/use-lang-store';

const { width, height } = Dimensions.get('window');

const TRACKS = [
  { id: 'rain',     name: 'Mưa',   nameEn: 'Rain',   fullName: 'Tiếng Mưa',   fullNameEn: 'Rain Sounds',   emoji: '🌧️', color: '#06B6D4', free: true,  file: require('@/assets/audio/rain.mp3')     },
  { id: 'ocean',    name: 'Sóng',  nameEn: 'Ocean',  fullName: 'Sóng Biển',   fullNameEn: 'Ocean Waves',   emoji: '🌊', color: '#0EA5E9', free: true,  file: require('@/assets/audio/ocean.mp3')    },
  { id: 'white',    name: 'White', nameEn: 'White',  fullName: 'Ồn Trắng',    fullNameEn: 'White Noise',   emoji: '⬜', color: '#94A3B8', free: true,  file: require('@/assets/audio/white.mp3')    },
  { id: 'pink',     name: 'Pink',  nameEn: 'Pink',   fullName: 'Ồn Hồng',     fullNameEn: 'Pink Noise',    emoji: '🌸', color: '#EC4899', free: true,  file: require('@/assets/audio/pink.mp3')     },
  { id: 'brown',    name: 'Brown', nameEn: 'Brown',  fullName: 'Ồn Nâu',      fullNameEn: 'Brown Noise',   emoji: '🟤', color: '#92400E', free: true,  file: require('@/assets/audio/brown.mp3')    },
  { id: 'forest',   name: 'Rừng',  nameEn: 'Forest', fullName: 'Rừng Đêm',    fullNameEn: 'Forest Night',  emoji: '🌲', color: '#16A34A', free: false, file: require('@/assets/audio/forest.mp3')   },
  { id: 'campfire', name: 'Lửa',   nameEn: 'Fire',   fullName: 'Lửa Trại',    fullNameEn: 'Campfire',      emoji: '🔥', color: '#F97316', free: false, file: require('@/assets/audio/campfire.mp3') },
  { id: 'birds',    name: 'Chim',  nameEn: 'Birds',  fullName: 'Tiếng Chim',  fullNameEn: 'Bird Songs',    emoji: '🐦', color: '#84CC16', free: false, file: require('@/assets/audio/birds.mp3')    },
  { id: 'zen',      name: 'Zen',   nameEn: 'Zen',    fullName: 'Zen Bells',   fullNameEn: 'Zen Bells',     emoji: '🔔', color: '#A855F7', free: false, file: require('@/assets/audio/zen.mp3')      },
  { id: '528hz',    name: '528Hz', nameEn: '528Hz',  fullName: 'Tone 528Hz',  fullNameEn: 'Tone 528Hz',    emoji: '✨', color: '#6366F1', free: false, file: require('@/assets/audio/528hz.mp3')    },
];

// Radial bar waveform (circular, animated when playing)
const BAR_COUNT = 48;
const BAR_RADIUS = 118;
const MAX_BAR_H = 22;
const BAR_W = 2.5;

function RadialBarWaveform({ isPlaying, color }: { isPlaying: boolean; color: string }) {
  const barAnims = useRef<Animated.Value[]>(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(2))
  ).current;

  useEffect(() => {
    const loops: Animated.CompositeAnimation[] = [];
    if (isPlaying) {
      barAnims.forEach((anim, i) => {
        const dur = 280 + (i % 7) * 50;
        const delay = (i / BAR_COUNT) * 600;
        const loop = Animated.loop(Animated.sequence([
          Animated.delay(delay % 600),
          Animated.timing(anim, { toValue: 4 + Math.random() * MAX_BAR_H, duration: dur, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
          Animated.timing(anim, { toValue: 2 + Math.random() * 4, duration: dur, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        ]));
        loop.start();
        loops.push(loop);
      });
    } else {
      barAnims.forEach(a => Animated.timing(a, { toValue: 2, duration: 800, useNativeDriver: false }).start());
    }
    return () => loops.forEach(l => l.stop());
  }, [isPlaying]);

  const sz = (BAR_RADIUS + MAX_BAR_H + 4) * 2;
  const c = sz / 2;

  return (
    <View style={{ width: sz, height: sz }} pointerEvents="none">
      {barAnims.map((anim, i) => {
        const angle = (i / BAR_COUNT) * 2 * Math.PI - Math.PI / 2;
        const cx = c + Math.cos(angle) * BAR_RADIUS;
        const cy = c + Math.sin(angle) * BAR_RADIUS;
        const rotateDeg = (angle * 180) / Math.PI + 90;
        return (
          <Animated.View key={i} style={{
            position: 'absolute', width: BAR_W,
            left: cx - BAR_W / 2, top: cy - MAX_BAR_H / 2,
            height: anim, borderRadius: BAR_W / 2,
            backgroundColor: color,
            opacity: isPlaying
              ? anim.interpolate({ inputRange: [2, MAX_BAR_H], outputRange: [0.2, 0.85] })
              : 0.1,
            transform: [{ rotate: `${rotateDeg}deg` }],
          }} />
        );
      })}
    </View>
  );
}

export default function TherapyScreen() {
  const router = useRouter();
  const { lang } = useLangStore();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isRepeat, setIsRepeat] = useState(true);
  const [isShuffle, setIsShuffle] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const track = TRACKS[selectedIdx];
  const player = useAudioPlayer(track.file);
  const ORB_SIZE = 200;

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'mixWithOthers' });
  }, []);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (isPlaying) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying]);

  // Progress bar animation (loops for ambient tracks)
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.timing(progressAnim, {
          toValue: 1, duration: 60000, easing: Easing.linear, useNativeDriver: false,
        })
      ).start();
    } else {
      progressAnim.stopAnimation();
    }
  }, [isPlaying]);

  function playTrack(idx: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const t = TRACKS[idx];
    setSelectedIdx(idx);
    setElapsed(0);
    player.replace(t.file);
    player.loop = true;
    player.play();
    setIsPlaying(true);
    progressAnim.setValue(0);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function togglePlay() {
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      player.loop = true;
      player.play();
      setIsPlaying(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }

  function prevTrack() {
    Haptics.selectionAsync();
    const idx = (selectedIdx - 1 + TRACKS.length) % TRACKS.length;
    playTrack(idx);
  }

  function nextTrack() {
    Haptics.selectionAsync();
    const idx = isShuffle
      ? Math.floor(Math.random() * TRACKS.length)
      : (selectedIdx + 1) % TRACKS.length;
    playTrack(idx);
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    return `${m.toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1], outputRange: ['0%', '100%'],
  });

  const displayName = lang === 'vi' ? track.fullName : track.fullNameEn;
  const subtitle = lang === 'vi' ? 'Âm thanh trị liệu' : 'Sound Therapy';

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#E0E7FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{lang === 'vi' ? 'Âm thanh trị liệu' : 'Sound Therapy'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Orb Stage */}
      <View style={styles.stage}>
        {/* Waveform behind orb */}
        <View style={[StyleSheet.absoluteFill, styles.waveContainer]} pointerEvents="none">
          <RadialBarWaveform isPlaying={isPlaying} color={track.color} />
        </View>
        {/* Aurora Orb */}
        <TinniOrb mode={isPlaying ? 'playing' : 'idle'} size={ORB_SIZE} />
      </View>

      {/* Track Info */}
      <View style={styles.trackInfo}>
        <Text style={styles.trackName}>{displayName}</Text>
        <Text style={styles.trackSubtitle}>{track.emoji} {subtitle}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressTime}>{formatTime(elapsed)}</Text>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              { width: progressWidth, backgroundColor: track.color },
            ]}
          />
          {/* Knob */}
          <Animated.View style={[styles.progressKnob, { left: progressWidth, backgroundColor: track.color }]} />
        </View>
        <Text style={styles.progressTime}>∞</Text>
      </View>

      {/* Controls Row */}
      <View style={styles.controls}>
        {/* Shuffle */}
        <TouchableOpacity
          onPress={() => { Haptics.selectionAsync(); setIsShuffle(v => !v); }}
          style={styles.ctrlSmall}
        >
          <Shuffle size={20} color={isShuffle ? track.color : '#334155'} />
        </TouchableOpacity>

        {/* Prev */}
        <TouchableOpacity onPress={prevTrack} style={styles.ctrlMed}>
          <SkipBack fill="#CBD5E1" color="#CBD5E1" size={26} />
        </TouchableOpacity>

        {/* Play/Pause main button */}
        <TouchableOpacity onPress={togglePlay} style={[styles.playBtn, { backgroundColor: isPlaying ? '#4F46E5' : '#E2E8F0' }]}>
          {isPlaying
            ? <Pause fill="#fff" color="#fff" size={28} />
            : <Play fill="#020617" color="#020617" size={28} style={{ marginLeft: 3 }} />
          }
        </TouchableOpacity>

        {/* Next */}
        <TouchableOpacity onPress={nextTrack} style={styles.ctrlMed}>
          <SkipForward fill="#CBD5E1" color="#CBD5E1" size={26} />
        </TouchableOpacity>

        {/* Repeat */}
        <TouchableOpacity
          onPress={() => { Haptics.selectionAsync(); setIsRepeat(v => !v); }}
          style={styles.ctrlSmall}
        >
          <Repeat size={20} color={isRepeat ? track.color : '#334155'} />
        </TouchableOpacity>
      </View>

      {/* Track Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={styles.chips}
      >
        {TRACKS.map((t, i) => {
          const active = i === selectedIdx;
          const chipName = lang === 'vi' ? t.name : t.nameEn;
          return (
            <TouchableOpacity
              key={t.id}
              style={[
                styles.chip,
                active && { backgroundColor: '#1E293B', borderColor: t.color + '60' },
              ]}
              onPress={() => playTrack(i)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipEmoji}>{t.emoji}</Text>
              <Text style={[styles.chipText, active && { color: '#E0E7FF' }]}>{chipName}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', alignItems: 'center' },

  header: {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8,
  },
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16, fontWeight: '600', color: '#E0E7FF', letterSpacing: 0.2,
  },

  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxHeight: height * 0.38,
  },
  waveContainer: { alignItems: 'center', justifyContent: 'center' },

  trackInfo: { alignItems: 'center', marginTop: 16, marginBottom: 12 },
  trackName: { fontSize: 20, fontWeight: '700', color: '#E0E7FF', letterSpacing: 0.2 },
  trackSubtitle: { fontSize: 13, color: '#475569', marginTop: 3 },

  progressContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 24, width: '100%', marginBottom: 24,
  },
  progressTime: { fontSize: 11, color: '#475569', width: 36 },
  progressBar: {
    flex: 1, height: 4, backgroundColor: '#1E293B', borderRadius: 2,
    overflow: 'visible', position: 'relative',
  },
  progressFill: { height: 4, borderRadius: 2 },
  progressKnob: {
    position: 'absolute', top: -4, width: 12, height: 12,
    borderRadius: 6, marginLeft: -6,
  },

  controls: {
    flexDirection: 'row', alignItems: 'center',
    gap: 20, marginBottom: 16,
  },
  ctrlSmall: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  ctrlMed: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  playBtn: {
    width: 68, height: 68, borderRadius: 34,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 10,
  },

  chips: { flexGrow: 0, marginBottom: 8 },
  chipsRow: { paddingHorizontal: 20, gap: 8, paddingBottom: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100,
    borderWidth: 1, borderColor: '#1E293B', backgroundColor: 'transparent',
  },
  chipEmoji: { fontSize: 13 },
  chipText: { fontSize: 13, color: '#334155', fontWeight: '600' },
});
