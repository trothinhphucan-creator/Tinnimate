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

const PHASES_4478 = [
  { label: 'HÍT VÀO', secs: 4, color: '#06B6D4', scale: 1.0 },
  { label: 'GIỮ HƠI', secs: 7, color: '#818CF8', scale: 1.0 },
  { label: 'THỞ RA',  secs: 8, color: '#10B981', scale: 0.55 },
];

const EXERCISES = [
  { id: '4-7-8', name: '4-7-8',   desc: 'Giúp ngủ ngon',
    phases: PHASES_4478 },
  { id: '4-4-6-2', name: '4-4-6-2', desc: 'Giảm lo âu',
    phases: [
      { label: 'HÍT VÀO', secs: 4, color: '#06B6D4', scale: 1.0 },
      { label: 'GIỮ HƠI', secs: 4, color: '#818CF8', scale: 1.0 },
      { label: 'THỞ RA',  secs: 6, color: '#10B981', scale: 0.55 },
      { label: 'NGHỈ',    secs: 2, color: '#3B82F6', scale: 0.55 },
    ] },
  { id: 'box', name: 'Box',    desc: 'Cân bằng tâm trí',
    phases: [
      { label: 'HÍT VÀO', secs: 4, color: '#06B6D4', scale: 1.0 },
      { label: 'GIỮ HƠI', secs: 4, color: '#818CF8', scale: 1.0 },
      { label: 'THỞ RA',  secs: 4, color: '#10B981', scale: 0.55 },
      { label: 'NGHỈ',    secs: 4, color: '#3B82F6', scale: 0.55 },
    ] },
];

