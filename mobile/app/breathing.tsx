import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { V } from '@/constants/theme';
import { BreathingFlower, FloatingLeavesBackground } from '@/components/botanical';

const EXERCISES = [
  {
    id: '4-7-8', name: '4·7·8', desc: 'An thần',
    phases: [
      { label: 'hít vào…', secs: 4,  isInhale: true  },
      { label: 'giữ…',     secs: 7,  isInhale: true  },
      { label: 'thở ra…',  secs: 8,  isInhale: false },
    ],
  },
  {
    id: 'box', name: 'Box', desc: 'Cân bằng',
    phases: [
      { label: 'hít vào…', secs: 4, isInhale: true  },
      { label: 'giữ…',     secs: 4, isInhale: true  },
      { label: 'thở ra…',  secs: 4, isInhale: false },
      { label: 'nghỉ…',    secs: 4, isInhale: false },
    ],
  },
  {
    id: '4-4-6', name: '4·4·6', desc: 'Dịu ù',
    phases: [
      { label: 'hít vào…', secs: 4, isInhale: true  },
      { label: 'giữ…',     secs: 4, isInhale: true  },
      { label: 'thở ra…',  secs: 6, isInhale: false },
    ],
  },
];

export default function BreathingScreen() {
  const router    = useRouter();
  const [exId,    setExId]    = useState('4-7-8');
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPIdx]   = useState(0);
  const [countdown, setCdown] = useState(4);
  const [round,   setRound]   = useState(1);
  const phaseRef  = useRef(0);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const ex    = EXERCISES.find(e => e.id === exId) ?? EXERCISES[0];
  const phase = ex.phases[phaseIdx];

  useEffect(() => {
    if (!running) {
      if (timerRef.current) clearInterval(timerRef.current);
      setPIdx(0); setCdown(ex.phases[0].secs);
      return;
    }

    phaseRef.current = 0;
    let cur = 0;
    let rem = ex.phases[0].secs;
    setPIdx(0); setCdown(rem);

    const tick = () => {
      rem -= 1;
      setCdown(rem);
      if (rem <= 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        cur = (cur + 1) % ex.phases.length;
        if (cur === 0) setRound(r => r + 1);
        phaseRef.current = cur;
        rem = ex.phases[cur].secs;
        setPIdx(cur); setCdown(rem);
      }
    };

    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running, exId]);

  const inhaleSecs = ex.phases[0].secs;
  const exhaleSecs = ex.phases[ex.phases.length - 1].secs;

  return (
    <View style={{ flex: 1, backgroundColor: '#2A332D' }}>
      <FloatingLeavesBackground count={5} />

      <SafeAreaView style={{ flex: 1, alignItems: 'center', paddingHorizontal: 24 }}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
            <ChevronLeft size={22} color={V.cream} />
          </TouchableOpacity>
          <Text style={s.title}>Hơi thở</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Exercise picker */}
        <View style={s.picker}>
          {EXERCISES.map(e => (
            <TouchableOpacity key={e.id}
              style={[s.chip, exId === e.id && s.chipActive]}
              onPress={() => { setExId(e.id); setRunning(false); setRound(1); Haptics.selectionAsync(); }}>
              <Text style={[s.chipName, exId === e.id && { color: V.sage }]}>{e.name}</Text>
              <Text style={s.chipDesc}>{e.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Breathing flower */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={s.phaseLabel}>{phase.label}</Text>
          <BreathingFlower
            size={280}
            animate={running}
            inhaleDuration={inhaleSecs * 1000}
            exhaleDuration={exhaleSecs * 1000}
          />
          <Text style={s.countdown}>{countdown}</Text>
          <Text style={s.roundText}>chu kỳ {round} / 8</Text>
        </View>

        {/* Start / Stop */}
        <TouchableOpacity
          style={[s.startBtn, running && { backgroundColor: V.surfaceHigh, borderColor: V.outline }]}
          onPress={() => { setRunning(r => !r); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }}
          activeOpacity={0.85}
        >
          <Text style={[s.startText, running && { color: V.textSecondary }]}>
            {running ? 'Dừng lại' : '▶  Bắt đầu'}
          </Text>
        </TouchableOpacity>

      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  header:     { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4, paddingBottom: 12 },
  iconBtn:    { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(245,237,224,0.08)', alignItems: 'center', justifyContent: 'center' },
  title:      { fontSize: 17, fontWeight: '500', color: V.cream },
  picker:     { flexDirection: 'row', gap: 8, width: '100%', marginBottom: 8 },
  chip:       { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(245,237,224,0.06)', borderWidth: 1, borderColor: 'rgba(245,237,224,0.08)' },
  chipActive: { backgroundColor: V.primaryContainer, borderColor: V.sage + '40' },
  chipName:   { fontSize: 16, fontWeight: '700', color: V.textSecondary },
  chipDesc:   { fontSize: 11, color: V.textMuted, fontWeight: '600', marginTop: 1 },
  phaseLabel: { fontSize: 22, fontWeight: '600', color: V.petal, marginBottom: 8 },
  countdown:  { fontSize: 52, fontWeight: '300', color: V.cream, letterSpacing: -1, marginTop: -8 },
  roundText:  { fontSize: 13, color: V.textMuted, fontWeight: '500', marginTop: 4 },
  startBtn:   { width: '100%', paddingVertical: 18, borderRadius: 999, backgroundColor: V.sage, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: V.sage },
  startText:  { fontSize: 16, fontWeight: '700', color: V.bg, letterSpacing: 0.3 },
});
