import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Compass, Wind, Waves, Music } from 'lucide-react-native'
import * as Haptics from 'expo-haptics'

const TOOLS = [
  { id: 'breathing', icon: '🌬️', title: 'Bài tập thở', desc: 'Kỹ thuật 4-7-8, box breathing', color: '#06B6D4', route: '/breathing' },
  { id: 'notch', icon: '🎯', title: 'Notch Therapy', desc: 'Trị liệu theo tần số ù tai', color: '#7C3AED', route: '/notch-therapy' },
  { id: 'zentitone', icon: '✨', title: 'Zentitone', desc: 'Âm thanh fractal & binaural', color: '#A855F7', route: '/zentitone' },
  { id: 'sleep', icon: '🌙', title: 'Chế độ ngủ', desc: 'Hẹn giờ, fade-out, màn hình tối', color: '#6366F1', route: '/sleep' },
  { id: 'cbti', icon: '🧠', title: 'CBT-i', desc: '4 tuần trị liệu nhận thức hành vi', color: '#0EA5E9', route: '/cbti' },
  { id: 'journal', icon: '📔', title: 'Nhật ký', desc: 'Theo dõi triệu chứng hàng ngày', color: '#F59E0B', route: '/journal' },
]

export default function ZenScreen() {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Compass size={20} color="#818CF8" />
        <Text style={styles.title}>Khám phá</Text>
      </View>
      <Text style={styles.subtitle}>Công cụ trị liệu ù tai</Text>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {TOOLS.map((tool) => (
          <TouchableOpacity
            key={tool.id}
            style={styles.card}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
              router.push(tool.route as any)
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBg, { backgroundColor: tool.color + '20' }]}>
              <Text style={styles.iconText}>{tool.icon}</Text>
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{tool.title}</Text>
              <Text style={styles.cardDesc}>{tool.desc}</Text>
            </View>
            <View style={[styles.arrow, { backgroundColor: tool.color + '30' }]}>
              <Text style={{ color: tool.color, fontSize: 14 }}>›</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#E0E7FF' },
  subtitle: { fontSize: 13, color: '#475569', paddingHorizontal: 20, marginTop: 4, marginBottom: 20 },
  grid: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16, padding: 16,
  },
  iconBg: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 22 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#E0E7FF', marginBottom: 3 },
  cardDesc: { fontSize: 12, color: '#64748B' },
  arrow: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
})
