import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '@/store/use-user-store';
import { useLangStore } from '@/store/use-lang-store';
import { V } from '@/constants/theme';
import {
  LotusOrb, FloatingLeavesBackground, BotanicalCard, BotanicalPill,
  SectionHeader, Vine, Moonflower, Fern, Bamboo, BreathingFlower,
} from '@/components/botanical';

function SteppingStones({ done, total }: { done: number; total: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', marginTop: 14 }}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[s.stone, i < done && { backgroundColor: V.sage }]} />
      ))}
      <Text style={{ fontSize: 11, color: V.textMuted, fontWeight: '600', marginLeft: 6 }}>
        {done}/{total}
      </Text>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const { lang } = useLangStore();
  const [greeting, setGreeting] = useState('chào buổi sáng,');

  useEffect(() => {
    const h = new Date().getHours();
    if (lang === 'vi') {
      setGreeting(h < 12 ? 'chào buổi sáng,' : h < 18 ? 'chào buổi chiều,' : 'chào buổi tối,');
    } else {
      setGreeting(h < 12 ? 'good morning,' : h < 18 ? 'good afternoon,' : 'good evening,');
    }
  }, [lang]);

  const name = user?.name || user?.email?.split('@')[0] || 'bạn';
  const go = (r: string) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(r as any); };

  const PILLS = [
    { label: 'Thở nhẹ',  route: '/breathing',      active: true },
    { label: 'Âm rừng',  route: '/(tabs)/explore' },
    { label: 'Ngủ',      route: '/sleep' },
    { label: 'Nhật ký',  route: '/journal' },
    { label: 'Thiền',    route: '/(tabs)/zen' },
  ];

  const TOOLS = [
    { label: 'Hơi thở',  sub: '4·7·8',    icon: <BreathingFlower size={52} animate={false} />, route: '/breathing' },
    { label: 'Notch',    sub: 'Tần số',    icon: <Fern size={44} />,                            route: '/notch-therapy' },
    { label: 'Zentones', sub: 'Âm bội',    icon: <Bamboo size={44} />,                          route: '/zentones' },
    { label: 'Giấc ngủ', sub: 'Ru đêm',   icon: <Moonflower size={52} />,                      route: '/sleep' },
  ];

  const STATS = [
    { value: '12',   label: 'ngày',      accent: V.sage },
    { value: '4.2h', label: 'trị liệu',  accent: V.honey },
    { value: '-28%', label: 'cường độ',  accent: V.petal },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: V.bg }}>
      <FloatingLeavesBackground count={6} />
      <View style={{ position: 'absolute', top: 40, right: -10, zIndex: 0 }}>
        <Vine width={130} opacity={0.15} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: 20, paddingTop: 8 }}>

          {/* Greeting */}
          <View style={s.topBar}>
            <View>
              <Text style={s.greetHand}>{greeting}</Text>
              <Text style={s.greetName}>{name}</Text>
            </View>
            <TouchableOpacity onPress={() => go('/profile')} style={s.avatar}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: V.bg }}>
                {name.charAt(0).toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Lotus hero */}
          <View style={{ alignItems: 'center', marginVertical: 12 }}>
            <LotusOrb size={220} progress={0.72} />
            <Text style={s.heroHand}>bạn đang nở rộ</Text>
            <Text style={{ fontSize: 13, color: V.textMuted, fontWeight: '500', marginTop: 2 }}>
              Hành trình 12 ngày · ù tai giảm 28%
            </Text>
          </View>

          {/* Quick pills */}
          <Text style={s.eyebrow}>chọn cho mình…</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -20, marginTop: 8 }}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
            {PILLS.map(p => (
              <BotanicalPill key={p.label} active={!!p.active} onPress={() => go(p.route)}>
                {p.label}
              </BotanicalPill>
            ))}
          </ScrollView>

          {/* Today's session */}
          <BotanicalCard tint="sage" style={{ marginTop: 18 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={s.cardHand}>lúc này, bạn cần…</Text>
                <Text style={s.cardTitle}>Tắm rừng 20 phút</Text>
                <Text style={{ fontSize: 13, color: V.textSecondary, marginTop: 4, fontWeight: '500' }}>
                  Âm rừng + nhịp thở 4·7·8
                </Text>
              </View>
              <TouchableOpacity onPress={() => go('/therapy')} style={s.playBtn}>
                <Text style={{ color: V.bg, fontSize: 14, fontWeight: '800', marginLeft: 2 }}>▶</Text>
              </TouchableOpacity>
            </View>
            <SteppingStones done={3} total={7} />
          </BotanicalCard>

          {/* Stats */}
          <SectionHeader eyebrow="hành trình của bạn" style={{ marginTop: 22 }} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {STATS.map(st => (
              <View key={st.label} style={s.statCard}>
                <Text style={[s.statVal, { color: st.accent }]}>{st.value}</Text>
                <Text style={s.statLabel}>{st.label}</Text>
              </View>
            ))}
          </View>

          {/* Check-in */}
          <BotanicalCard tint="petal" style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Moonflower size={48} />
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Tối nay bạn thế nào?</Text>
              <Text style={{ fontSize: 12, color: V.textMuted, marginTop: 2 }}>Ghi lại để vun vườn nội tâm</Text>
            </View>
            <TouchableOpacity onPress={() => go('/journal')}
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: `${V.petal}22`, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: V.petal, fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          </BotanicalCard>

          {/* Garden tools */}
          <SectionHeader eyebrow="vườn trị liệu" style={{ marginTop: 22 }} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {TOOLS.map(t => (
              <TouchableOpacity key={t.label} onPress={() => go(t.route)} style={s.toolCard}>
                <View style={{ alignItems: 'flex-end', marginBottom: -4 }}>{t.icon}</View>
                <Text style={s.toolLabel}>{t.label}</Text>
                <Text style={s.toolSub}>{t.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>

        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  topBar:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  greetHand: { fontSize: 20, fontWeight: '600', color: V.sage },
  greetName: { fontSize: 28, fontWeight: '500', color: V.cream, letterSpacing: -0.5 },
  avatar:    { width: 44, height: 44, borderRadius: 22, backgroundColor: `${V.petal}99`, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: `${V.cream}25` },
  heroHand:  { fontSize: 20, fontWeight: '600', color: V.textSecondary, marginTop: -4 },
  eyebrow:   { fontSize: 18, fontWeight: '600', color: V.sage, letterSpacing: 0.3, marginTop: 20 },
  cardHand:  { fontSize: 16, fontWeight: '600', color: V.sage, marginBottom: 2 },
  cardTitle: { fontSize: 20, fontWeight: '500', color: V.cream, letterSpacing: -0.3 },
  playBtn:   { width: 52, height: 52, borderRadius: 26, backgroundColor: V.sage, alignItems: 'center', justifyContent: 'center', shadowColor: V.sage, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  stone:     { height: 6, flex: 1, borderRadius: 3, backgroundColor: `${V.cream}25` },
  statCard:  { flex: 1, backgroundColor: V.surface, borderRadius: 16, padding: 14, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: V.borderCard },
  statVal:   { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: V.textMuted, textAlign: 'center', letterSpacing: 0.2 },
  toolCard:  { width: '47.5%', backgroundColor: V.surface, borderRadius: 20, padding: 14, gap: 6, borderWidth: 1, borderColor: V.borderCard },
  toolLabel: { fontSize: 15, fontWeight: '700', color: V.textPrimary },
  toolSub:   { fontSize: 11, color: V.textMuted },
});
