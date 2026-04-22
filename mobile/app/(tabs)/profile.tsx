import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Bell, Globe, DollarSign, Settings, LogOut } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useUserStore } from '@/store/use-user-store';
import { useLangStore } from '@/store/use-lang-store';
import { supabase } from '@/lib/supabase';
import { V } from '@/constants/theme';
import {
  FloatingLeavesBackground, Sprig, Eyebrow, BotanicalCard, LotusOrb,
} from '@/components/botanical';

const WEEK_DATA  = [0.5, 1.2, 0.8, 2.1, 1.5, 0.6, 1.8];
const MAX_H      = Math.max(...WEEK_DATA);
const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export default function ProfileScreen() {
  const [notifyOn, setNotifyOn] = useState(true);
  const { user } = useUserStore();
  const { lang, setLang } = useLangStore();
  const router = useRouter();

  const displayName = user?.name ?? user?.email?.split('@')[0] ?? (lang === 'vi' ? 'Bạn' : 'You');
  const tier = user?.subscription_tier ?? 'free';
  const isPro = ['premium', 'pro', 'ultra'].includes(tier);

  async function handleLogout() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await supabase.auth.signOut();
  }

  const SETTINGS = [
    { icon: <Bell size={16} color={V.terracotta} />, label: lang === 'vi' ? 'Nhắc nhở hàng ngày' : 'Daily reminders', right: <Switch value={notifyOn} onValueChange={v => { Haptics.selectionAsync(); setNotifyOn(v); }} trackColor={{ false: V.surfaceHigh, true: V.primaryContainer }} thumbColor="#fff" /> },
    { icon: <Globe size={16} color={V.terracotta} />, label: lang === 'vi' ? 'Ngôn ngữ' : 'Language', right: <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setLang(lang === 'vi' ? 'en' : 'vi'); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Text style={s.langText}>{lang === 'vi' ? '🇻🇳 Tiếng Việt' : '🇺🇸 English'}</Text><ChevronRight size={14} color={V.textMuted} /></TouchableOpacity> },
    { icon: <DollarSign size={16} color={V.terracotta} />, label: lang === 'vi' ? 'Bảng giá' : 'Pricing', onPress: () => { Haptics.selectionAsync(); router.push('/pricing'); }, right: <ChevronRight size={16} color={V.textDim} /> },
    { icon: <Settings size={16} color={V.terracotta} />, label: '💎 ' + (lang === 'vi' ? 'Về Tinnimate' : 'About TinniMate'), onPress: () => Haptics.selectionAsync(), right: <ChevronRight size={16} color={V.textDim} /> },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: V.bg }}>
      <FloatingLeavesBackground count={3} />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>

            {/* Header */}
            <Text style={s.eyebrow}>chào bạn,</Text>
            <Text style={s.userName}>{displayName}</Text>

            {/* Avatar with Sprig frame */}
            <View style={{ alignItems: 'center', margin: '18px 0 8px' as any, marginTop: 18, marginBottom: 8 }}>
              <View style={{ position: 'absolute', top: 14 }}>
                <Sprig size={56} color={V.sage} />
              </View>
              <View style={[s.avatar, { marginTop: 20 }]}>
                <Text style={{ fontSize: 36, fontWeight: '500', color: V.bg }}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={s.email}>{user?.email ?? ''}</Text>

            {/* Stats row */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 18 }}>
              {[{ n: '12', l: 'ngày' }, { n: '47', l: 'phiên' }, { n: '14.2h', l: 'trị liệu' }].map((st, i) => (
                <View key={i} style={s.statCard}>
                  <Text style={s.statVal}>{st.n}</Text>
                  <Text style={s.statLabel}>{st.l}</Text>
                </View>
              ))}
            </View>

            {/* Weekly chart */}
            <BotanicalCard style={{ marginTop: 14, padding: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <View>
                  <Eyebrow>tuần này</Eyebrow>
                  <Text style={s.chartTitle}>Mức ù trung bình</Text>
                </View>
                <Text style={s.chartVal}>3.2</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 60 }}>
                {WEEK_DATA.map((v, i) => (
                  <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                    <View style={{ width: '100%', height: v * 8, borderRadius: 4, backgroundColor: i === 6 ? V.sage : `${V.sage}4D` }} />
                    <Text style={{ fontSize: 10, color: V.textMuted, fontWeight: '600' }}>{DAY_LABELS[i]}</Text>
                  </View>
                ))}
              </View>
            </BotanicalCard>

            {/* Subscription */}
            <BotanicalCard tint="terra" style={{ marginTop: 12, padding: 16, overflow: 'hidden' }}>
              <View style={{ position: 'absolute', top: -10, right: -10, opacity: 0.4 }}>
                <LotusOrb size={100} progress={1} animate={false} />
              </View>
              <View>
                <Eyebrow style={{ color: V.terracotta }}>{isPro ? 'Premium' : 'Free'}</Eyebrow>
                <Text style={s.chartTitle}>{isPro ? 'Khu vườn đầy đủ' : 'Nâng cấp để mở khoá'}</Text>
                {isPro && <Text style={{ fontSize: 12, color: V.textSecondary, marginTop: 2 }}>Còn 23 ngày</Text>}
                <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/pricing'); }}
                  style={s.upgradeBtn}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: V.bg }}>
                    {isPro ? 'Quản lý gói' : 'Nâng cấp ngay'}
                  </Text>
                </TouchableOpacity>
              </View>
            </BotanicalCard>

            {/* Settings */}
            <BotanicalCard style={{ marginTop: 14, padding: 0 }}>
              {SETTINGS.map((row, i) => (
                <TouchableOpacity key={i} onPress={row.onPress} disabled={!row.onPress}
                  style={[s.settingRow, i < SETTINGS.length - 1 && { borderBottomWidth: 1, borderBottomColor: 'rgba(245,237,224,0.06)' }]}>
                  <View style={s.settingIcon}>{row.icon}</View>
                  <Text style={s.settingLabel}>{row.label}</Text>
                  {row.right}
                </TouchableOpacity>
              ))}
            </BotanicalCard>

            {/* Logout */}
            <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
              <LogOut size={16} color="#FF6B6B" />
              <Text style={s.logoutText}>{lang === 'vi' ? 'Đăng xuất' : 'Log out'}</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  eyebrow:     { fontSize: 20, fontWeight: '600', color: V.sage },
  userName:    { fontSize: 26, fontWeight: '500', color: V.cream, letterSpacing: -0.4 },
  avatar:      { width: 96, height: 96, borderRadius: 48, backgroundColor: `${V.petal}CC`, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(245,237,224,0.15)' },
  email:       { fontSize: 13, color: V.textMuted, fontWeight: '500', textAlign: 'center', marginTop: 2 },
  statCard:    { flex: 1, padding: 14, backgroundColor: 'rgba(245,237,224,0.04)', borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(245,237,224,0.06)' },
  statVal:     { fontSize: 22, fontWeight: '600', color: V.cream, letterSpacing: -0.3 },
  statLabel:   { fontSize: 11, color: V.textMuted, fontWeight: '600', marginTop: 2 },
  chartTitle:  { fontSize: 17, fontWeight: '500', color: V.cream },
  chartVal:    { fontSize: 22, fontWeight: '600', color: V.sage, letterSpacing: -0.5 },
  upgradeBtn:  { marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: V.terracotta },
  settingRow:  { flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 16 },
  settingIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(168,197,160,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  settingLabel:{ flex: 1, fontSize: 14, color: V.cream, fontWeight: '600' },
  langText:    { fontSize: 13, color: V.textSecondary, fontWeight: '600' },
  logoutBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, paddingVertical: 14, borderRadius: 14, backgroundColor: 'rgba(255,107,107,0.08)', borderWidth: 1, borderColor: 'rgba(255,107,107,0.15)' },
  logoutText:  { fontSize: 14, fontWeight: '700', color: '#FF6B6B' },
});
