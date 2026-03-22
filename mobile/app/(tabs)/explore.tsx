import React, { useState } from 'react'
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, Dimensions, TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { Search, Play, Layers } from 'lucide-react-native'
import { useRouter } from 'expo-router'

const { width } = Dimensions.get('window')
const CARD_W = (width - 48) / 2

const CATEGORIES = ['Tất cả', 'White Noise', 'Thiên nhiên', 'Tần số', 'Zen']

const SOUNDS = [
  { id: 'ocean',    emoji: '🌊', name: 'Sóng biển',    duration: '∞',    color: '#0EA5E9', gradient: ['#0C4A6E', '#0EA5E9'] },
  { id: 'rain',     emoji: '🌧️', name: 'Mưa nhẹ',     duration: '∞',    color: '#06B6D4', gradient: ['#164E63', '#06B6D4'] },
  { id: 'campfire', emoji: '🔥', name: 'Lửa trại',     duration: '∞',    color: '#F97316', gradient: ['#7C2D12', '#F97316'] },
  { id: 'forest',   emoji: '🌿', name: 'Rừng đêm',     duration: '∞',    color: '#16A34A', gradient: ['#14532D', '#16A34A'] },
  { id: '528hz',    emoji: '🎵', name: '528 Hz',        duration: '1h',   color: '#6366F1', gradient: ['#312E81', '#6366F1'] },
  { id: 'zen',      emoji: '🔔', name: 'Zen Bells',     duration: '30 phút', color: '#A855F7', gradient: ['#4C1D95', '#A855F7'] },
  { id: 'white',    emoji: '⬜', name: 'Ồn Trắng',     duration: '∞',    color: '#94A3B8', gradient: ['#1E293B', '#94A3B8'] },
  { id: 'pink',     emoji: '🌸', name: 'Ồn Hồng',      duration: '∞',    color: '#EC4899', gradient: ['#831843', '#EC4899'] },
  { id: 'birds',    emoji: '🐦', name: 'Tiếng chim',   duration: '∞',    color: '#84CC16', gradient: ['#365314', '#84CC16'] },
  { id: 'brown',    emoji: '🟤', name: 'Ồn Nâu',       duration: '∞',    color: '#92400E', gradient: ['#451A03', '#92400E'] },
]

export default function ExploreScreen() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Tất cả')
  const router = useRouter()

  const filtered = SOUNDS.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Âm Thanh</Text>
      </View>

      {/* Mix Custom banner */}
      <TouchableOpacity
        style={styles.mixBanner}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/mixer') }}
        activeOpacity={0.8}
      >
        <Layers size={16} color="#818CF8" />
        <Text style={styles.mixText}>Mix tùy chỉnh — Trộn nhiều âm thanh</Text>
        <Text style={styles.mixArrow}>›</Text>
      </TouchableOpacity>

      {/* Search */}
      <View style={styles.searchRow}>
        <Search size={16} color="#475569" />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm âm thanh..."
          placeholderTextColor="#475569"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category tabs */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catRow}
        style={styles.catScroll}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, activeCategory === cat && styles.catChipActive]}
            onPress={() => { Haptics.selectionAsync(); setActiveCategory(cat) }}
          >
            <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Grid */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.grid}
      >
        {filtered.map(sound => (
          <TouchableOpacity
            key={sound.id}
            style={styles.card}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium) }}
            activeOpacity={0.85}
          >
            {/* Gradient bg */}
            <View style={[styles.cardBg, { backgroundColor: sound.gradient[0] }]}>
              <View style={[styles.cardBgInner, { backgroundColor: sound.color + '40' }]} />
              <Text style={styles.cardEmoji}>{sound.emoji}</Text>
            </View>
            <View style={styles.cardFooter}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{sound.name}</Text>
                <Text style={styles.cardDuration}>{sound.duration}</Text>
              </View>
              <View style={[styles.playBtn, { backgroundColor: sound.color }]}>
                <Play fill="#fff" color="#fff" size={10} style={{ marginLeft: 1 }} />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: '#E0E7FF' },
  mixBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: 'rgba(129,140,248,0.08)',
    borderWidth: 1, borderColor: 'rgba(129,140,248,0.2)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
  },
  mixText: { flex: 1, fontSize: 13, color: '#818CF8', fontWeight: '600' },
  mixArrow: { fontSize: 18, color: '#818CF8' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#CBD5E1' },
  catScroll: { flexGrow: 0, marginBottom: 16 },
  catRow: { paddingHorizontal: 16, gap: 8 },
  catChip: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 100,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'transparent',
  },
  catChipActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  catText: { fontSize: 13, color: '#475569', fontWeight: '600' },
  catTextActive: { color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12, paddingBottom: 100 },
  card: { width: CARD_W, borderRadius: 16, overflow: 'hidden', backgroundColor: '#0F172A' },
  cardBg: { height: 110, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cardBgInner: { position: 'absolute', inset: 0, opacity: 0.6 },
  cardEmoji: { fontSize: 40, zIndex: 1 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 13, fontWeight: '600', color: '#E0E7FF' },
  cardDuration: { fontSize: 11, color: '#64748B', marginTop: 1 },
  playBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
})
