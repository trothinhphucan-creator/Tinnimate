import React, { useState } from 'react'
import {
  StyleSheet, Text, View, TouchableOpacity,
  ScrollView, Switch, Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { TinniOrb } from '@/components/TinniOrb'
import { LogOut, Bell, ChevronRight, Zap, Star } from 'lucide-react-native'
import { useUserStore } from '@/store/userStore'
import { supabase } from '@/lib/supabase'

const { width } = Dimensions.get('window')

// Fake weekly data (will be from API later)
const WEEK_DATA = [0.5, 1.2, 0.8, 2.1, 1.5, 0.6, 1.8] // hours per day
const MAX_H = Math.max(...WEEK_DATA)
const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

export default function ProfileScreen() {
  const [notifyOn, setNotifyOn] = useState(true)
  const { user } = useUserStore()
  const router = useRouter()

  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Bạn'
  const tier = user?.user_metadata?.subscription_tier ?? 'free'
  const isPro = tier === 'premium' || tier === 'pro' || tier === 'ultra'

  async function handleLogout() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await supabase.auth.signOut()
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.orbWrap}>
            <TinniOrb mode="idle" size={80} />
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.userName}>{displayName}</Text>
            <View style={styles.tierBadge}>
              <Star size={11} color={isPro ? '#F59E0B' : '#64748B'} fill={isPro ? '#F59E0B' : 'transparent'} />
              <Text style={[styles.tierText, isPro && { color: '#F59E0B' }]}>
                {isPro ? 'Premium' : 'Free'}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { label: 'ngày streak', value: '28', emoji: '🔥' },
            { label: 'giờ nghe', value: '124', emoji: '🎵' },
            { label: 'tin nhắn AI', value: '47', emoji: '💬' },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statEmoji}>{s.emoji}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Weekly Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hành trình của tôi</Text>
          <View style={styles.chart}>
            <View style={styles.bars}>
              {WEEK_DATA.map((h, i) => (
                <View key={i} style={styles.barWrapper}>
                  <View style={styles.barBg}>
                    <View style={[
                      styles.barFill,
                      { height: `${(h / MAX_H) * 100}%` },
                      i === new Date().getDay() - 1 && { backgroundColor: '#818CF8' },
                    ]} />
                  </View>
                  <Text style={styles.barLabel}>{DAY_LABELS[i]}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.chartCaption}>
              📈 Tốt! Hôm nay nghe {WEEK_DATA[4].toFixed(1)} giờ
            </Text>
          </View>
        </View>

        {/* Subscription Card */}
        {isPro ? (
          <View style={styles.subCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.subTitle}>⭐ Premium</Text>
              <Text style={styles.subDesc}>Còn 23 ngày — hết hạn 14/4/2026</Text>
            </View>
            <TouchableOpacity style={styles.renewBtn}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/paywall') }}
            >
              <Text style={styles.renewText}>Gia hạn</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.upgradeCard}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/paywall') }}
            activeOpacity={0.85}
          >
            <Zap size={18} color="#A78BFA" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.upgradeTitle}>Nâng cấp Premium</Text>
              <Text style={styles.upgradeDesc}>Mở khóa toàn bộ tính năng trị liệu</Text>
            </View>
            <ChevronRight size={16} color="#A78BFA" />
          </TouchableOpacity>
        )}

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cài đặt</Text>

          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <Bell size={18} color="#64748B" />
              <Text style={styles.settingLabel}>Nhắc nhở hàng ngày</Text>
              <Switch
                value={notifyOn}
                onValueChange={(v) => { Haptics.selectionAsync(); setNotifyOn(v) }}
                trackColor={{ false: '#1E293B', true: '#4F46E5' }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => { Haptics.selectionAsync() }}
            >
              <Text style={[styles.settingLabel, { marginLeft: 0 }]}>💎 Về Tinnimate</Text>
              <ChevronRight size={16} color="#334155" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={16} color="#EF4444" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  scroll: { paddingBottom: 100 },

  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  orbWrap: { width: 80, height: 80 },
  profileMeta: { flex: 1 },
  userName: { fontSize: 22, fontWeight: '700', color: '#E0E7FF' },
  tierBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  tierText: { fontSize: 12, color: '#64748B', fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: 14, alignItems: 'center',
  },
  statEmoji: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '700', color: '#E0E7FF' },
  statLabel: { fontSize: 10, color: '#64748B', marginTop: 2, textAlign: 'center' },

  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 13, color: '#475569', fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },

  chart: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)', borderRadius: 16, padding: 16,
  },
  bars: { flexDirection: 'row', gap: 6, height: 80, alignItems: 'flex-end', marginBottom: 12 },
  barWrapper: { flex: 1, alignItems: 'center', gap: 4 },
  barBg: { flex: 1, width: '80%', backgroundColor: '#1E293B', borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', backgroundColor: '#4F46E5', borderRadius: 4 },
  barLabel: { fontSize: 10, color: '#475569' },
  chartCaption: { fontSize: 12, color: '#64748B' },

  subCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 20,
    backgroundColor: 'rgba(245,158,11,0.08)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)',
    borderRadius: 14, padding: 16,
  },
  subTitle: { fontSize: 15, fontWeight: '700', color: '#F59E0B' },
  subDesc: { fontSize: 12, color: '#64748B', marginTop: 2 },
  renewBtn: { backgroundColor: '#4F46E5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  renewText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  upgradeCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 20,
    backgroundColor: 'rgba(167,139,250,0.08)', borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)',
    borderRadius: 14, padding: 16,
  },
  upgradeTitle: { fontSize: 15, fontWeight: '700', color: '#A78BFA' },
  upgradeDesc: { fontSize: 12, color: '#64748B', marginTop: 2 },

  settingsCard: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  settingLabel: { flex: 1, fontSize: 14, color: '#CBD5E1', marginLeft: 0 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 16 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 8,
    backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
    borderRadius: 14, padding: 16, justifyContent: 'center',
  },
  logoutText: { fontSize: 14, fontWeight: '600', color: '#EF4444' },
})
