import React, { useState } from 'react'
import {
  StyleSheet, Text, View, TouchableOpacity,
  ScrollView, Switch, Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { TinniOrb } from '@/components/TinniOrb'
import { LogOut, Bell, ChevronRight, Zap, Star, Globe, DollarSign, Settings } from 'lucide-react-native'
import { useUserStore } from '@/store/use-user-store'
import { useLangStore } from '@/store/use-lang-store'
import { supabase } from '@/lib/supabase'
import { V } from '@/constants/theme'

const { width } = Dimensions.get('window')

const WEEK_DATA = [0.5, 1.2, 0.8, 2.1, 1.5, 0.6, 1.8]
const MAX_H = Math.max(...WEEK_DATA)
const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

export default function ProfileScreen() {
  const [notifyOn, setNotifyOn] = useState(true)
  const { user } = useUserStore()
  const { lang, setLang } = useLangStore()
  const router = useRouter()

  const displayName = user?.name ?? user?.email?.split('@')[0] ?? (lang === 'vi' ? 'Bạn' : 'You')
  const tier = user?.subscription_tier ?? 'free'
  const isPro = tier === 'premium' || tier === 'pro' || tier === 'ultra'

  async function handleLogout() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await supabase.auth.signOut()
  }

  const toggleLanguage = () => {
    Haptics.selectionAsync()
    setLang(lang === 'vi' ? 'en' : 'vi')
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Profile Header with Gradient ── */}
        <LinearGradient
          colors={['#3D2B85', '#5B4BC4', V.bg]}
          locations={[0, 0.5, 1]}
          style={styles.profileGradient}
        >
          <View style={styles.profileHeader}>
            <View style={styles.orbWrap}>
              <View style={styles.orbGlow}>
                <TinniOrb mode="idle" size={80} />
              </View>
            </View>
            <Text style={styles.userName}>{displayName}</Text>
            <View style={styles.tierBadge}>
              <Star size={12} color={isPro ? V.primary : V.textMuted} fill={isPro ? V.primary : 'transparent'} />
              <Text style={[styles.tierText, isPro && { color: V.primary }]}>
                {isPro ? (tier === 'ultra' ? 'Ultra' : tier === 'pro' ? 'Pro' : 'Premium') : 'Free'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Stats Row ── */}
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

        {/* ── Weekly Chart ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HÀNH TRÌNH CỦA TÔI</Text>
          <View style={styles.chart}>
            <View style={styles.bars}>
              {WEEK_DATA.map((h, i) => (
                <View key={i} style={styles.barWrapper}>
                  <View style={styles.barBg}>
                    <LinearGradient
                      colors={i === new Date().getDay() - 1 ? [V.secondary, V.secondaryDim] : [V.surfaceHighest, V.surfaceHigh]}
                      style={[styles.barFill, { height: `${(h / MAX_H) * 100}%` }]}
                    />
                  </View>
                  <Text style={[styles.barLabel, i === new Date().getDay() - 1 && { color: V.secondary }]}>
                    {DAY_LABELS[i]}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={styles.chartCaption}>
              📈 Tốt! Hôm nay nghe {WEEK_DATA[4].toFixed(1)} giờ
            </Text>
          </View>
        </View>

        {/* ── Subscription Card ── */}
        {isPro ? (
          <View style={styles.section}>
            <LinearGradient
              colors={['#4E3800', '#3D2B85']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.subCard}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.subTitle}>⭐ {tier === 'ultra' ? 'Ultra' : tier === 'pro' ? 'Pro' : 'Premium'}</Text>
                <Text style={styles.subDesc}>{lang === 'vi' ? 'Còn 23 ngày — hết hạn 14/4/2026' : '23 days left — expires 14/4/2026'}</Text>
              </View>
              <TouchableOpacity style={styles.renewBtn}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/pricing') }}
              >
                <Text style={styles.renewText}>{lang === 'vi' ? 'Gia hạn' : 'Renew'}</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        ) : (
          <View style={styles.section}>
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/pricing') }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#3D2B85', '#5B4BC4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.upgradeCard}
              >
                <Zap size={20} color={V.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.upgradeTitle}>{lang === 'vi' ? 'Nâng cấp Premium' : 'Upgrade to Premium'}</Text>
                  <Text style={styles.upgradeDesc}>{lang === 'vi' ? 'Mở khóa toàn bộ tính năng trị liệu' : 'Unlock all therapy features'}</Text>
                </View>
                <ChevronRight size={18} color="rgba(255,255,255,0.5)" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Settings ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{lang === 'vi' ? 'CÀI ĐẶT' : 'SETTINGS'}</Text>

          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingIconBg}>
                <Bell size={16} color={V.secondary} />
              </View>
              <Text style={styles.settingLabel}>{lang === 'vi' ? 'Nhắc nhở hàng ngày' : 'Daily reminders'}</Text>
              <Switch
                value={notifyOn}
                onValueChange={(v) => { Haptics.selectionAsync(); setNotifyOn(v) }}
                trackColor={{ false: V.surfaceHigh, true: V.secondaryContainer }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingIconBg}>
                <Globe size={16} color={V.secondary} />
              </View>
              <Text style={styles.settingLabel}>{lang === 'vi' ? 'Ngôn ngữ' : 'Language'}</Text>
              <TouchableOpacity onPress={toggleLanguage} style={styles.langBtn}>
                <Text style={styles.langText}>{lang === 'vi' ? '🇻🇳 Tiếng Việt' : '🇺🇸 English'}</Text>
                <ChevronRight size={14} color={V.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => { Haptics.selectionAsync(); router.push('/pricing') }}
            >
              <View style={styles.settingIconBg}>
                <DollarSign size={16} color={V.secondary} />
              </View>
              <Text style={styles.settingLabel}>{lang === 'vi' ? 'Bảng giá' : 'Pricing'}</Text>
              <ChevronRight size={16} color={V.textDim} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => { Haptics.selectionAsync() }}
            >
              <View style={styles.settingIconBg}>
                <Settings size={16} color={V.secondary} />
              </View>
              <Text style={styles.settingLabel}>💎 {lang === 'vi' ? 'Về Tinnimate' : 'About TinniMate'}</Text>
              <ChevronRight size={16} color={V.textDim} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Logout ── */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <LogOut size={16} color="#FF6B6B" />
            <Text style={styles.logoutText}>{lang === 'vi' ? 'Đăng xuất' : 'Log out'}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: V.bg },
  scroll: { paddingBottom: 120 },

  // ── Profile Gradient ──
  profileGradient: {
    paddingBottom: 8,
  },
  profileHeader: {
    alignItems: 'center', paddingTop: 8, paddingBottom: 20,
  },
  orbWrap: { marginBottom: 12 },
  orbGlow: {
    padding: 12, borderRadius: 100,
    backgroundColor: 'rgba(91,75,196,0.15)',
  },
  userName: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 8 },
  tierBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100,
  },
  tierText: { fontSize: 12, color: V.textMuted, fontWeight: '700' },

  // ── Stats ──
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 8, marginBottom: 4 },
  statCard: {
    flex: 1, backgroundColor: V.surface, borderWidth: 1,
    borderColor: V.outlineVariant + '20', borderRadius: 18, padding: 14, alignItems: 'center',
  },
  statEmoji: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '700', color: V.textPrimary },
  statLabel: { fontSize: 10, color: V.textMuted, marginTop: 2, textAlign: 'center' },

  // ── Section ──
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: {
    fontSize: 11, color: V.textMuted, fontWeight: '700',
    marginBottom: 12, letterSpacing: 1.5,
  },

  // ── Chart ──
  chart: {
    backgroundColor: V.surface, borderWidth: 1,
    borderColor: V.outlineVariant + '20', borderRadius: 20, padding: 16,
  },
  bars: { flexDirection: 'row', gap: 6, height: 80, alignItems: 'flex-end', marginBottom: 12 },
  barWrapper: { flex: 1, alignItems: 'center', gap: 4 },
  barBg: { flex: 1, width: '80%', backgroundColor: V.surfaceHigh, borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 6 },
  barLabel: { fontSize: 10, color: V.textDim },
  chartCaption: { fontSize: 12, color: V.textMuted },

  // ── Sub Card ──
  subCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 18, padding: 18, overflow: 'hidden',
  },
  subTitle: { fontSize: 16, fontWeight: '700', color: V.primary },
  subDesc: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  renewBtn: { backgroundColor: V.secondaryContainer, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  renewText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // ── Upgrade Card ──
  upgradeCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 18, padding: 18, overflow: 'hidden',
  },
  upgradeTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  upgradeDesc: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },

  // ── Settings ──
  settingsCard: {
    backgroundColor: V.surface, borderWidth: 1,
    borderColor: V.outlineVariant + '20', borderRadius: 18, overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  settingIconBg: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: V.surfaceHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  settingLabel: { flex: 1, fontSize: 14, color: V.textSecondary },
  langBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: V.surfaceHigh, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 10,
  },
  langText: { fontSize: 13, color: V.textSecondary, fontWeight: '600' },
  divider: { height: 1, backgroundColor: V.outlineVariant + '15', marginHorizontal: 16 },

  // ── Logout ──
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,107,107,0.08)', borderWidth: 1, borderColor: 'rgba(255,107,107,0.15)',
    borderRadius: 16, padding: 16, justifyContent: 'center',
  },
  logoutText: { fontSize: 14, fontWeight: '600', color: '#FF6B6B' },
})
