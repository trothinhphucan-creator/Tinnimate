import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  ScrollView, Switch, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { TinniOrb } from '@/components/TinniOrb';
import { LogOut, Bell, Moon, Globe, ChevronRight, Shield } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const SETTINGS = [
  { id: 'notify', icon: Bell,   label: 'Nhắc nhở hàng ngày', toggle: true,  value: true  },
  { id: 'sleep',  icon: Moon,   label: 'Chế độ ngủ tự động', toggle: true,  value: false },
  { id: 'lang',   icon: Globe,  label: 'Ngôn ngữ',           toggle: false, right: 'Tiếng Việt' },
  { id: 'privacy',icon: Shield, label: 'Quyền riêng tư',     toggle: false, right: '' },
];

export default function ProfileScreen() {
  const [toggles, setToggles] = useState<Record<string, boolean>>({ notify: true, sleep: false });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.orbWrapper}>
            <TinniOrb mode="idle" size={80} />
          </View>
          <Text style={styles.userName}>Người dùng</Text>
          <Text style={styles.userEmail}>Đăng nhập để lưu tiến trình</Text>
          <TouchableOpacity style={styles.loginBtn} activeOpacity={0.85}>
            <Text style={styles.loginBtnText}>Đăng nhập / Đăng ký</Text>
          </TouchableOpacity>
        </View>

        {/* Stats summary */}
        <View style={styles.statsRow}>
          {[
            { label: 'Ngày check-in', value: '7' },
            { label: 'Phiên trị liệu', value: '23' },
            { label: 'Điểm THI', value: '82' },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statVal}>{s.value}</Text>
              <Text style={styles.statLbl}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Settings */}
        <Text style={styles.sectionLabel}>Cài đặt</Text>
        <View style={styles.settingsCard}>
          {SETTINGS.map((s, i) => {
            const Icon = s.icon;
            return (
              <View key={s.id}>
                <TouchableOpacity
                  style={styles.settingRow}
                  activeOpacity={s.toggle ? 1 : 0.7}
                  onPress={() => { if (!s.toggle) Haptics.selectionAsync(); }}>
                  <View style={styles.settingLeft}>
                    <View style={styles.settingIcon}>
                      <Icon size={16} color="#818CF8" />
                    </View>
                    <Text style={styles.settingLabel}>{s.label}</Text>
                  </View>
                  {s.toggle ? (
                    <Switch
                      value={toggles[s.id]}
                      onValueChange={v => { setToggles(p => ({ ...p, [s.id]: v })); Haptics.selectionAsync(); }}
                      trackColor={{ false: '#1E293B', true: '#4F46E5' }}
                      thumbColor="#fff"
                    />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      {s.right ? <Text style={styles.settingRight}>{s.right}</Text> : null}
                      <ChevronRight size={16} color="#334155" />
                    </View>
                  )}
                </TouchableOpacity>
                {i < SETTINGS.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}
        </View>

        {/* About */}
        <Text style={styles.sectionLabel}>Về ứng dụng</Text>
        <View style={styles.aboutCard}>
          <View style={styles.aboutOrb}>
            <TinniOrb mode="chat" size={40} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.aboutTitle}>Tinnimate</Text>
            <Text style={styles.aboutVersion}>Version 1.0.0 · Aurora Orb Edition</Text>
            <Text style={styles.aboutDesc}>
              Ứng dụng trị liệu ù tai với AI Tinni — người bạn đồng hành chữa lành 24/7.
            </Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8}>
          <LogOut size={16} color="#EF4444" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  profileHeader: { alignItems: 'center', paddingTop: 20, paddingBottom: 24 },
  orbWrapper: { marginBottom: 12 },
  userName: { fontSize: 20, fontWeight: '800', color: '#E0E7FF', marginBottom: 4 },
  userEmail: { fontSize: 13, color: '#475569', marginBottom: 16 },
  loginBtn: {
    paddingHorizontal: 24, paddingVertical: 10, borderRadius: 100,
    backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  loginBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: '#0F172A', borderRadius: 16,
    borderWidth: 1, borderColor: '#1E293B', padding: 14, alignItems: 'center',
  },
  statVal: { fontSize: 20, fontWeight: '800', color: '#C7D2FE' },
  statLbl: { fontSize: 9, color: '#475569', marginTop: 3, textAlign: 'center' },

  sectionLabel: {
    fontSize: 11, color: '#334155', fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10,
  },
  settingsCard: {
    backgroundColor: '#0F172A', borderRadius: 18,
    borderWidth: 1, borderColor: '#1E293B', marginBottom: 24, overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#4F46E518', alignItems: 'center', justifyContent: 'center',
  },
  settingLabel: { fontSize: 14, color: '#CBD5E1' },
  settingRight: { fontSize: 13, color: '#475569' },
  divider: { height: 1, backgroundColor: '#1E293B', marginHorizontal: 16 },

  aboutCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#0F172A', borderRadius: 18,
    borderWidth: 1, borderColor: '#1E293B',
    padding: 16, marginBottom: 24,
  },
  aboutOrb: { width: 40, height: 40 },
  aboutTitle: { fontSize: 15, fontWeight: '700', color: '#E0E7FF', marginBottom: 2 },
  aboutVersion: { fontSize: 11, color: '#4F46E5', marginBottom: 4 },
  aboutDesc: { fontSize: 12, color: '#64748B', lineHeight: 17 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14,
    borderWidth: 1, borderColor: '#EF444430', backgroundColor: '#EF444408',
  },
  logoutText: { fontSize: 14, fontWeight: '600', color: '#EF4444' },
});
