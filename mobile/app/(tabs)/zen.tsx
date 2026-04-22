import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { V } from '@/constants/theme';
import {
  FloatingLeavesBackground, BotanicalCard, Vine,
  BreathingFlower, Fern, Bamboo, Moonflower, Wildflower, Sakura,
} from '@/components/botanical';

type CardTint = 'petal' | 'sage' | 'sky' | 'terra' | 'default';

const TOOLS: { name: string; sub: string; ill: React.ReactNode; tint: CardTint; route: string }[] = [
  { name: 'Hơi thở',       sub: 'An thần · 4·7·8',         ill: <BreathingFlower size={70} animate={false} />, tint: 'petal', route: '/breathing'      },
  { name: 'Notch trị liệu',sub: 'Tần số cá nhân hóa',       ill: <Fern size={60} />,                            tint: 'sage',  route: '/notch-therapy'   },
  { name: 'Zentones',       sub: 'Âm bội thiên nhiên',       ill: <Bamboo size={62} />,                          tint: 'sky',   route: '/zentones'        },
  { name: 'Giấc ngủ',       sub: 'Ru đêm 30 phút',          ill: <Moonflower size={70} />,                      tint: 'petal', route: '/sleep'           },
  { name: 'CBT-i',          sub: 'Liệu trình 4 tuần',        ill: <Wildflower size={62} />,                      tint: 'terra', route: '/cbti'            },
  { name: 'Nhật ký',        sub: 'Tâm tình mỗi ngày',        ill: <Sakura size={62} />,                          tint: 'petal', route: '/journal'         },
];

export default function ZenScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: V.bg }}>
      <FloatingLeavesBackground count={4} />
      <View style={{ position: 'absolute', top: 80, right: -20 }}>
        <Vine width={120} opacity={0.14} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: 20, paddingTop: 8 }}>

          <Text style={s.eyebrow}>khu vườn riêng</Text>
          <Text style={s.title}>Sáu lối <Text style={{ fontStyle: 'italic' }}>chữa lành</Text></Text>
          <Text style={s.subtitle}>Chọn một lối đi hôm nay. Mỗi công cụ là một góc nhỏ cho bạn nghỉ ngơi.</Text>

          <View style={{ gap: 12, marginTop: 20 }}>
            {TOOLS.map(tool => (
              <TouchableOpacity
                key={tool.name}
                activeOpacity={0.8}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(tool.route as any); }}
              >
                <BotanicalCard tint={tool.tint} style={{ padding: 0 }}>
                  <View style={s.toolRow}>
                    <View style={s.toolIllust}>{tool.ill}</View>
                    <View style={{ flex: 1, marginLeft: 4 }}>
                      <Text style={s.toolName}>{tool.name}</Text>
                      <Text style={s.toolSub}>{tool.sub}</Text>
                    </View>
                    <View style={s.chevronBtn}>
                      <ChevronRight size={14} color={V.textMuted} />
                    </View>
                  </View>
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
  eyebrow:    { fontSize: 20, fontWeight: '600', color: V.sage },
  title:      { fontSize: 28, fontWeight: '500', color: V.cream, letterSpacing: -0.5, lineHeight: 34, marginTop: 2 },
  subtitle:   { fontSize: 14, color: V.textMuted, fontWeight: '500', marginTop: 6, maxWidth: 300, lineHeight: 20 },
  toolRow:    { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 4, minHeight: 92 },
  toolIllust: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  toolName:   { fontSize: 20, fontWeight: '500', color: V.cream, letterSpacing: -0.3 },
  toolSub:    { fontSize: 13, color: V.textSecondary, fontWeight: '500', marginTop: 2 },
  chevronBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(245,237,224,0.08)', alignItems: 'center', justifyContent: 'center' },
});