export default function BreathingScreen() {
  const [exerciseId, setExerciseId] = useState('4-7-8');
  const [isRunning, setIsRunning]   = useState(false);
  const [phaseIdx, setPhaseIdx]     = useState(0);
  const [countdown, setCountdown]   = useState(4);
  const [round, setRound]           = useState(1);
  const circleAnim = useRef(new Animated.Value(0.6)).current;
  const glowAnim   = useRef(new Animated.Value(0.3)).current;
  const phaseRef   = useRef(0);
  const roundRef   = useRef(1);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const router     = useRouter();

  const ex     = EXERCISES.find(e => e.id === exerciseId) ?? EXERCISES[0];
  const phase  = ex.phases[phaseIdx];

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      Animated.timing(circleAnim, { toValue: 0.6, duration: 800, useNativeDriver: true }).start();
      Animated.timing(glowAnim, { toValue: 0.2, duration: 800, useNativeDriver: true }).start();
      return;
    }

    const currentPhases = ex.phases;
    let currentPhase  = phaseRef.current;
    let remainingSecs = currentPhases[currentPhase].secs;

    setPhaseIdx(currentPhase);
    setCountdown(remainingSecs);

    // Animate circle for current phase
    const targetScale = currentPhases[currentPhase].scale;
    Animated.timing(circleAnim, {
      toValue: targetScale,
      duration: (currentPhases[currentPhase].secs - 0.5) * 1000,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
    Animated.timing(glowAnim, {
      toValue: targetScale > 0.8 ? 0.6 : 0.2,
      duration: (currentPhases[currentPhase].secs - 0.5) * 1000,
      useNativeDriver: true,
    }).start();

    timerRef.current = setInterval(() => {
      remainingSecs -= 1;
      setCountdown(remainingSecs);
      if (remainingSecs <= 0) {
        clearInterval(timerRef.current!);
        currentPhase = (currentPhase + 1) % currentPhases.length;
        phaseRef.current = currentPhase;
        setPhaseIdx(currentPhase);
        remainingSecs = currentPhases[currentPhase].secs;
        setCountdown(remainingSecs);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Re-animate for new phase
        const newScale = currentPhases[currentPhase].scale;
        Animated.timing(circleAnim, {
          toValue: newScale,
          duration: (currentPhases[currentPhase].secs - 0.5) * 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }).start();
        Animated.timing(glowAnim, {
          toValue: newScale > 0.8 ? 0.6 : 0.2,
          duration: (currentPhases[currentPhase].secs - 0.5) * 1000,
          useNativeDriver: true,
        }).start();
        timerRef.current = setInterval(() => {  /* recursion handled outside */ }, 1000);
      }
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, exerciseId]);

  const CIRCLE_MAX = width * 0.72;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#94A3B8" />
        </TouchableOpacity>
        <Text style={styles.title}>🌬️ Bài tập thở</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Exercise picker */}
      <View style={styles.picker}>
        {EXERCISES.map(e => (
          <TouchableOpacity
            key={e.id}
            style={[styles.exChip, exerciseId === e.id && styles.exChipActive]}
            onPress={() => {
              setExerciseId(e.id); setIsRunning(false);
              phaseRef.current = 0; setPhaseIdx(0); setRound(1); roundRef.current = 1;
              Haptics.selectionAsync();
            }}>
            <Text style={[styles.exChipName, exerciseId === e.id && { color: '#818CF8' }]}>{e.name}</Text>
            <Text style={styles.exChipDesc}>{e.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Breathing circle */}
      <View style={styles.circleContainer}>
        {/* Outer glow */}
        <Animated.View style={[styles.circleGlow, {
          width: CIRCLE_MAX + 80, height: CIRCLE_MAX + 80,
          borderRadius: (CIRCLE_MAX + 80) / 2,
          backgroundColor: phase.color,
          opacity: glowAnim,
          transform: [{ scale: circleAnim }],
        }]} />
        {/* Main ring */}
        <Animated.View style={[styles.circleRing, {
          width: CIRCLE_MAX, height: CIRCLE_MAX, borderRadius: CIRCLE_MAX / 2,
          borderColor: phase.color,
          transform: [{ scale: circleAnim }],
        }]}>
          <View style={[styles.circleInner, { backgroundColor: phase.color + '15' }]}>
            <Text style={[styles.phaseLabel, { color: phase.color }]}>{phase.label}</Text>
            <Text style={styles.phaseSeconds}>{countdown}</Text>
          </View>
        </Animated.View>
      </View>

      {/* Phase indicators */}
      <View style={styles.phaseIndicators}>
        {ex.phases.filter(p => p.secs > 0).map((p, i) => (
          <View key={i} style={styles.phaseIndicator}>
            <View style={[styles.phaseDot, ex.phases.indexOf(p) === phaseIdx && { backgroundColor: phase.color, width: 16 }]} />
            <Text style={[styles.phaseIndLabel, ex.phases.indexOf(p) === phaseIdx && { color: '#E0E7FF' }]}>
              {p.label.charAt(0) + p.label.slice(1).toLowerCase()} ({p.secs}s)
            </Text>
          </View>
        ))}
      </View>

      {/* Round counter */}
      <Text style={styles.roundText}>Vòng {round} / 4</Text>

      {/* Start/Stop */}
      <TouchableOpacity
        style={[styles.startBtn, isRunning
          ? { backgroundColor: '#1E293B', borderColor: '#334155' }
          : { backgroundColor: phase.color + 'CC', borderColor: phase.color }
        ]}
        onPress={() => { setIsRunning(!isRunning); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }}
        activeOpacity={0.85}>
        <Text style={styles.startBtnText}>
          {isRunning ? 'Dừng' : '▶  Bắt đầu'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', alignItems: 'center', paddingHorizontal: 20 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 8, paddingBottom: 12, width: '100%',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#E0E7FF' },

  picker: { flexDirection: 'row', gap: 8, marginBottom: 16, width: '100%' },
  exChip: {
    flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 6,
    borderRadius: 14, borderWidth: 1, borderColor: '#1E293B', backgroundColor: '#0F172A',
  },
  exChipActive: { borderColor: '#4F46E5', backgroundColor: '#4F46E518' },
  exChipName: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 2 },
  exChipDesc: { fontSize: 10, color: '#334155', textAlign: 'center' },

  circleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  circleGlow: { position: 'absolute' },
  circleRing: {
    borderWidth: 2.5, alignItems: 'center', justifyContent: 'center',
  },
  circleInner: {
    width: '76%', aspectRatio: 1, borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
  },
  phaseLabel: { fontSize: 18, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  phaseSeconds: { fontSize: 64, fontWeight: '900', color: '#E0E7FF', lineHeight: 70 },

  phaseIndicators: { flexDirection: 'row', gap: 16, marginBottom: 8, alignItems: 'center' },
  phaseIndicator: { alignItems: 'center', gap: 4 },
  phaseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1E293B' },
  phaseIndLabel: { fontSize: 10, color: '#334155', fontWeight: '600' },

  roundText: { fontSize: 13, color: '#64748B', marginBottom: 24 },

  startBtn: {
    width: '100%', paddingVertical: 17, borderRadius: 100,
    borderWidth: 1.5, alignItems: 'center', marginBottom: 32,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
  },
  startBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
