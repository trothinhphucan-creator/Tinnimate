import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { Compass, ChevronRight } from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { V } from '@/constants/theme'

const TOOLS = [
  { id: 'breathing', emoji: '🌬️', title: 'Bài tập thở', desc: 'Kỹ thuật 4-7-8, box breathing', gradient: ['#164E63', '#06B6D4'] as const, route: '/breathing' },
  { id: 'notch', emoji: '🎯', title: 'Notch Therapy', desc: 'Trị liệu theo tần số ù tai', gradient: ['#3D2B85', '#7C3AED'] as const, route: '/notch-therapy' },
  { id: 'zentones', emoji: '🎵', title: 'Zentones', desc: 'Giai điệu fractal trị liệu ù tai', gradient: ['#3D2B85', '#5B4BC4'] as const, route: '/zentones' },
  { id: 'sleep', emoji: '🌙', title: 'Chế độ ngủ', desc: 'Hẹn giờ, fade-out, màn hình tối', gradient: ['#1a0e3e', '#5B4BC4'] as const, route: '/sleep' },
  { id: 'cbti', emoji: '🧠', title: 'CBT-i', desc: '4 tuần trị liệu nhận thức hành vi', gradient: ['#0C4A6E', '#0EA5E9'] as const, route: '/cbti' },
  { id: 'journal', emoji: '📔', title: 'Nhật ký', desc: 'Theo dõi triệu chứng hàng ngày', gradient: ['#4E3800', '#F59E0B'] as const, route: '/journal' },
]

export default function ZenScreen() {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.compassBg}>
            <Compass size={18} color={V.secondary} />
          </View>
          <View>
            <Text style={styles.title}>Khám phá</Text>
            <Text style={styles.subtitle}>Công cụ trị liệu ù tai</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {TOOLS.map((tool) => (
          <TouchableOpacity
            key={tool.id}
            style={styles.card}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
              router.push(tool.route as any)
            }}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[...tool.gradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              {/* Decorative */}
              <View style={styles.decoCircle} />
              <View style={styles.decoCircle2} />

              <View style={styles.cardContent}>
                <View style={styles.emojiCircle}>
                  <Text style={styles.emojiText}>{tool.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{tool.title}</Text>
                  <Text style={styles.cardDesc}>{tool.desc}</Text>
                </View>
                <View style={styles.arrowBg}>
                  <ChevronRight size={16} color="rgba(255,255,255,0.7)" />
                </View>
              </View>
            </LinearGradient>
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
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  compassBg: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: V.surface,
    borderWidth: 1, borderColor: V.outlineVariant + '30',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '700', color: V.textPrimary },
  subtitle: { fontSize: 12, color: V.textMuted, marginTop: 1 },

  // Grid
  grid: { paddingHorizontal: 16, paddingBottom: 120, gap: 12 },

  // Card
  card: {
    borderRadius: 20, overflow: 'hidden',
  },
  cardGradient: {
    padding: 18, borderRadius: 20,
    overflow: 'hidden', position: 'relative',
  },
  decoCircle: {
    position: 'absolute', right: -20, top: -20,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decoCircle2: {
    position: 'absolute', left: 50, bottom: -15,
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  cardContent: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  emojiCircle: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  emojiText: { fontSize: 22 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 3 },
  cardDesc: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  arrowBg: {
    width: 32, height: 32, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
})
