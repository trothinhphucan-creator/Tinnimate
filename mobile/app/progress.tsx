import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft, TrendingUp, TrendingDown, Minus,
  Calendar, Headphones, Brain, Moon,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useLangStore } from '@/store/use-lang-store';

const { width } = Dimensions.get('window');

interface StatCard {
  id: string;
  titleEn: string;
  titleVi: string;
  value: string;
  change: number;
  icon: any;
  color: string;
}

const MOCK_STATS: StatCard[] = [
  {
    id: 'streak',
    titleEn: 'Day Streak',
    titleVi: 'Streak',
    value: '7',
    change: 2,
    icon: Calendar,
    color: '#F59E0B',
  },
  {
    id: 'sessions',
    titleEn: 'Therapy Sessions',
    titleVi: 'Phiên trị liệu',
    value: '24',
    change: 5,
    icon: Headphones,
    color: '#8B5CF6',
  },
  {
    id: 'tinnitus',
    titleEn: 'Tinnitus Level',
    titleVi: 'Mức ù tai',
    value: '6/10',
    change: -1,
    icon: Brain,
    color: '#10B981',
  },
  {
    id: 'sleep',
    titleEn: 'Sleep Quality',
    titleVi: 'Chất lượng ngủ',
    value: '7/10',
    change: 1,
    icon: Moon,
    color: '#6366F1',
  },
];

interface AssessmentHistory {
  date: string;
  type: string;
  score: number;
  maxScore: number;
}

const MOCK_ASSESSMENTS: AssessmentHistory[] = [
  { date: '2026-03-20', type: 'THI', score: 42, maxScore: 100 },
  { date: '2026-03-15', type: 'PHQ-9', score: 8, maxScore: 27 },
  { date: '2026-03-10', type: 'GAD-7', score: 5, maxScore: 21 },
  { date: '2026-03-05', type: 'ISI', score: 12, maxScore: 28 },
];

