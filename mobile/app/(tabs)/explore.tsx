import React, { useState } from 'react'
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, Dimensions, TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { Search, Play, Layers, Volume2 } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { V } from '@/constants/theme'

const { width } = Dimensions.get('window')
const CARD_W = (width - 52) / 2

const CATEGORIES = [
  { label: 'Tất cả', emoji: '🎵' },
  { label: 'White Noise', emoji: '⬜' },
  { label: 'Thiên nhiên', emoji: '🌿' },
  { label: 'Tần số', emoji: '〰️' },
  { label: 'Zen', emoji: '🔔' },
]

const SOUNDS = [
  { id: 'ocean',    emoji: '🌊', name: 'Sóng biển',    duration: '∞',    gradient: ['#0C4A6E', '#0EA5E9'] as const },
  { id: 'rain',     emoji: '🌧️', name: 'Mưa nhẹ',     duration: '∞',    gradient: ['#164E63', '#06B6D4'] as const },
  { id: 'campfire', emoji: '🔥', name: 'Lửa trại',     duration: '∞',    gradient: ['#7C2D12', '#F97316'] as const },
  { id: 'forest',   emoji: '🌿', name: 'Rừng đêm',     duration: '∞',    gradient: ['#14532D', '#16A34A'] as const },
  { id: '528hz',    emoji: '✨', name: '528 Hz',        duration: '1h',   gradient: ['#3D2B85', '#5B4BC4'] as const },
  { id: 'zen',      emoji: '🔔', name: 'Zen Bells',     duration: '30m',  gradient: ['#4C1D95', '#A855F7'] as const },
  { id: 'white',    emoji: '〰️', name: 'Ồn Trắng',     duration: '∞',    gradient: ['#2C2837', '#484551'] as const },
  { id: 'pink',     emoji: '🌸', name: 'Ồn Hồng',      duration: '∞',    gradient: ['#831843', '#EC4899'] as const },
  { id: 'birds',    emoji: '🐦', name: 'Tiếng chim',   duration: '∞',    gradient: ['#365314', '#84CC16'] as const },
  { id: 'brown',    emoji: '🟤', name: 'Ồn Nâu',       duration: '∞',    gradient: ['#451A03', '#92400E'] as const },
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
        <View>
          <Text style={styles.title}>Âm Thanh</Text>
          <Text style={styles.subtitle}>Thư viện âm thanh trị liệu</Text>
        </View>
        <TouchableOpacity style={styles.volumeBtn}>
          <Volume2 size={18} color={V.secondary} />
        </TouchableOpacity>
      </View>

      {/* Mix Custom banner */}
      <TouchableOpacity
        style={styles.mixBanner}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/mixer') }}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#3D2B85', '#5B4BC4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.mixGradient}
        >
          <Layers size={18} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={styles.mixTitle}>Sound Mixer</Text>
            <Text style={styles.mixDesc}>Trộn nhiều âm thanh tùy chỉnh</Text>
          </View>
          <View style={styles.mixArrowBg}>
            <Text style={styles.mixArrow}>→</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Search */}
      <View style={styles.searchRow}>
        <Search size={16} color={V.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm âm thanh..."
          placeholderTextColor={V.textDim}
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
            key={cat.label}
            style={[styles.catChip, activeCategory === cat.label && styles.catChipActive]}
            onPress={() => { Haptics.selectionAsync(); setActiveCategory(cat.label) }}
          >
            <Text style={styles.catEmoji}>{cat.emoji}</Text>
            <Text style={[styles.catText, activeCategory === cat.label && styles.catTextActive]}>{cat.label}</Text>
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
            <LinearGradient
              colors={[...sound.gradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              {/* Decorative circle */}
              <View style={styles.decoCircle} />
              <Text style={styles.cardEmoji}>{sound.emoji}</Text>
            </LinearGradient>
            <View style={styles.cardFooter}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{sound.name}</Text>
                <Text style={styles.cardDuration}>{sound.duration}</Text>
              </View>
              <View style={styles.playBtn}>
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
  container: { flex: 1, backgroundColor: V.bg },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4,
  },
  title: { fontSize: 26, fontWeight: '700', color: V.textPrimary },
  subtitle: { fontSize: 12, color: V.textMuted, marginTop: 2 },
  volumeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: V.surface,
    borderWidth: 1, borderColor: V.outlineVariant + '30',
    alignItems: 'center', justifyContent: 'center',
  },

  // Mix Banner
  mixBanner: {
    marginHorizontal: 16, marginTop: 16, marginBottom: 12,
    borderRadius: 16, overflow: 'hidden',
  },
  mixGradient: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  mixTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  mixDesc: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  mixArrowBg: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  mixArrow: { fontSize: 14, color: '#fff', fontWeight: '700' },

  // Search
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: V.surface,
    borderWidth: 1, borderColor: V.outlineVariant + '30',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
  },
  searchInput: { flex: 1, fontSize: 14, color: V.textSecondary },

  // Categories
  catScroll: { flexGrow: 0, marginBottom: 16 },
  catRow: { paddingHorizontal: 16, gap: 8 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100,
    borderWidth: 1, borderColor: V.outlineVariant + '30',
    backgroundColor: 'transparent',
  },
  catChipActive: { backgroundColor: V.secondaryContainer, borderColor: V.secondaryContainer },
  catEmoji: { fontSize: 14 },
  catText: { fontSize: 12, color: V.textMuted, fontWeight: '600' },
  catTextActive: { color: '#fff' },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12, paddingBottom: 120 },

  // Card
  card: { width: CARD_W, borderRadius: 20, overflow: 'hidden', backgroundColor: V.surface },
  cardGradient: {
    height: 120, alignItems: 'center', justifyContent: 'center',
    position: 'relative', overflow: 'hidden',
  },
  decoCircle: {
    position: 'absolute', right: -15, top: -15,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  cardEmoji: { fontSize: 42, zIndex: 1 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 13, fontWeight: '700', color: V.textPrimary },
  cardDuration: { fontSize: 11, color: V.textMuted, marginTop: 2 },
  playBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: V.secondaryContainer,
    alignItems: 'center', justifyContent: 'center',
  },
})
