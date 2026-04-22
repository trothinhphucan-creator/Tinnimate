import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  Platform, ActivityIndicator, ScrollView, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { V } from '@/constants/theme';
import { LotusOrb, FloatingLeavesBackground, Vine } from '@/components/botanical';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [mode,          setMode]          = useState<'login' | 'signup'>('login');
  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [loading,       setLoading]       = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const [error,         setError]         = useState<string | null>(null);
  const [success,       setSuccess]       = useState<string | null>(null);

  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => { handleOAuthCallback(url); });
    Linking.getInitialURL().then(url => { if (url) handleOAuthCallback(url); });
    return () => sub.remove();
  }, []);

  async function handleOAuthCallback(url: string) {
    if (!url) return;
    try {
      if (!url.includes('auth-callback') && !url.includes('auth/callback')) return;
      const parsed = Linking.parse(url);
      const code = parsed.queryParams?.code as string | undefined;
      const oauthError = parsed.queryParams?.error as string | undefined;
      if (oauthError) { setError('Đăng nhập thất bại: ' + (parsed.queryParams?.error_description ?? oauthError)); return; }
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) setError('Xác thực thất bại: ' + error.message);
        return;
      }
      const fragment = url.split('#')[1] ?? '';
      const params = new URLSearchParams(fragment);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token') ?? '';
      if (accessToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (error) setError('Xác thực thất bại: ' + error.message);
      }
    } catch (e) { console.warn('[oauth-callback]', e); setError('Đã xảy ra lỗi xác thực.'); }
  }

  async function signInWithGoogle() {
    setSocialLoading('google'); setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const redirectTo = Linking.createURL('auth-callback');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google', options: { redirectTo, skipBrowserRedirect: true, queryParams: { access_type: 'offline', prompt: 'select_account' } },
      });
      if (error) throw error;
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === 'success' && result.url) await handleOAuthCallback(result.url);
      }
    } catch (err: any) { setError(err?.message ?? 'Đăng nhập Google thất bại'); }
    setSocialLoading(null);
  }

  async function signInWithApple() {
    if (Platform.OS !== 'ios') { setError('Apple Sign In chỉ khả dụng trên iOS'); return; }
    setSocialLoading('apple'); setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const redirectTo = Linking.createURL('auth-callback');
      const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo, skipBrowserRedirect: true } });
      if (error) throw error;
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === 'success' && result.url) await handleOAuthCallback(result.url);
      }
    } catch (err: any) { setError(err?.message ?? 'Đăng nhập Apple thất bại'); }
    setSocialLoading(null);
  }

  async function handleEmailSubmit() {
    if (!email.trim() || !password.trim()) { setError('Vui lòng nhập đầy đủ email và mật khẩu'); return; }
    setLoading(true); setError(null); setSuccess(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (mode === 'login') {
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err) { setError(translateError(err.message)); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); }
    } else {
      const { error: err } = await supabase.auth.signUp({ email: email.trim(), password });
      if (err) { setError(translateError(err.message)); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); }
      else { setSuccess('Kiểm tra email để xác nhận tài khoản, sau đó đăng nhập!'); setMode('login'); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
    }
    setLoading(false);
  }

  function translateError(err: string) {
    if (err.includes('Invalid login')) return 'Email hoặc mật khẩu không đúng';
    if (err.includes('Email not confirmed')) return 'Vui lòng xác nhận email trước';
    if (err.includes('already registered')) return 'Email đã được đăng ký';
    if (err.includes('password')) return 'Mật khẩu cần ít nhất 6 ký tự';
    return err;
  }

  return (
    <View style={{ flex: 1, backgroundColor: V.bg }}>
      <FloatingLeavesBackground count={8} />
      <View style={{ position: 'absolute', top: 20, left: -30 }}><Vine width={180} opacity={0.18} /></View>
      <View style={{ position: 'absolute', bottom: 160, right: -40, transform: [{ rotate: '180deg' }] }}><Vine width={180} opacity={0.15} /></View>

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Logo */}
            <View style={{ alignItems: 'center', marginBottom: 28 }}>
              <LotusOrb size={180} progress={0} animate />
              <Text style={s.handText}>chào mừng đến với</Text>
              <Text style={s.appName}><Text style={{ fontStyle: 'italic' }}>Tinni</Text>mate</Text>
              <Text style={s.tagline}>Khu vườn chữa lành cho đôi tai bạn · AI by Tinni</Text>
            </View>

            {/* Mode tabs */}
            <View style={s.modeTabs}>
              {(['login', 'signup'] as const).map(m => (
                <TouchableOpacity key={m} style={[s.modeTab, mode === m && s.modeTabActive]}
                  onPress={() => { setMode(m); setError(null); setSuccess(null); }}>
                  <Text style={[s.modeTabText, mode === m && s.modeTabTextActive]}>
                    {m === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Social buttons */}
            <View style={s.socialRow}>
              <TouchableOpacity style={s.socialBtn} onPress={signInWithGoogle} disabled={!!socialLoading} activeOpacity={0.8}>
                <Text style={s.socialIcon}>G</Text>
                <Text style={s.socialLabel}>{socialLoading === 'google' ? 'Đang mở...' : 'Google'}</Text>
              </TouchableOpacity>
              {Platform.OS === 'ios' && (
                <TouchableOpacity style={s.socialBtn} onPress={signInWithApple} disabled={!!socialLoading} activeOpacity={0.8}>
                  <Text style={s.socialIcon}></Text>
                  <Text style={s.socialLabel}>{socialLoading === 'apple' ? 'Đang mở...' : 'Apple'}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Divider */}
            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>hoặc</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Email form */}
            <View style={{ gap: 10 }}>
              <TextInput style={s.input} placeholder="Email" placeholderTextColor={V.textDim} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
              <TextInput style={s.input} placeholder="Mật khẩu" placeholderTextColor={V.textDim} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
              {error   && <View style={s.msgBox}><Text style={{ color: V.error, fontSize: 13 }}>⚠️ {error}</Text></View>}
              {success && <View style={[s.msgBox, { backgroundColor: V.successBg, borderColor: V.success + '40' }]}><Text style={{ color: V.success, fontSize: 13 }}>✅ {success}</Text></View>}
              <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.6 }]} onPress={handleEmailSubmit} disabled={loading} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color={V.bg} /> : <Text style={s.submitText}>{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</Text>}
              </TouchableOpacity>
            </View>

            <Text style={s.note}>Cùng account với <Text style={{ color: V.terracotta }}>tinnimate.vuinghe.com</Text></Text>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  scroll:         { paddingHorizontal: 28, paddingBottom: 40, paddingTop: 16, flexGrow: 1 },
  handText:       { fontSize: 22, fontWeight: '600', color: V.sage, marginTop: 16 },
  appName:        { fontSize: 44, fontWeight: '400', color: V.cream, letterSpacing: -1, marginTop: -4 },
  tagline:        { fontSize: 14, color: V.textSecondary, fontWeight: '500', marginTop: 8, textAlign: 'center', maxWidth: 260, lineHeight: 20 },
  modeTabs:       { flexDirection: 'row', backgroundColor: V.surface, borderRadius: 14, padding: 4, marginBottom: 20 },
  modeTab:        { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  modeTabActive:  { backgroundColor: V.surfaceHighest },
  modeTabText:    { fontSize: 14, fontWeight: '600', color: V.textMuted },
  modeTabTextActive: { color: V.cream },
  socialRow:      { flexDirection: 'row', gap: 10, marginBottom: 16 },
  socialBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 14, backgroundColor: V.surface, borderWidth: 1, borderColor: V.borderCard },
  socialIcon:     { fontSize: 15, fontWeight: '700', color: V.cream },
  socialLabel:    { fontSize: 14, fontWeight: '600', color: V.cream },
  dividerRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  dividerLine:    { flex: 1, height: 1, backgroundColor: V.borderCard },
  dividerText:    { fontSize: 13, color: V.textMuted, fontWeight: '500' },
  input:          { backgroundColor: V.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: V.cream, borderWidth: 1, borderColor: V.borderCard },
  msgBox:         { backgroundColor: V.errorBg, borderWidth: 1, borderColor: `${V.error}40`, borderRadius: 10, padding: 12 },
  submitBtn:      { backgroundColor: V.sage, borderRadius: 999, paddingVertical: 16, alignItems: 'center', marginTop: 4, shadowColor: V.sage, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  submitText:     { fontSize: 15, fontWeight: '700', color: V.bg, letterSpacing: 0.3 },
  note:           { fontSize: 12, color: V.textMuted, textAlign: 'center', marginTop: 20 },
});
