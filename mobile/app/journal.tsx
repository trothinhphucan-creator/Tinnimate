import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, TextInput, Modal, Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, Plus, ChevronRight, X, Smile, Frown, Meh, Star } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { TinniOrb } from '@/components/TinniOrb';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';

const { width } = Dimensions.get('window');

const MOODS = [
  { emoji: '😊', label: 'Tốt',      score: 5, color: '#10B981' },
  { emoji: '🙂', label: 'Khá',      score: 4, color: '#6366F1' },
  { emoji: '😐', label: 'Bình',     score: 3, color: '#F59E0B' },
  { emoji: '😔', label: 'Kém',      score: 2, color: '#F97316' },
  { emoji: '😣', label: 'Tệ',       score: 1, color: '#EF4444' },
];

const PROMPTS = [
  'Hôm nay ù tai ảnh hưởng đến tôi như thế nào?',
  'Điều gì làm mình cảm thấy tốt hơn hôm nay?',
  'Giấc ngủ tối qua của tôi thế nào?',
  'Tôi đã dùng liệu pháp âm thanh chưa?',
  'Cảm xúc nổi bật nhất hôm nay là gì?',
];

interface JournalEntry {
  id: string;
  mood: number;
  text: string;
  created_at: string;
  tinnitus_level?: number;
}

function MoodDot({ score, color }: { score: number; color: string }) {
  return (
    <View style={[styles.moodDot, { backgroundColor: color + '30', borderColor: color }]}>
      <Text style={{ fontSize: 16 }}>{MOODS.find(m => m.score === score)?.emoji ?? '😐'}</Text>
    </View>
  );
}

