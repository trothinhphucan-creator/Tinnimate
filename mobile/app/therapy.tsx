import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, TouchableOpacity, Text, View,
  ScrollView, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLangStore } from '@/store/use-lang-store';
import { V } from '@/constants/theme';
import { LotusOrb, FloatingLeavesBackground, Vine } from '@/components/botanical';

const TRACKS = [
  { id: 'rain',     name: 'Mưa',   nameEn: 'Rain',   fullName: 'Tiếng Mưa',  fullNameEn: 'Rain Sounds',  emoji: '🌧️', free: true,  file: require('@/assets/audio/rain.mp3')     },
  { id: 'ocean',    name: 'Sóng',  nameEn: 'Ocean',  fullName: 'Sóng Biển',  fullNameEn: 'Ocean Waves',  emoji: '🌊', free: true,  file: require('@/assets/audio/ocean.mp3')    },
  { id: 'white',    name: 'White', nameEn: 'White',  fullName: 'Ồn Trắng',   fullNameEn: 'White Noise',  emoji: '⬜', free: true,  file: require('@/assets/audio/white.mp3')    },
  { id: 'pink',     name: 'Pink',  nameEn: 'Pink',   fullName: 'Ồn Hồng',    fullNameEn: 'Pink Noise',   emoji: '🌸', free: true,  file: require('@/assets/audio/pink.mp3')     },
  { id: 'brown',    name: 'Brown', nameEn: 'Brown',  fullName: 'Ồn Nâu',     fullNameEn: 'Brown Noise',  emoji: '🟤', free: true,  file: require('@/assets/audio/brown.mp3')    },
  { id: 'forest',   name: 'Rừng',  nameEn: 'Forest', fullName: 'Rừng Đêm',   fullNameEn: 'Forest Night', emoji: '🌲', free: false, file: require('@/assets/audio/forest.mp3')   },
  { id: 'campfire', name: 'Lửa',   nameEn: 'Fire',   fullName: 'Lửa Trại',   fullNameEn: 'Campfire',     emoji: '🔥', free: false, file: require('@/assets/audio/campfire.mp3') },
  { id: 'birds',    name: 'Chim',  nameEn: 'Birds',  fullName: 'Tiếng Chim', fullNameEn: 'Bird Songs',   emoji: '🐦', free: false, file: require('@/assets/audio/birds.mp3')    },
  { id: 'zen',      name: 'Zen',   nameEn: 'Zen',    fullName: 'Zen Bells',  fullNameEn: 'Zen Bells',    emoji: '🔔', free: false, file: require('@/assets/audio/zen.mp3')      },
  { id: '528hz',    name: '528Hz', nameEn: '528Hz',  fullName: 'Tone 528Hz', fullNameEn: 'Tone 528Hz',   emoji: '✨', free: false, file: require('@/assets/audio/528hz.mp3')    },
];

// Radial bar waveform — kept from previous implementation
const BAR_COUNT = 48, BAR_RADIUS = 118, MAX_BAR_H = 22, BAR_W = 2.5;

