import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { V } from '@/constants/theme';
import {
  FloatingLeavesBackground, BotanicalCard, BotanicalPill, Sprig,
  WaterLily, Coral, Fern, Wildflower, Sakura, Bamboo, Dandelion, Mushroom, LotusOrb,
} from '@/components/botanical';

const CATEGORIES = ['Tất cả', 'Thiên nhiên', 'White noise', 'Tần số', 'Thiền'];

const SOUNDS = [
  { name: 'Mưa rừng',   sub: 'White noise', ill: <WaterLily size={56} />, tint: 'sky'     as const },
  { name: 'Đại dương',  sub: 'Thiên nhiên', ill: <Coral size={56} />,     tint: 'sky'     as const },
  { name: 'Rừng sâu',   sub: 'Thiên nhiên', ill: <Fern size={56} />,      tint: 'sage'    as const },
  { name: 'Bếp lửa',    sub: 'Ấm áp',       ill: <Wildflower size={56} />,tint: 'terra'   as const },
  { name: 'Chim hót',   sub: 'Thiên nhiên', ill: <Sakura size={56} />,    tint: 'petal'   as const },
  { name: 'Zen chuông', sub: 'Thiền',        ill: <Bamboo size={56} />,    tint: 'sage'    as const },
  { name: 'White',      sub: 'Tần số',       ill: <Dandelion size={56} />, tint: 'default' as const },
  { name: 'Pink',       sub: 'Tần số',       ill: <Sakura size={56} />,    tint: 'petal'   as const },
  { name: 'Brown',      sub: 'Tần số',       ill: <Mushroom size={56} />,  tint: 'terra'   as const },
  { name: '528 Hz',     sub: 'Chữa lành',    ill: <LotusOrb size={60} progress={0} animate={false} />, tint: 'petal' as const },
];

export default function ExploreScreen() {
  const router = useRouter();
  const [activeCat, setActiveCat] = useState(0);
  const [query, setQuery] = useState('');

  const filtered = SOUNDS.filter(s =>
    !query || s.name.toLowerCase().includes(query.toLowerCase()) || s.sub.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={{ flex: 1, backgroundColor: V.bg }}>
      <FloatingLeavesBackground count={4} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: 20, paddingTop: 8 }}>

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Sprig size={18} color={V.sage} />
            <Text style={s.eyebrow}>khu vườn âm thanh</Text>
          </View>
          <Text style={s.title}>Chọn một âm <Text style={{ fontStyle: 'italic' }}>dịu dàng</Text></Text>

          {/* Search */}
          <View style={s.searchBar}>
            <Text style={{ color: V.textMuted, fontSize: 15 }}>🔍</Text>
            <TextInput
              style={s.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Tìm âm thanh yêu thích…"
              placeholderTextColor={V.textMuted}
            />
          </View>

          {/* Category chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -20, marginTop: 14 }}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 6 }}>
            {CATEGORIES.map((c, i) => (
              <BotanicalPill key={c} active={activeCat === i} onPress={() => { setActiveCat(i); Haptics.selectionAsync(); }}>
                {c}
              </BotanicalPill>
            ))}
          </ScrollView>

          {/* Sound grid */}
          <View style={s.grid}>
            {filtered.map((sound, i) => (
              <TouchableOpacity
                key={i}
                style={{ width: '47.5%' }}
                activeOpacity={0.8}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/therapy' as any); }}
              >
                <BotanicalCard tint={sound.tint} style={{ padding: 14, minHeight: 140 }}>
                  <View style={{ alignItems: 'center', marginBottom: 6 }}>{sound.ill}</View>
                  <Text style={s.soundName}>{sound.name}</Text>
                  <Text style={s.soundSub}>{sound.sub}</Text>
                </BotanicalCard>
              </TouchableOpacity>
            ))}
          </View>

        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  eyebrow:     { fontSize: 20, fontWeight: '600', color: V.sage },
  title:       { fontSize: 28, fontWeight: '500', color: V.cream, letterSpacing: -0.5, lineHeight: 34, marginBottom: 14 },
  searchBar:   { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, paddingHorizontal: 16, borderRadius: 999, backgroundColor: 'rgba(245,237,224,0.06)', borderWidth: 1, borderColor: 'rgba(245,237,224,0.08)' },
  searchInput: { flex: 1, fontSize: 14, color: V.textPrimary, fontWeight: '500' },
  grid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  soundName:   { fontSize: 16, fontWeight: '500', color: V.cream, letterSpacing: -0.2 },
  soundSub:    { fontSize: 11, color: V.textMuted, fontWeight: '600', marginTop: 2 },
});