export default function JournalScreen() {
  const { user } = useUserStore();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [composing, setComposing] = useState(false);
  const [mood, setMood] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [tinnitus, setTinnitus] = useState(5);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);

  useEffect(() => { fetchEntries(); }, [user]);

  async function fetchEntries() {
    if (!user) return;
    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    if (data) setEntries(data as JournalEntry[]);
  }

  async function save() {
    if (!mood || !text.trim() || !user) return;
    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const { error } = await supabase.from('journal_entries').insert({
      user_id: user.id,
      mood,
      text: text.trim(),
      tinnitus_level: tinnitus,
    });
    if (!error) {
      setComposing(false);
      setMood(null);
      setText('');
      setTinnitus(5);
      setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
      fetchEntries();
    }
    setLoading(false);
  }

  const avgMood = entries.length > 0
    ? (entries.slice(0, 7).reduce((s, e) => s + e.mood, 0) / Math.min(entries.length, 7)).toFixed(1)
    : '—';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Nhật Ký</Text>
            <Text style={styles.subtitle}>Theo dõi cảm xúc & tiến trình</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setComposing(true); }}>
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Week summary */}
        <View style={styles.summaryCard}>
          <TinniOrb mode="idle" size={60} />
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryTitle}>Tuần này</Text>
            <Text style={styles.summaryVal}>
              Tâm trạng TB: <Text style={{ color: '#C7D2FE', fontWeight: '800' }}>{avgMood}</Text>/5
            </Text>
            <Text style={styles.summaryVal}>
              Đã ghi: <Text style={{ color: '#C7D2FE', fontWeight: '800' }}>{Math.min(entries.length, 7)}</Text> lần
            </Text>
          </View>
        </View>

        {/* Log prompt */}
        <TouchableOpacity
          style={styles.promptCard}
          onPress={() => { Haptics.selectionAsync(); setComposing(true); }}
          activeOpacity={0.8}>
          <BookOpen size={16} color="#818CF8" />
          <Text style={styles.promptText}>"{prompt}"</Text>
          <ChevronRight size={16} color="#334155" />
        </TouchableOpacity>

        {/* Entry list */}
        {!user ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔒</Text>
            <Text style={styles.emptyText}>Đăng nhập để lưu nhật ký</Text>
          </View>
        ) : entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📖</Text>
            <Text style={styles.emptyText}>Chưa có nhật ký nào{'\n'}Nhấn + để bắt đầu</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>Các bản ghi gần đây</Text>
            {entries.map(entry => {
              const m = MOODS.find(x => x.score === entry.mood) ?? MOODS[2];
              const date = new Date(entry.created_at).toLocaleDateString('vi-VN', {
                day: '2-digit', month: '2-digit',
              });
              return (
                <View key={entry.id} style={styles.entryCard}>
                  <View style={styles.entryLeft}>
                    <MoodDot score={entry.mood} color={m.color} />
                    <Text style={[styles.moodLabel, { color: m.color }]}>{m.label}</Text>
                    <Text style={styles.entryDate}>{date}</Text>
                  </View>
                  <Text style={styles.entryText} numberOfLines={2}>{entry.text}</Text>
                </View>
              );
            })}
          </>
        )}

      </ScrollView>

      {/* Compose modal */}
      <Modal visible={composing} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm nhật ký</Text>
              <TouchableOpacity onPress={() => setComposing(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">

              {/* Mood picker */}
              <Text style={styles.modalLabel}>Tâm trạng hôm nay</Text>
              <View style={styles.moodRow}>
                {MOODS.map(m => (
                  <TouchableOpacity
                    key={m.score}
                    style={[styles.moodOption, mood === m.score && { borderColor: m.color, backgroundColor: m.color + '20' }]}
                    onPress={() => { setMood(m.score); Haptics.selectionAsync(); }}>
                    <Text style={{ fontSize: 28 }}>{m.emoji}</Text>
                    <Text style={[styles.moodOptionLabel, mood === m.score && { color: m.color }]}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Tinnitus level */}
              <Text style={styles.modalLabel}>Mức ù tai (1–10): <Text style={{ color: '#C7D2FE', fontWeight: '800' }}>{tinnitus}</Text></Text>
              <View style={styles.sliderRow}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.sliderDot, tinnitus >= n && { backgroundColor: '#6366F1' }]}
                    onPress={() => { setTinnitus(n); Haptics.selectionAsync(); }}
                  />
                ))}
              </View>

              {/* Text input */}
              <Text style={styles.modalLabel}>Ghi chú</Text>
              <Text style={styles.modalPromptHint}>💡 {prompt}</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={5}
                placeholder="Viết gì đó về ngày hôm nay..."
                placeholderTextColor="#334155"
                value={text}
                onChangeText={setText}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[styles.saveBtn, (!mood || !text.trim()) && { opacity: 0.4 }]}
                onPress={save}
                disabled={!mood || !text.trim() || loading}>
                <Text style={styles.saveBtnText}>{loading ? 'Đang lưu...' : '💾 Lưu nhật ký'}</Text>
              </TouchableOpacity>

            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 20, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', color: '#E0E7FF', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#475569', marginTop: 2 },
  addBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8,
  },

  summaryCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: '#0F172A', borderRadius: 20, borderWidth: 1, borderColor: '#1E293B',
    padding: 16, marginBottom: 14,
  },
  summaryTitle: { fontSize: 11, color: '#4F46E5', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  summaryVal: { fontSize: 13, color: '#64748B', lineHeight: 20 },

  promptCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#0F172A', borderRadius: 14, borderWidth: 1, borderColor: '#1E293B',
    padding: 14, marginBottom: 20,
  },
  promptText: { flex: 1, fontSize: 13, color: '#94A3B8', fontStyle: 'italic', lineHeight: 18 },

  sectionLabel: { fontSize: 11, color: '#334155', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 15, color: '#334155', textAlign: 'center', lineHeight: 22 },

  entryCard: {
    backgroundColor: '#0F172A', borderRadius: 16, borderWidth: 1, borderColor: '#1E293B',
    padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 12,
  },
  entryLeft: { alignItems: 'center', gap: 4 },
  moodDot: { width: 40, height: 40, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  moodLabel: { fontSize: 10, fontWeight: '700' },
  entryDate: { fontSize: 9, color: '#334155' },
  entryText: { flex: 1, fontSize: 13, color: '#94A3B8', lineHeight: 20, paddingTop: 2 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: '#020617' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1E293B',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#E0E7FF' },
  modalScroll: { padding: 20, paddingBottom: 40 },
  modalLabel: { fontSize: 13, fontWeight: '700', color: '#94A3B8', marginBottom: 12 },
  modalPromptHint: { fontSize: 12, color: '#334155', fontStyle: 'italic', marginBottom: 10, lineHeight: 18 },

  moodRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  moodOption: {
    flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#1E293B', backgroundColor: '#0F172A',
  },
  moodOptionLabel: { fontSize: 10, fontWeight: '600', color: '#475569' },

  sliderRow: { flexDirection: 'row', gap: 6, marginBottom: 24 },
  sliderDot: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#1E293B' },

  textArea: {
    backgroundColor: '#0F172A', borderRadius: 14, borderWidth: 1, borderColor: '#1E293B',
    padding: 14, fontSize: 14, color: '#E2E8F0', minHeight: 120, marginBottom: 20,
  },
  saveBtn: {
    backgroundColor: '#4F46E5', borderRadius: 100, paddingVertical: 16, alignItems: 'center',
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