export default function ProgressScreen() {
  const router = useRouter();
  const { lang } = useLangStore();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');

  const getChangeIcon = (change: number) => {
    if (change > 0) return TrendingUp;
    if (change < 0) return TrendingDown;
    return Minus;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return '#10B981';
    if (change < 0) return '#EF4444';
    return '#94A3B8';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (lang === 'vi') {
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getSeverityLabel = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage < 25) {
      return { text: lang === 'vi' ? 'Nhẹ' : 'Mild', color: '#10B981' };
    }
    if (percentage < 50) {
      return { text: lang === 'vi' ? 'Trung bình' : 'Moderate', color: '#F59E0B' };
    }
    if (percentage < 75) {
      return { text: lang === 'vi' ? 'Nặng' : 'Severe', color: '#F97316' };
    }
    return { text: lang === 'vi' ? 'Rất nặng' : 'Very Severe', color: '#EF4444' };
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#E0E7FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {lang === 'vi' ? 'Tiến độ' : 'Progress'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          {(['week', 'month', 'year'] as const).map((range) => {
            const isActive = timeRange === range;
            const label =
              range === 'week'
                ? (lang === 'vi' ? 'Tuần' : 'Week')
                : range === 'month'
                ? (lang === 'vi' ? 'Tháng' : 'Month')
                : (lang === 'vi' ? 'Năm' : 'Year');

            return (
              <TouchableOpacity
                key={range}
                style={[
                  styles.timeRangeBtn,
                  isActive && styles.timeRangeBtnActive,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setTimeRange(range);
                }}
              >
                <Text
                  style={[
                    styles.timeRangeText,
                    isActive && styles.timeRangeTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {MOCK_STATS.map((stat) => {
            const Icon = stat.icon;
            const ChangeIcon = getChangeIcon(stat.change);
            const changeColor = getChangeColor(stat.change);
            const title = lang === 'vi' ? stat.titleVi : stat.titleEn;

            return (
              <View key={stat.id} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                  <Icon size={20} color={stat.color} />
                </View>
                <Text style={styles.statTitle}>{title}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
                <View style={styles.statChange}>
                  <ChangeIcon size={14} color={changeColor} />
                  <Text style={[styles.statChangeText, { color: changeColor }]}>
                    {Math.abs(stat.change)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Weekly Chart Placeholder */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>
            {lang === 'vi' ? 'Biểu đồ tiến độ' : 'Progress Chart'}
          </Text>
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartPlaceholderText}>
              📊 {lang === 'vi' ? 'Biểu đồ sẽ hiển thị ở đây' : 'Chart will appear here'}
            </Text>
            <Text style={styles.chartPlaceholderSubtext}>
              {lang === 'vi'
                ? 'Tiếp tục ghi nhận để xem tiến độ'
                : 'Keep logging to see progress'}
            </Text>
          </View>
        </View>

        {/* Assessment History */}
        <View style={styles.assessmentSection}>
          <Text style={styles.sectionTitle}>
            {lang === 'vi' ? 'Lịch sử đánh giá' : 'Assessment History'}
          </Text>

          {MOCK_ASSESSMENTS.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {lang === 'vi' ? 'Chưa có bài đánh giá' : 'No assessments yet'}
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push('/chat')}
              >
                <Text style={styles.emptyBtnText}>
                  {lang === 'vi' ? 'Làm bài đánh giá' : 'Take Assessment'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.assessmentList}>
              {MOCK_ASSESSMENTS.map((assessment, idx) => {
                const severity = getSeverityLabel(assessment.score, assessment.maxScore);
                return (
                  <View key={idx} style={styles.assessmentCard}>
                    <View style={styles.assessmentLeft}>
                      <Text style={styles.assessmentType}>{assessment.type}</Text>
                      <Text style={styles.assessmentDate}>{formatDate(assessment.date)}</Text>
                    </View>
                    <View style={styles.assessmentRight}>
                      <Text style={styles.assessmentScore}>
                        {assessment.score}/{assessment.maxScore}
                      </Text>
                      <View style={[styles.severityBadge, { backgroundColor: severity.color + '20' }]}>
                        <Text style={[styles.severityText, { color: severity.color }]}>
                          {severity.text}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Insights */}
        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>
            {lang === 'vi' ? 'Nhận xét' : 'Insights'}
          </Text>
          <View style={styles.insightCard}>
            <Text style={styles.insightEmoji}>💡</Text>
            <Text style={styles.insightText}>
              {lang === 'vi'
                ? 'Bạn đã duy trì 7 ngày liên tiếp! Tiếp tục phát huy để cải thiện tình trạng ù tai.'
                : "You've maintained a 7-day streak! Keep it up to improve your tinnitus condition."}
            </Text>
          </View>
          <View style={styles.insightCard}>
            <Text style={styles.insightEmoji}>🎯</Text>
            <Text style={styles.insightText}>
              {lang === 'vi'
                ? 'Mức ù tai giảm 10% so với tuần trước. Âm thanh trị liệu đang phát huy hiệu quả.'
                : 'Tinnitus level decreased 10% from last week. Sound therapy is working!'}
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
    color: '#E0E7FF',
    letterSpacing: 0.2,
  },

  // Time Range
  timeRangeContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  timeRangeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeRangeBtnActive: {
    backgroundColor: '#4F46E5',
  },
  timeRangeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  timeRangeTextActive: {
    color: '#FFFFFF',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E0E7FF',
    marginBottom: 6,
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statChangeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Chart Section
  chartSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E0E7FF',
    marginBottom: 12,
  },
  chartPlaceholder: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 40,
    alignItems: 'center',
  },
  chartPlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
  },
  chartPlaceholderSubtext: {
    fontSize: 12,
    color: '#64748B',
  },

  // Assessment Section
  assessmentSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  assessmentList: {
    gap: 12,
  },
  assessmentCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assessmentLeft: {
    flex: 1,
  },
  assessmentType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E0E7FF',
    marginBottom: 4,
  },
  assessmentDate: {
    fontSize: 12,
    color: '#64748B',
  },
  assessmentRight: {
    alignItems: 'flex-end',
  },
  assessmentScore: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 6,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  emptyState: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 16,
  },
  emptyBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Insights
  insightsSection: {
    paddingHorizontal: 20,
  },
  insightCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  insightEmoji: {
    fontSize: 24,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
  },
});
