import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, Dimensions, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, CheckCircle2, Lock, BookOpen } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { TinniOrb } from '@/components/TinniOrb';
import { useUserStore } from '@/store/use-user-store';

const { width } = Dimensions.get('window');

const MODULES = [
  {
    week: 1, emoji: '📖',
    title: 'Hiểu Về Ù Tai & Giấc Ngủ',
    desc: 'Tìm hiểu vòng xoáy ù tai-mất ngủ và thiết lập baseline.',
    color: '#5B4BC4',
    exercises: [
      { label: 'Vòng Xoáy Ù Tai-Mất Ngủ', type: 'read'     as const, done: false },
      { label: 'Thiết Lập Nhật Ký Ngủ',   type: 'practice'  as const, done: false },
      { label: 'Đánh Giá Baseline',        type: 'quiz'      as const, done: false },
    ],
  },
  {
    week: 2, emoji: '🛏️',
    title: 'Hạn Chế & Kiểm Soát Kích Thích',
    desc: 'Tạo áp lực ngủ và thiết lập lại liên kết giường-ngủ.',
    color: '#0EA5E9',
    exercises: [
      { label: 'Tính Cửa Sổ Giấc Ngủ',   type: 'practice' as const, done: false },
      { label: 'Quy Tắc Kiểm Soát KT',    type: 'read'     as const, done: false },
      { label: 'Theo Dõi Ngày 1–7',       type: 'practice' as const, done: false },
    ],
  },
  {
    week: 3, emoji: '🧠',
    title: 'Giảm Lo Âu Nhận Thức',
    desc: 'Nhận diện và thay thế các suy nghĩ tiêu cực về giấc ngủ.',
    color: '#A855F7',
    exercises: [
      { label: 'Nhận Diện Suy Nghĩ Tự Động', type: 'read'     as const, done: false },
      { label: 'Ghi Chép Suy Nghĩ 3 Cột',    type: 'practice' as const, done: false },
      { label: 'Câu Hỏi Kiểm Tra Suy Nghĩ',  type: 'quiz'     as const, done: false },
    ],
  },
  {
    week: 4, emoji: '🌙',
    title: 'Vệ Sinh Giấc Ngủ & Thư Giãn',
    desc: 'Xây dựng thói quen ngủ tốt và kỹ thuật thư giãn hiệu quả.',
    color: '#10B981',
    exercises: [
      { label: 'Vệ Sinh Giấc Ngủ Cơ Bản', type: 'read'     as const, done: false },
      { label: 'Kỹ Thuật PMR',             type: 'practice' as const, done: false },
      { label: 'Hình Ảnh Hướng Dẫn',      type: 'practice' as const, done: false },
    ],
  },
];

const TYPE_CONFIG = {
  read:     { label: 'Đọc',     color: '#5B4BC4', bg: '#6366F118' },
  practice: { label: 'Thực hành', color: '#10B981', bg: '#10B98118' },
  quiz:     { label: 'Kiểm tra', color: '#F59E0B', bg: '#F59E0B18' },
};

