import React, { useState, useEffect } from 'react';
import {
  StyleSheet, TouchableOpacity, Text, View,
  ScrollView, Dimensions, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  MessageSquare, Music, TestTube, TrendingUp,
  Moon, Sparkles, Play, ChevronRight, Zap,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '@/store/use-user-store';
import { useLangStore } from '@/store/use-lang-store';
import Svg, { Circle } from 'react-native-svg';
import { V } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface QuickAction {
  id: string;
  titleEn: string;
  titleVi: string;
  icon: any;
  color: string;
  route: string;
  emoji: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'chat', titleEn: 'AI Chat', titleVi: 'Chat AI', icon: MessageSquare, color: V.secondary, route: '/chat', emoji: '💬' },
  { id: 'therapy', titleEn: 'Sounds', titleVi: 'Âm thanh', icon: Music, color: '#A78BFA', route: '/therapy', emoji: '🎵' },
  { id: 'hearing', titleEn: 'Hearing', titleVi: 'Thính lực', icon: TestTube, color: V.primary, route: '/hearing-test', emoji: '👂' },
  { id: 'progress', titleEn: 'Progress', titleVi: 'Tiến độ', icon: TrendingUp, color: '#94D3C1', route: '/progress', emoji: '📊' },
  { id: 'sleep', titleEn: 'Sleep', titleVi: 'Giấc ngủ', icon: Moon, color: '#5B4BC4', route: '/sleep', emoji: '😴' },
  { id: 'zentones', titleEn: 'Zentones', titleVi: 'Zentones', icon: Sparkles, color: V.primary, route: '/zentones', emoji: '✨' },
];

