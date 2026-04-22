import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Check, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '@/store/use-user-store';
import { useLangStore } from '@/store/use-lang-store';

const { width } = Dimensions.get('window');

interface PlanFeature {
  textEn: string;
  textVi: string;
}

interface Plan {
  tier: 'free' | 'premium' | 'pro' | 'ultra';
  nameEn: string;
  nameVi: string;
  emoji: string;
  priceUSD: number;
  priceVND: number;
  featuresEn: string[];
  featuresVi: string[];
  highlighted: boolean;
  color: string;
}

const PLANS: Plan[] = [
  {
    tier: 'free',
    nameEn: 'Free',
    nameVi: 'Miễn phí',
    emoji: '🌱',
    priceUSD: 0,
    priceVND: 0,
    featuresEn: [
      'Basic sound therapy',
      '3 free sounds',
      'Limited AI chat (10/day)',
      'Basic progress tracking',
    ],
    featuresVi: [
      'Âm thanh trị liệu cơ bản',
      '3 âm thanh miễn phí',
      'Chat AI giới hạn (10/ngày)',
      'Theo dõi tiến độ cơ bản',
    ],
    highlighted: false,
    color: '#7A9686',
  },
  {
    tier: 'premium',
    nameEn: 'Premium',
    nameVi: 'Premium',
    emoji: '💎',
    priceUSD: 4.99,
    priceVND: 99000,
    featuresEn: [
      'All free features',
      'Unlimited sounds',
      'Unlimited AI chat',
      'Hearing test',
      'Progress charts',
      'Sleep mode',
    ],
    featuresVi: [
      'Tất cả tính năng Free',
      'Không giới hạn âm thanh',
      'Chat AI không giới hạn',
      'Kiểm tra thính lực',
      'Biểu đồ tiến độ',
      'Chế độ ngủ',
    ],
    highlighted: false,
    color: '#3B82F6',
  },
  {
    tier: 'pro',
    nameEn: 'Pro',
    nameVi: 'Pro',
    emoji: '⚡',
    priceUSD: 9.99,
    priceVND: 199000,
    featuresEn: [
      'All Premium features',
      'Sound mixer',
      'Notch therapy',
      'CBT-i program',
      'Advanced analytics',
      'Priority support',
    ],
    featuresVi: [
      'Tất cả tính năng Premium',
      'Trộn âm thanh',
      'Liệu pháp lọc',
      'Chương trình CBT-i',
      'Phân tích nâng cao',
      'Hỗ trợ ưu tiên',
    ],
    highlighted: true,
    color: '#8B5CF6',
  },
  {
    tier: 'ultra',
    nameEn: 'Ultra',
    nameVi: 'Ultra',
    emoji: '✨',
    priceUSD: 14.99,
    priceVND: 299000,
    featuresEn: [
      'All Pro features',
      'Zentones ✨',
      'Fractal music therapy',
      'Custom AI training',
      'Offline mode',
      'Early access to features',
    ],
    featuresVi: [
      'Tất cả tính năng Pro',
      'Zentones ✨',
      'Liệu pháp nhạc fractal',
      'Tùy chỉnh AI',
      'Chế độ offline',
      'Truy cập sớm tính năng mới',
    ],
    highlighted: false,
    color: '#F59E0B',
  },
];

