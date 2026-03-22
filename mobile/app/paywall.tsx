import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  ScrollView, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Check, Zap, Brain, Headphones, BarChart3, Shield } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { TinniOrb } from '@/components/TinniOrb';

const { width } = Dimensions.get('window');

// ── Plan data ─────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'free',
    name: 'Miễn phí',
    price: '0₫',
    period: '',
    color: '#64748B',
    highlight: false,
    features: [
      '3 âm thanh trị liệu',
      'Check-in mỗi ngày',
      '10 tin nhắn Tinni/ngày',
      'Bài tập thở cơ bản',
    ],
    locked: [
      'Notch therapy cá nhân hóa',
      'Zentitone tần số tuỳ chỉnh',
      'Báo cáo tiến trình sâu',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '99.000₫',
    period: '/tháng',
    color: '#6366F1',
    highlight: true,
    badge: '⭐ Phổ biến nhất',
    features: [
      'Tất cả âm thanh + White Noise',
      'Notch therapy cá nhân hóa',
      'Zentitone • tần số tuỳ chỉnh',
      'Tinni AI không giới hạn',
      'Nhật ký & báo cáo chi tiết',
      'Ngủ & thiền không giới hạn',
    ],
    locked: [],
  },
  {
    id: 'annual',
    name: 'Pro Năm',
    price: '799.000₫',
    period: '/năm',
    color: '#A855F7',
    highlight: false,
    badge: '🔥 Tiết kiệm 33%',
    features: [
      'Mọi tính năng Pro',
      'Ưu tiên hỗ trợ',
      'Truy cập tính năng beta',
    ],
    locked: [],
  },
];

const BENEFITS = [
  { icon: Headphones, text: 'Âm thanh trị liệu không giới hạn' },
  { icon: Brain,      text: 'Notch therapy cá nhân theo tần số ù tai' },
  { icon: Zap,        text: 'Zentitone — tone trị liệu tùy chỉnh' },
  { icon: BarChart3,  text: 'Báo cáo tiến trình & điểm THI theo thời gian' },
];

// ── Plan card ─────────────────────────────────────────────────────────────
function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: typeof PLANS[0];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.planCard,
        selected && { borderColor: plan.color, backgroundColor: plan.color + '12' },
        plan.highlight && styles.planCardHighlight,
      ]}
      onPress={onSelect}
      activeOpacity={0.8}>

      {plan.badge && (
        <View style={[styles.planBadge, { backgroundColor: plan.color + '25' }]}>
          <Text style={[styles.planBadgeText, { color: plan.color }]}>{plan.badge}</Text>
        </View>
      )}

      <View style={styles.planHeader}>
        <View style={[styles.radio, selected && { backgroundColor: plan.color, borderColor: plan.color }]}>
          {selected && <View style={styles.radioDot} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.planName}>{plan.name}</Text>
          <View style={styles.priceRow}>
            <Text style={[styles.planPrice, { color: plan.color }]}>{plan.price}</Text>
            {plan.period ? <Text style={styles.planPeriod}>{plan.period}</Text> : null}
          </View>
        </View>
      </View>

      <View style={styles.featureList}>
        {plan.features.map(f => (
          <View key={f} style={styles.featureRow}>
            <Check size={13} color={plan.color} />
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
        {plan.locked.map(f => (
          <View key={f} style={styles.featureRow}>
            <Shield size={13} color="#1E293B" />
            <Text style={[styles.featureText, styles.featureLocked]}>{f}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

export default function PaywallScreen() {
  const [selected, setSelected] = useState('pro');
  const [loading, setLoading]   = useState(false);
  const router = useRouter();

  function select(id: string) {
    Haptics.selectionAsync();
    setSelected(id);
  }

  async function handleSubscribe() {
    if (selected === 'free') {
      router.replace('/(tabs)');
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: integrate with Stripe/MoMo via web app
    // For now: open webapp payment page
    const plan = PLANS.find(p => p.id === selected);
    router.push(`https://tinnimate.vuinghe.com/pricing?plan=${selected}` as any);
    setLoading(false);
  }

  const plan = PLANS.find(p => p.id === selected)!;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#94A3B8" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nâng cấp tài khoản</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero */}
        <View style={styles.hero}>
          <TinniOrb mode="playing" size={90} />
          <Text style={styles.heroTitle}>Trải nghiệm{'\n'}Tinnimate đầy đủ</Text>
          <Text style={styles.heroSub}>Giải pháp toàn diện cho ù tai mãn tính</Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsRow}>
          {BENEFITS.map(({ icon: Icon, text }) => (
            <View key={text} style={styles.benefit}>
              <View style={styles.benefitIcon}>
                <Icon size={18} color="#6366F1" />
              </View>
              <Text style={styles.benefitText}>{text}</Text>
            </View>
          ))}
        </View>

        {/* Plans */}
        <Text style={styles.sectionLabel}>Chọn gói phù hợp</Text>
        <View style={styles.plansList}>
          {PLANS.map(p => (
            <PlanCard
              key={p.id}
              plan={p}
              selected={selected === p.id}
              onSelect={() => select(p.id)}
            />
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: plan.color, opacity: loading ? 0.7 : 1 }]}
          onPress={handleSubscribe}
          disabled={loading}
          activeOpacity={0.85}>
          <Text style={styles.ctaText}>
            {selected === 'free' ? 'Dùng miễn phí' : `Đăng ký ${plan.name} →`}
          </Text>
        </TouchableOpacity>

        <Text style={styles.legalNote}>
          Thanh toán an toàn • Hủy bất kỳ lúc nào • Không ràng buộc
        </Text>
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

  hero: { alignItems: 'center', marginBottom: 24 },
  heroTitle: {
    fontSize: 26, fontWeight: '900', color: '#E0E7FF',
    textAlign: 'center', marginTop: 16, letterSpacing: -0.5, lineHeight: 32,
  },
  heroSub: { fontSize: 13, color: '#475569', marginTop: 6, textAlign: 'center' },

  benefitsRow: { gap: 10, marginBottom: 28 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#6366F118', alignItems: 'center', justifyContent: 'center',
  },
  benefitText: { fontSize: 14, color: '#CBD5E1', flex: 1, lineHeight: 20 },

  sectionLabel: {
    fontSize: 11, color: '#334155', fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12,
  },
  plansList: { gap: 12, marginBottom: 24 },

  planCard: {
    backgroundColor: '#0F172A', borderRadius: 18,
    borderWidth: 1.5, borderColor: '#1E293B', padding: 16,
  },
  planCardHighlight: {
    borderColor: '#6366F1',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  planBadge: {
    alignSelf: 'flex-start', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10,
  },
  planBadgeText: { fontSize: 11, fontWeight: '700' },

  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: '#334155', alignItems: 'center', justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },

  planName: { fontSize: 15, fontWeight: '700', color: '#E0E7FF' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginTop: 2 },
  planPrice: { fontSize: 20, fontWeight: '900' },
  planPeriod: { fontSize: 12, color: '#64748B' },

  featureList: { gap: 7 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 13, color: '#94A3B8', flex: 1 },
  featureLocked: { color: '#1E293B' },

  ctaBtn: {
    borderRadius: 100, paddingVertical: 17,
    alignItems: 'center', marginBottom: 14,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10,
  },
  ctaText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },

  legalNote: { textAlign: 'center', fontSize: 11, color: '#1E293B', lineHeight: 16 },
});
