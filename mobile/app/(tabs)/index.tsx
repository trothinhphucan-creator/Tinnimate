import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, TouchableOpacity, Text, View,
  Dimensions, ScrollView, Animated, Easing, PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import {
  Shuffle, SkipBack, Play, Pause, SkipForward, Repeat,
  Layers, User,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { TinniOrb } from '@/components/TinniOrb';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

const TRACKS = [
  { id: 'rain',     name: 'Mưa',   fullName: 'Tiếng Mưa',   emoji: '🌧️', color: '#06B6D4', free: true,  file: require('@/assets/audio/rain.mp3')     },
  { id: 'ocean',    name: 'Sóng',  fullName: 'Sóng Biển',   emoji: '🌊', color: '#0EA5E9', free: true,  file: require('@/assets/audio/ocean.mp3')    },
  { id: 'white',    name: 'White', fullName: 'Ồn Trắng',    emoji: '⬜', color: '#94A3B8', free: true,  file: require('@/assets/audio/white.mp3')    },
  { id: 'pink',     name: 'Pink',  fullName: 'Ồn Hồng',     emoji: '🌸', color: '#EC4899', free: true,  file: require('@/assets/audio/pink.mp3')     },
  { id: 'brown',    name: 'Brown', fullName: 'Ồn Nâu',      emoji: '🟤', color: '#92400E', free: true,  file: require('@/assets/audio/brown.mp3')    },
  { id: 'forest',   name: 'Rừng',  fullName: 'Rừng Đêm',    emoji: '🌲', color: '#16A34A', free: false, file: require('@/assets/audio/forest.mp3')   },
  { id: 'campfire', name: 'Lửa',   fullName: 'Lửa Trại',    emoji: '🔥', color: '#F97316', free: false, file: require('@/assets/audio/campfire.mp3') },
  { id: 'birds',    name: 'Chim',  fullName: 'Tiếng Chim',  emoji: '🐦', color: '#84CC16', free: false, file: require('@/assets/audio/birds.mp3')    },
  { id: 'zen',      name: 'Zen',   fullName: 'Zen Bells',   emoji: '🔔', color: '#A855F7', free: false, file: require('@/assets/audio/zen.mp3')      },
  { id: '528hz',    name: '528Hz', fullName: 'Tone 528Hz',  emoji: '✨', color: '#6366F1', free: false, file: require('@/assets/audio/528hz.mp3')    },
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

export default function PlayerScreen() {
  const router = useRouter();
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>TinniMate</Text>
        <TouchableOpacity onPress={() => router.push('/profile')} style={styles.avatarBtn}>
          <View style={styles.avatar}>
            <Text style={{ fontSize: 14 }}>👤</Text>
          </View>
        </TouchableOpacity>
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
        <Text style={styles.trackName}>{track.fullName}</Text>
        <Text style={styles.trackSubtitle}>{track.emoji} Âm thanh trị liệu</Text>
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

      {/* Mixer Button */}
      <TouchableOpacity
        style={styles.mixerBtn}
        onPress={() => { Haptics.selectionAsync(); router.push('/mixer'); }}
        activeOpacity={0.8}
      >
        <Layers size={14} color="#818CF8" />
        <Text style={styles.mixerText}>Mixer</Text>
      </TouchableOpacity>

      {/* Track Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={styles.chips}
      >
        {TRACKS.map((t, i) => {
          const active = i === selectedIdx;
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
              <Text style={[styles.chipText, active && { color: '#E0E7FF' }]}>{t.name}</Text>
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
    justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8,
  },
  appName: { fontSize: 18, fontWeight: '700', color: '#E0E7FF', letterSpacing: 0.3 },
  avatarBtn: {},
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155',
    alignItems: 'center', justifyContent: 'center',
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

  mixerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(129,140,248,0.1)',
    borderRadius: 100, borderWidth: 1, borderColor: 'rgba(129,140,248,0.3)',
    paddingHorizontal: 18, paddingVertical: 9, marginBottom: 16,
  },
  mixerText: { fontSize: 13, fontWeight: '700', color: '#818CF8' },

  chips: { flexGrow: 0 },
  chipsRow: { paddingHorizontal: 20, gap: 8, paddingBottom: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100,
    borderWidth: 1, borderColor: '#1E293B', backgroundColor: 'transparent',
  },
  chipEmoji: { fontSize: 13 },
  chipText: { fontSize: 13, color: '#334155', fontWeight: '600' },
});