export default function PricingScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const { lang } = useLangStore();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleUpgrade = (tier: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Implement payment flow
    console.log('Upgrade to', tier);
  };

  const getPrice = (plan: Plan) => {
    const price = lang === 'vi' ? plan.priceVND : plan.priceUSD;
    if (price === 0) return lang === 'vi' ? 'Miễn phí' : 'Free';

    const currency = lang === 'vi' ? '₫' : '$';
    const formattedPrice = lang === 'vi'
      ? price.toLocaleString('vi-VN')
      : price.toFixed(2);

    return `${currency}${formattedPrice}/${lang === 'vi' ? 'tháng' : 'mo'}`;
  };

  const isCurrentPlan = (tier: string) => {
    return user?.subscription_tier === tier;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#E8F0EB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {lang === 'vi' ? 'Bảng giá' : 'Pricing'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Billing Cycle Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            billingCycle === 'monthly' && styles.toggleBtnActive,
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            setBillingCycle('monthly');
          }}
        >
          <Text style={[
            styles.toggleText,
            billingCycle === 'monthly' && styles.toggleTextActive,
          ]}>
            {lang === 'vi' ? 'Hàng tháng' : 'Monthly'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            billingCycle === 'yearly' && styles.toggleBtnActive,
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            setBillingCycle('yearly');
          }}
        >
          <Text style={[
            styles.toggleText,
            billingCycle === 'yearly' && styles.toggleTextActive,
          ]}>
            {lang === 'vi' ? 'Hàng năm' : 'Yearly'}
          </Text>
          <View style={styles.saveBadge}>
            <Text style={styles.saveText}>-20%</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {PLANS.map((plan) => {
          const isCurrent = isCurrentPlan(plan.tier);
          const name = lang === 'vi' ? plan.nameVi : plan.nameEn;
          const features = lang === 'vi' ? plan.featuresVi : plan.featuresEn;

          return (
            <View
              key={plan.tier}
              style={[
                styles.planCard,
                plan.highlighted && styles.planCardHighlighted,
                isCurrent && styles.planCardCurrent,
              ]}
            >
              {plan.highlighted && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>
                    {lang === 'vi' ? 'Phổ biến nhất' : 'Most Popular'}
                  </Text>
                </View>
              )}

              {isCurrent && (
                <View style={[styles.currentBadge, { backgroundColor: plan.color }]}>
                  <Text style={styles.currentText}>
                    {lang === 'vi' ? 'Gói hiện tại' : 'Current Plan'}
                  </Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <Text style={styles.planEmoji}>{plan.emoji}</Text>
                <Text style={styles.planName}>{name}</Text>
                <Text style={styles.planPrice}>{getPrice(plan)}</Text>
              </View>

              <View style={styles.featuresList}>
                {features.map((feature, idx) => (
                  <View key={idx} style={styles.featureRow}>
                    <View style={[styles.checkIcon, { backgroundColor: plan.color + '20' }]}>
                      <Check size={14} color={plan.color} />
                    </View>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.upgradeBtn,
                  isCurrent && styles.upgradeBtnDisabled,
                  { backgroundColor: isCurrent ? '#3D5445' : plan.color },
                ]}
                onPress={() => !isCurrent && handleUpgrade(plan.tier)}
                disabled={isCurrent}
                activeOpacity={0.8}
              >
                <Text style={styles.upgradeBtnText}>
                  {isCurrent
                    ? (lang === 'vi' ? 'Gói hiện tại' : 'Current Plan')
                    : (lang === 'vi' ? 'Nâng cấp' : 'Upgrade')
                  }
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            {lang === 'vi'
              ? '• Hủy bất cứ lúc nào\n• Thanh toán an toàn qua Stripe\n• Hỗ trợ 24/7'
              : '• Cancel anytime\n• Secure payment via Stripe\n• 24/7 support'
            }
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1410',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8F0EB',
    letterSpacing: 0.2,
  },

  // Toggle
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1F2E25',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  toggleBtnActive: {
    backgroundColor: '#7A3B1E',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3D5445',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  saveBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  saveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Plan Card
  planCard: {
    backgroundColor: '#1F2E25',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#3D5445',
    padding: 20,
    marginBottom: 16,
    position: 'relative',
  },
  planCardHighlighted: {
    borderColor: '#8B5CF6',
    borderWidth: 2,
  },
  planCardCurrent: {
    opacity: 0.7,
  },

  popularBadge: {
    position: 'absolute',
    top: -12,
    left: 20,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  currentBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  currentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  planHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  planEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  planName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E8F0EB',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7A9686',
  },

  featuresList: {
    marginBottom: 20,
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#BDD0C3',
    lineHeight: 20,
  },

  upgradeBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  upgradeBtnDisabled: {
    opacity: 0.5,
  },
  upgradeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  disclaimer: {
    marginTop: 8,
    paddingHorizontal: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#3D5445',
    lineHeight: 20,
    textAlign: 'center',
  },
});