// Circular progress component
function ReliefRing({ percent = 72, size = 160 }: { percent?: number; size?: number }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {/* Track */}
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={V.surfaceHighest}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress */}
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={V.secondary}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 36, fontWeight: '700', color: V.textPrimary }}>{percent}%</Text>
        <Text style={{ fontSize: 11, color: V.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
          Relief
        </Text>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const { lang } = useLangStore();
  const [greeting, setGreeting] = useState('');

  // Animate the gradient glow
  const glowAnim = React.useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

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

  const displayName = user?.name || user?.email?.split('@')[0] || (lang === 'vi' ? 'Bạn' : 'You');

  const handleActionPress = (action: QuickAction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(action.route as any);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Gradient Hero Header ── */}
        <LinearGradient
          colors={['#3D2B85', '#5B4BC4', '#4533AD', V.bg]}
          locations={[0, 0.3, 0.7, 1]}
          style={styles.heroGradient}
        >
          <SafeAreaView edges={['top']}>
            {/* Top bar */}
            <View style={styles.topBar}>
              <View>
                <Text style={styles.greetingText}>{greeting},</Text>
                <Text style={styles.userName}>{displayName} ✨</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/profile')}
                style={styles.avatarBtn}
              >
                <LinearGradient
                  colors={[V.secondaryContainer, V.surfaceHighest]}
                  style={styles.avatar}
                >
                  <Text style={{ fontSize: 18 }}>
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Relief Ring */}
            <View style={styles.ringArea}>
              <Animated.View style={{
                opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.8] }),
                transform: [{ scale: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) }],
              }}>
                <ReliefRing percent={72} size={170} />
              </Animated.View>
              <Text style={styles.ringSubtext}>
                {lang === 'vi' ? 'Tiến trình giảm ù tai' : 'Tinnitus relief progress'}
              </Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* ── Quick Actions (Horizontal Scroll Pills) ── */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionLabel}>
            {lang === 'vi' ? 'BẮT ĐẦU NHANH' : 'QUICK START'}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillRow}
          >
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionPill}
                onPress={() => handleActionPress(action)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[action.color + '25', action.color + '08']}
                  style={styles.pillGradient}
                >
                  <Text style={styles.pillEmoji}>{action.emoji}</Text>
                  <Text style={[styles.pillText, { color: action.color }]}>
                    {lang === 'vi' ? action.titleVi : action.titleEn}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Today's Session Card ── */}
        <View style={styles.sessionSection}>
          <Text style={styles.sectionLabel}>
            {lang === 'vi' ? 'PHIÊN HÔM NAY' : "TODAY'S SESSION"}
          </Text>
          <TouchableOpacity
            style={styles.sessionCard}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/therapy'); }}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#3D2B85', '#5B4BC4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sessionGradient}
            >
              {/* Decorative circles */}
              <View style={styles.decoCircle1} />
              <View style={styles.decoCircle2} />

              <View style={styles.sessionContent}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sessionBadge}>
                    🎯 {lang === 'vi' ? 'Đề xuất' : 'Recommended'}
                  </Text>
                  <Text style={styles.sessionTitle}>
                    {lang === 'vi' ? 'Sóng Đại Dương Sâu' : 'Deep Ocean Waves'}
                  </Text>
                  <Text style={styles.sessionDesc}>
                    {lang === 'vi'
                      ? 'Dựa trên hồ sơ ù tai của bạn'
                      : 'Based on your tinnitus profile'}
                  </Text>
                </View>
                <View style={styles.playCircle}>
                  <Play size={20} color="#fff" fill="#fff" style={{ marginLeft: 2 }} />
                </View>
              </View>

              <View style={styles.sessionMeta}>
                <Text style={styles.sessionDuration}>30 {lang === 'vi' ? 'phút' : 'min'}</Text>
                <Text style={styles.sessionDot}>•</Text>
                <Text style={styles.sessionDuration}>{lang === 'vi' ? 'Thư giãn sâu' : 'Deep Relaxation'}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Stats Row ── */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionLabel}>
            {lang === 'vi' ? 'THỐNG KÊ' : 'YOUR STATS'}
          </Text>
          <View style={styles.statsGrid}>
            {[
              { value: '0', label: lang === 'vi' ? 'Streak' : 'Day streak', emoji: '🔥' },
              { value: '0', label: lang === 'vi' ? 'Phiên' : 'Sessions', emoji: '🎧' },
              { value: '-', label: lang === 'vi' ? 'Tâm trạng' : 'Mood', emoji: '😊' },
            ].map((stat, i) => (
              <View key={i} style={styles.statCard}>
                <Text style={styles.statEmoji}>{stat.emoji}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Check-in CTA ── */}
        <View style={styles.checkinSection}>
          <TouchableOpacity
            style={styles.checkinBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/journal'); }}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[V.primary, '#FFA726']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.checkinGradient}
            >
              <Text style={styles.checkinText}>
                {lang === 'vi' ? 'CHECK IN HÔM NAY' : 'CHECK IN TODAY'}
              </Text>
              <ChevronRight size={18} color={V.primaryDark} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Explore Tools ── */}
        <View style={styles.toolsSection}>
          <View style={styles.toolsHeader}>
            <Text style={styles.sectionLabel}>
              {lang === 'vi' ? 'CÔNG CỤ TRỊ LIỆU' : 'THERAPY TOOLS'}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/zen')}>
              <Text style={styles.seeAll}>
                {lang === 'vi' ? 'Xem tất cả' : 'View all'} →
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.toolsGrid}>
            {[
              { emoji: '🌬️', title: lang === 'vi' ? 'Bài tập thở' : 'Breathing', route: '/breathing', color: '#06B6D4' },
              { emoji: '🧠', title: 'CBT-i', route: '/cbti', color: '#0EA5E9' },
              { emoji: '🎯', title: 'Notch', route: '/notch-therapy', color: '#7C3AED' },
              { emoji: '📔', title: lang === 'vi' ? 'Nhật ký' : 'Journal', route: '/journal', color: V.primary },
            ].map((tool, i) => (
              <TouchableOpacity
                key={i}
                style={styles.toolCard}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(tool.route as any); }}
                activeOpacity={0.8}
              >
                <View style={[styles.toolIconBg, { backgroundColor: tool.color + '18' }]}>
                  <Text style={{ fontSize: 24 }}>{tool.emoji}</Text>
                </View>
                <Text style={styles.toolTitle}>{tool.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: V.bg,
  },
  scrollContent: {
    paddingBottom: 0,
  },

  // ── Hero Gradient ──
  heroGradient: {
    paddingBottom: 32,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  greetingText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 2,
  },
  userName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  avatarBtn: {},
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Relief Ring ──
  ringArea: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 8,
  },
  ringSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 12,
    letterSpacing: 0.5,
  },

  // ── Quick Actions ──
  actionsSection: {
    paddingTop: 24,
    paddingLeft: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: V.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  pillRow: {
    gap: 10,
    paddingRight: 20,
  },
  actionPill: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  pillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(199,191,255,0.1)',
  },
  pillEmoji: {
    fontSize: 18,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Today's Session ──
  sessionSection: {
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  sessionCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  sessionGradient: {
    padding: 20,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  decoCircle1: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decoCircle2: {
    position: 'absolute',
    right: 20,
    bottom: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  sessionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  sessionBadge: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginBottom: 6,
  },
  sessionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  sessionDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  playCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  sessionDuration: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  sessionDot: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.3)',
  },

  // ── Stats ──
  statsSection: {
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: V.surface,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: V.outlineVariant + '30',
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: V.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: V.textMuted,
    textAlign: 'center',
  },

  // ── Check-in CTA ──
  checkinSection: {
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  checkinBtn: {
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: V.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  checkinGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 100,
  },
  checkinText: {
    fontSize: 15,
    fontWeight: '800',
    color: V.primaryDark,
    letterSpacing: 1,
  },

  // ── Tools Grid ──
  toolsSection: {
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  toolsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '600',
    color: V.secondary,
  },
  toolsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  toolCard: {
    flex: 1,
    backgroundColor: V.surface,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: V.outlineVariant + '20',
  },
  toolIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: V.textSecondary,
    textAlign: 'center',
  },
});