function RadialBarWaveform({ isPlaying }: { isPlaying: boolean }) {
  const barAnims = useRef<Animated.Value[]>(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(2))
  ).current;
  useEffect(() => {
    const loops: Animated.CompositeAnimation[] = [];
    if (isPlaying) {
      barAnims.forEach((anim, i) => {
        const dur = 280 + (i % 7) * 50;
        const loop = Animated.loop(Animated.sequence([
          Animated.delay((i / BAR_COUNT) * 600 % 600),
          Animated.timing(anim, { toValue: 4 + Math.random() * MAX_BAR_H, duration: dur, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
          Animated.timing(anim, { toValue: 2 + Math.random() * 4, duration: dur, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        ]));
        loop.start(); loops.push(loop);
      });
    } else {
      barAnims.forEach(a => Animated.timing(a, { toValue: 2, duration: 800, useNativeDriver: false }).start());
    }
    return () => loops.forEach(l => l.stop());
  }, [isPlaying]);

  const sz = (BAR_RADIUS + MAX_BAR_H + 4) * 2;
  const center = sz / 2;
  return (
    <View style={{ width: sz, height: sz }} pointerEvents="none">
      {barAnims.map((anim, i) => {
        const angle = (i / BAR_COUNT) * 2 * Math.PI - Math.PI / 2;
        return (
          <Animated.View key={i} style={{
            position: 'absolute', width: BAR_W,
            left: center + Math.cos(angle) * BAR_RADIUS - BAR_W / 2,
            top: center + Math.sin(angle) * BAR_RADIUS - MAX_BAR_H / 2,
            height: anim, borderRadius: BAR_W / 2,
            backgroundColor: V.sage,
            opacity: isPlaying ? anim.interpolate({ inputRange: [2, MAX_BAR_H], outputRange: [0.15, 0.6] }) : 0.08,
            transform: [{ rotate: `${(angle * 180) / Math.PI + 90}deg` }],
          }} />
        );
      })}
    </View>
  );
}

export default function TherapyScreen() {
  const router = useRouter();
  const { lang } = useLangStore();
  const { track: trackParam } = useLocalSearchParams<{ track?: string }>();
  const initialIdx = Math.max(0, TRACKS.findIndex(t => t.id === trackParam));
  const [selectedIdx, setSelectedIdx] = useState(initialIdx);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isRepeat, setIsRepeat] = useState(true);
  const [isShuffle, setIsShuffle] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const track = TRACKS[selectedIdx];
  const player = useAudioPlayer(track.file);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'mixWithOthers' });
  }, []);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (isPlaying) timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(Animated.timing(progressAnim, { toValue: 1, duration: 60000, easing: Easing.linear, useNativeDriver: false })).start();
    } else { progressAnim.stopAnimation(); }
  }, [isPlaying]);

  function playTrack(idx: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const t = TRACKS[idx];
    setSelectedIdx(idx); setElapsed(0);
    player.replace(t.file); player.loop = true; player.play();
    setIsPlaying(true); progressAnim.setValue(0);
  }

  function togglePlay() {
    if (isPlaying) { player.pause(); setIsPlaying(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }
    else { player.loop = true; player.play(); setIsPlaying(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
  }

  const fmtTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const progressW = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const displayName = lang === 'vi' ? track.fullName : track.fullNameEn;

  return (
    <View style={{ flex: 1, backgroundColor: V.bg }}>
      <FloatingLeavesBackground count={6} />
      <View style={{ position: 'absolute', top: -20, left: -20 }}>
        <Vine width={160} opacity={0.14} />
      </View>

      <SafeAreaView style={{ flex: 1, alignItems: 'center' }}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
            <ChevronLeft size={22} color={V.cream} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={s.headerHand}>đang phát</Text>
            <Text style={s.headerTitle}>{displayName}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Lotus visualizer */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ position: 'absolute' }}>
            <RadialBarWaveform isPlaying={isPlaying} />
          </View>
          <LotusOrb size={200} progress={elapsed % 60 === 0 ? 0.72 : (elapsed % 60) / 60} animate={isPlaying} />
        </View>

        {/* Track info */}
        <Text style={s.trackName}>{displayName}</Text>
        <Text style={s.trackSub}>{track.emoji} {lang === 'vi' ? 'Âm thanh trị liệu' : 'Sound Therapy'}</Text>

        {/* Progress */}
        <View style={s.progressRow}>
          <Text style={s.time}>{fmtTime(elapsed)}</Text>
          <View style={s.progressBar}>
            <Animated.View style={[s.progressFill, { width: progressW }]} />
          </View>
          <Text style={s.time}>∞</Text>
        </View>

        {/* Controls */}
        <View style={s.controls}>
          <TouchableOpacity style={s.iconBtn} onPress={() => { Haptics.selectionAsync(); setIsShuffle(v => !v); }}>
            <Shuffle size={20} color={isShuffle ? V.sage : V.textDim} />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={() => playTrack((selectedIdx - 1 + TRACKS.length) % TRACKS.length)}>
            <SkipBack fill={V.textSecondary} color={V.textSecondary} size={26} />
          </TouchableOpacity>
          <TouchableOpacity onPress={togglePlay} style={[s.playBtn, isPlaying && { backgroundColor: V.surfaceHighest }]}>
            {isPlaying ? <Pause fill={V.cream} color={V.cream} size={28} /> : <Play fill={V.bg} color={V.bg} size={28} style={{ marginLeft: 3 }} />}
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={() => playTrack(isShuffle ? Math.floor(Math.random() * TRACKS.length) : (selectedIdx + 1) % TRACKS.length)}>
            <SkipForward fill={V.textSecondary} color={V.textSecondary} size={26} />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={() => { Haptics.selectionAsync(); setIsRepeat(v => !v); }}>
            <Repeat size={20} color={isRepeat ? V.sage : V.textDim} />
          </TouchableOpacity>
        </View>

        {/* Track chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
          {TRACKS.map((t, i) => (
            <TouchableOpacity key={t.id} onPress={() => playTrack(i)}
              style={[s.chip, i === selectedIdx && { backgroundColor: V.primaryContainer, borderColor: V.sage + '60' }]}>
              <Text style={{ fontSize: 16 }}>{t.emoji}</Text>
              <Text style={[s.chipText, i === selectedIdx && { color: V.cream }]}>
                {lang === 'vi' ? t.name : t.nameEn}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  header:      { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 },
  headerHand:  { fontSize: 14, fontWeight: '600', color: V.sage },
  headerTitle: { fontSize: 15, fontWeight: '500', color: V.cream },
  trackName:   { fontSize: 26, fontWeight: '500', color: V.cream, letterSpacing: -0.4, marginBottom: 4 },
  trackSub:    { fontSize: 16, fontWeight: '600', color: V.textSecondary, marginBottom: 16 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, width: '100%', marginBottom: 28 },
  time:        { fontSize: 11, color: V.textMuted, fontWeight: '600', width: 40 },
  progressBar: { flex: 1, height: 4, backgroundColor: V.surfaceHighest, borderRadius: 2, overflow: 'hidden' },
  progressFill:{ height: 4, backgroundColor: V.sage, borderRadius: 2 },
  controls:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 24, marginBottom: 28, gap: 4 },
  iconBtn:     { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: V.surface },
  playBtn:     { width: 72, height: 72, borderRadius: 36, backgroundColor: V.sage, alignItems: 'center', justifyContent: 'center', shadowColor: V.sage, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  chip:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: V.surface, borderWidth: 1, borderColor: V.borderCard },
  chipText:    { fontSize: 13, fontWeight: '600', color: V.textMuted },
});