export default function CBTIScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const [expanded, setExpanded] = useState<number | null>(0);

  const totalEx   = MODULES.reduce((s, m) => s + m.exercises.length, 0);
  const doneCount = 0; // TODO: persist progress to Supabase

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#938F9C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CBT-i Liệu Pháp</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero */}
        <View style={styles.hero}>
          <TinniOrb mode="idle" size={80} />
          <Text style={styles.heroTitle}>Liệu Pháp Nhận Thức{'\n'}Hành Vi Mất Ngủ</Text>
          <Text style={styles.heroSub}>
            4 tuần · 12 bài tập · Đã được kiểm chứng lâm sàng
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Tiến trình</Text>
            <Text style={styles.progressPct}>{doneCount}/{totalEx}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(doneCount / totalEx) * 100}%` }]} />
          </View>
        </View>

        {/* Modules */}
        {MODULES.map((mod, idx) => {
          const locked = !user && idx > 0;
          const open   = expanded === idx;
          return (
            <View key={mod.week} style={[styles.moduleCard, open && { borderColor: mod.color + '50' }]}>
              <TouchableOpacity
                style={styles.moduleHeader}
                onPress={() => {
                  if (locked) return;
                  Haptics.selectionAsync();
                  setExpanded(open ? null : idx);
                }}
                activeOpacity={0.8}>
                <View style={[styles.weekBadge, { backgroundColor: mod.color + '20' }]}>
                  <Text style={{ fontSize: 20 }}>{mod.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.weekNum}>Tuần {mod.week}</Text>
                  <Text style={styles.modTitle}>{mod.title}</Text>
                  <Text style={styles.modDesc}>{mod.desc}</Text>
                </View>
                {locked
                  ? <Lock size={18} color="#2C2837" />
                  : <ChevronRight size={18} color="#484551" style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }} />
                }
              </TouchableOpacity>

              {open && (
                <View style={styles.exerciseList}>
                  {mod.exercises.map((ex, ei) => {
                    const tc = TYPE_CONFIG[ex.type];
                    return (
                      <TouchableOpacity
                        key={ei}
                        style={styles.exerciseRow}
                        onPress={() => Haptics.selectionAsync()}
                        activeOpacity={0.75}>
                        <View style={[styles.exTypeBadge, { backgroundColor: tc.bg }]}>
                          <Text style={[styles.exTypeLabel, { color: tc.color }]}>{tc.label}</Text>
                        </View>
                        <Text style={styles.exLabel}>{ex.label}</Text>
                        {ex.done
                          ? <CheckCircle2 size={18} color="#10B981" />
                          : <View style={styles.exCircle} />
                        }
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        {!user && (
          <View style={styles.loginHint}>
            <Text style={styles.loginHintText}>🔒 Đăng nhập để mở đầy đủ 4 tuần</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#151120' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#E7DFF5' },

  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  hero: { alignItems: 'center', marginBottom: 24 },
  heroTitle: { fontSize: 22, fontWeight: '900', color: '#E7DFF5', textAlign: 'center', marginTop: 14, letterSpacing: -0.5, lineHeight: 28 },
  heroSub: { fontSize: 12, color: '#938F9C', marginTop: 6, textAlign: 'center' },

  progressCard: {
    backgroundColor: '#1D1928', borderRadius: 16, borderWidth: 1, borderColor: '#2C2837',
    padding: 14, marginBottom: 20,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { fontSize: 12, color: '#484551', fontWeight: '600' },
  progressPct: { fontSize: 12, color: '#4533AD', fontWeight: '700' },
  progressTrack: { height: 6, backgroundColor: '#2C2837', borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: '#4533AD', borderRadius: 3 },

  moduleCard: {
    backgroundColor: '#1D1928', borderRadius: 18, borderWidth: 1.5, borderColor: '#2C2837',
    marginBottom: 12, overflow: 'hidden',
  },
  moduleHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  weekBadge: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  weekNum: { fontSize: 10, color: '#938F9C', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  modTitle: { fontSize: 14, fontWeight: '800', color: '#E7DFF5', marginTop: 1 },
  modDesc: { fontSize: 12, color: '#938F9C', marginTop: 2, lineHeight: 16 },

  exerciseList: { borderTopWidth: 1, borderTopColor: '#2C2837', paddingHorizontal: 16, paddingBottom: 8 },
  exerciseRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1D1928',
  },
  exTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  exTypeLabel: { fontSize: 10, fontWeight: '700' },
  exLabel: { flex: 1, fontSize: 13, color: '#C9C4D3' },
  exCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#484551' },

  loginHint: {
    backgroundColor: '#4F46E510', borderRadius: 14, borderWidth: 1, borderColor: '#4F46E530',
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  loginHintText: { fontSize: 13, color: '#C7BFFF', fontWeight: '600' },
});
