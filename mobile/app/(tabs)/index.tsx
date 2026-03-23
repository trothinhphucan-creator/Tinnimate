import React, { useState, useEffect } from 'react';
import {
  StyleSheet, TouchableOpacity, Text, View,
  ScrollView, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  MessageSquare, Music, TestTube, TrendingUp,
  BookOpen, Moon, Sparkles, User,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '@/store/use-user-store';
import { useLangStore } from '@/store/use-lang-store';

const { width } = Dimensions.get('window');

interface QuickAction {
  id: string;
  titleEn: string;
  titleVi: string;
  descEn: string;
  descVi: string;
  icon: any;
  color: string;
  route: string;
  badge?: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'chat',
    titleEn: 'Chat with Tinni',
    titleVi: 'Chat với Tinni',
    descEn: 'AI tinnitus coach',
    descVi: 'Trợ lý AI ù tai',
    icon: MessageSquare,
    color: '#06B6D4',
    route: '/chat',
  },
  {
    id: 'therapy',
    titleEn: 'Sound Therapy',
    titleVi: 'Âm thanh trị liệu',
    descEn: 'Healing sounds',
    descVi: 'Âm thanh chữa lành',
    icon: Music,
    color: '#8B5CF6',
    route: '/therapy',
  },
  {
    id: 'hearing',
    titleEn: 'Hearing Test',
    titleVi: 'Kiểm tra tai',
    descEn: 'Test 6 frequencies',
    descVi: 'Đo 6 tần số',
    icon: TestTube,
    color: '#F59E0B',
    route: '/hearing-test',
  },
  {
    id: 'progress',
    titleEn: 'My Progress',
    titleVi: 'Tiến độ',
    descEn: 'Track improvement',
    descVi: 'Theo dõi cải thiện',
    icon: TrendingUp,
    color: '#10B981',
    route: '/progress',
  },
  {
    id: 'zentones',
    titleEn: 'Zentones',
    titleVi: 'Zentones',
    descEn: 'Fractal music',
    descVi: 'Nhạc fractal',
    icon: Sparkles,
    color: '#F59E0B',
    route: '/zentones',
    badge: 'Ultra',
  },
  {
    id: 'sleep',
    titleEn: 'Sleep Mode',
    titleVi: 'Chế độ ngủ',
    descEn: 'Better sleep',
    descVi: 'Ngủ ngon hơn',
    icon: Moon,
    color: '#6366F1',
    route: '/sleep',
  },
];

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const { lang } = useLangStore();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (lang === 'vi') {
      if (hour < 12) setGreeting('Chào buổi sáng');
      else if (hour < 18) setGreeting('Chào buổi chiều');
      else setGreeting('Chào buổi tối');
    } else {
      if (hour < 12) setGreeting('Good morning');
      else if (hour < 18) setGreeting('Good afternoon');
      else setGreeting('Good evening');
    }
  }, [lang]);

  const handleActionPress = (action: QuickAction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(action.route as any);
  };

  const tierColor: Record<string, string> = {
    free: '#94A3B8',
    premium: '#3B82F6',
    pro: '#8B5CF6',
    ultra: '#F59E0B',
  };

  const tierLabel: Record<string, string> = {
    free: lang === 'vi' ? 'Miễn phí' : 'Free',
    premium: 'Premium',
    pro: 'Pro',
    ultra: 'Ultra',
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.appName}>TinniMate</Text>
          <View style={[styles.tierBadge, { backgroundColor: tierColor[user?.subscription_tier || 'free'] + '20' }]}>
            <Text style={[styles.tierText, { color: tierColor[user?.subscription_tier || 'free'] }]}>
              {tierLabel[user?.subscription_tier || 'free']}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push('/profile')} style={styles.avatarBtn}>
          <View style={styles.avatar}>
            <User size={18} color="#E0E7FF" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>{greeting}</Text>
          <Text style={styles.userName}>{user?.name || user?.email?.split('@')[0] || (lang === 'vi' ? 'Bạn' : 'You')}</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>{lang === 'vi' ? 'Streak' : 'Day streak'}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>{lang === 'vi' ? 'Phiên' : 'Sessions'}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>-</Text>
            <Text style={styles.statLabel}>{lang === 'vi' ? 'Tâm trạng' : 'Mood'}</Text>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>
            {lang === 'vi' ? 'Bắt đầu nhanh' : 'Quick Actions'}
          </Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              const title = lang === 'vi' ? action.titleVi : action.titleEn;
              const desc = lang === 'vi' ? action.descVi : action.descEn;

              return (
                <TouchableOpacity
                  key={action.id}
                  style={styles.actionCard}
                  onPress={() => handleActionPress(action)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIconContainer, { backgroundColor: action.color + '20' }]}>
                    <Icon size={24} color={action.color} />
                  </View>
                  <View style={styles.actionContent}>
                    <View style={styles.actionTitleRow}>
                      <Text style={styles.actionTitle}>{title}</Text>
                      {action.badge && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{action.badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.actionDesc}>{desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Today's Check-in */}
        <View style={styles.checkinSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {lang === 'vi' ? 'Check-in hôm nay' : "Today's Check-in"}
            </Text>
            <TouchableOpacity onPress={() => router.push('/chat')}>
              <Text style={styles.seeAllText}>
                {lang === 'vi' ? 'Ghi nhận' : 'Log'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.checkinCard}>
            <Text style={styles.checkinPlaceholder}>
              {lang === 'vi' ? 'Chưa có check-in hôm nay' : 'No check-in today'}
            </Text>
            <Text style={styles.checkinSubtext}>
              {lang === 'vi' ? 'Ghi lại tâm trạng và triệu chứng của bạn' : 'Record your mood and symptoms'}
            </Text>
          </View>
        </View>

        {/* Recent Assessments */}
        <View style={styles.assessmentsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {lang === 'vi' ? 'Đánh giá gần đây' : 'Recent Assessments'}
            </Text>
            <TouchableOpacity onPress={() => router.push('/progress')}>
              <Text style={styles.seeAllText}>
                {lang === 'vi' ? 'Xem tất cả' : 'View all'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.assessmentCard}>
            <Text style={styles.assessmentPlaceholder}>
              {lang === 'vi' ? 'Chưa có bài đánh giá' : 'No assessments yet'}
            </Text>
            <Text style={styles.assessmentSubtext}>
              {lang === 'vi' ? 'Làm bài đánh giá để theo dõi tiến độ' : 'Take an assessment to track progress'}
            </Text>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E0E7FF',
    letterSpacing: 0.3,
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  avatarBtn: {},
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Greeting
  greetingSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#E0E7FF',
    letterSpacing: 0.3,
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E0E7FF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },

  // Actions Section
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E0E7FF',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  actionsGrid: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    alignItems: 'center',
    gap: 14,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E0E7FF',
  },
  badge: {
    backgroundColor: '#F59E0B20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F59E0B',
    letterSpacing: 0.3,
  },
  actionDesc: {
    fontSize: 12,
    color: '#64748B',
  },

  // Check-in Section
  checkinSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#818CF8',
  },
  checkinCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 20,
    alignItems: 'center',
  },
  checkinPlaceholder: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
  },
  checkinSubtext: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },

  // Assessments Section
  assessmentsSection: {
    paddingHorizontal: 20,
  },
  assessmentCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 20,
    alignItems: 'center',
  },
  assessmentPlaceholder: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
  },
  assessmentSubtext: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});
