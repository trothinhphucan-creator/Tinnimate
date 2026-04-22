import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';
import { V } from '@/constants/theme';
import {
  Moonflower, FloatingLeavesBackground, WaterLily, Coral, Fern, Wildflower, Eyebrow,
} from '@/components/botanical';

const TIMERS = [
  { label: '15 phút', minutes: 15 }, { label: '30 phút', minutes: 30 },
  { label: '45 phút', minutes: 45 }, { label: '1 giờ',   minutes: 60 },
  { label: '∞',       minutes: 0  },
];

const SOUNDS = [
  { id: 'rain',     ill: <WaterLily size={36} />, label: 'Mưa đêm',  file: require('@/assets/audio/rain.mp3')     },
  { id: 'ocean',    ill: <Coral size={36} />,     label: 'Sóng xa',  file: require('@/assets/audio/ocean.mp3')    },
  { id: 'forest',   ill: <Fern size={36} />,      label: 'Gió rừng', file: require('@/assets/audio/forest.mp3')   },
  { id: 'campfire', ill: <Wildflower size={36} />,label: 'Dế đêm',   file: require('@/assets/audio/campfire.mp3') },
  { id: 'zen',      ill: <Moonflower size={36} />,label: 'Zen',      file: require('@/assets/audio/zen.mp3')      },
];

// Deterministic star positions to avoid rerender churn
const STARS = Array.from({ length: 28 }, (_, i) => ({
  top:  `${(i * 53) % 70}%` as `${number}%`,
  left: `${(i * 37) % 95}%` as `${number}%`,
  size: 2 + (i % 3),
  opacity: 0.25 + ((i * 7) % 50) / 100,
}));

export default function SleepScreen() {
  const router = useRouter();
  const [selectedSound, setSelectedSound] = useState(SOUNDS[0]);
  const [selectedTimer, setSelectedTimer] = useState(TIMERS[1]);
  const [playing, setPlaying] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const moonPulse = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const player = useAudioPlayer(selectedSound.file);

  useEffect(() => {
    if (playing) {
      Animated.loop(Animated.sequence([
        Animated.timing(moonPulse, { toValue: 1.06, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(moonPulse, { toValue: 0.94, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])).start();
      player.play();
    } else {
      moonPulse.stopAnimation();
      Animated.timing(moonPulse, { toValue: 1, duration: 300, useNativeDriver: true }).start();
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
            if (r <= 1) { clearInterval(timerRef.current!); setPlaying(false); return 0; }
            return r - 1;
          });
        }, 1000);
      }
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    setPlaying(p => !p);
  }

  const fmtTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const timerDisplay = playing && selectedTimer.minutes > 0 ? fmtTime(remaining) : selectedTimer.label;

  return (
    <View style={{ flex: 1, backgroundColor: '#1B1F28' }}>
      <FloatingLeavesBackground count={4} />

      {/* Stars */}
      {STARS.map((star, i) => (
        <View key={i} style={[s.star, { top: star.top, left: star.left, width: star.size, height: star.size, opacity: star.opacity }]} />
      ))}

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
            <ChevronLeft size={22} color={V.cream} />
          </TouchableOpacity>
          <Text style={s.title}>Giấc ngủ</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <Text style={s.eyeHand}>lời tạm biệt ngày</Text>
          <Text style={s.heading}>Chúc <Text style={{ fontStyle: 'italic' }}>ngủ ngon</Text></Text>
        </View>

        {/* Moonflower + timer */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={{ transform: [{ scale: moonPulse }] }}>
            <Moonflower size={240} />
          </Animated.View>
          <Text style={s.timerText}>{timerDisplay}</Text>
          <Text style={s.timerSub}>tự tắt</Text>
        </View>

        {/* Sound picker */}
        <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
          <Eyebrow style={{ color: V.lavender, marginBottom: 10 }}>âm ru ngủ</Eyebrow>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {SOUNDS.map(sound => (
              <TouchableOpacity key={sound.id}
                onPress={() => { setSelectedSound(sound); if (playing) { player.replace(sound.file); player.play(); } Haptics.selectionAsync(); }}
                style={[s.soundChip, selectedSound.id === sound.id && s.soundChipActive]}>
                {sound.ill}
                <Text style={[s.soundLabel, selectedSound.id === sound.id && { color: V.cream }]}>{sound.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Timer pills */}
        <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {TIMERS.map(timer => (
              <TouchableOpacity key={timer.label}
                onPress={() => { setSelectedTimer(timer); Haptics.selectionAsync(); }}
                style={[s.timerPill, selectedTimer.label === timer.label && s.timerPillActive]}>
                <Text style={[s.timerPillText, selectedTimer.label === timer.label && { color: V.lavender }]}>
                  {timer.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Play button */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <TouchableOpacity onPress={togglePlay} style={[s.playBtn, playing && { backgroundColor: V.surfaceHighest }]}>
            <Text style={{ fontSize: 26, color: playing ? V.lavender : V.bg }}>{playing ? '⏸' : '▶'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  star:           { position: 'absolute', borderRadius: 99, backgroundColor: V.cream },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 },
  iconBtn:        { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(245,237,224,0.08)', alignItems: 'center', justifyContent: 'center' },
  title:          { fontSize: 17, fontWeight: '500', color: V.cream },
  eyeHand:        { fontSize: 20, fontWeight: '600', color: V.lavender },
  heading:        { fontSize: 28, fontWeight: '500', color: V.cream, letterSpacing: -0.5 },
  timerText:      { fontSize: 48, fontWeight: '300', color: V.cream, letterSpacing: -1, marginTop: 8 },
  timerSub:       { fontSize: 12, color: V.textMuted, fontWeight: '600', letterSpacing: 0.5 },
  soundChip:      { alignItems: 'center', padding: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: 'rgba(245,237,224,0.05)', borderWidth: 1, borderColor: 'rgba(245,237,224,0.08)', minWidth: 88, gap: 4 },
  soundChipActive:{ backgroundColor: 'rgba(196,181,224,0.2)', borderColor: V.lavender },
  soundLabel:     { fontSize: 12, fontWeight: '600', color: V.textMuted },
  timerPill:      { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(245,237,224,0.06)', borderWidth: 1, borderColor: 'rgba(245,237,224,0.08)' },
  timerPillActive:{ backgroundColor: 'rgba(196,181,224,0.15)', borderColor: V.lavender + '60' },
  timerPillText:  { fontSize: 13, fontWeight: '600', color: V.textMuted },
  playBtn:        { width: 68, height: 68, borderRadius: 34, backgroundColor: V.lavender, alignItems: 'center', justifyContent: 'center', shadowColor: V.lavender, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
});
