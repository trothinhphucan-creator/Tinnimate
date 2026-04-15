import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput,
  TouchableOpacity, Dimensions, KeyboardAvoidingView,
  Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { TinniOrb } from '@/components/TinniOrb';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();


// ── Social Button ─────────────────────────────────────────────────────────
function SocialBtn({
  icon, label, onPress, disabled,
}: {
  icon: string; label: string; onPress: () => void; disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.socialBtn}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}>
      <Text style={styles.socialIcon}>{icon}</Text>
      <Text style={styles.socialLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Divider ──────────────────────────────────────────────────────────────
function Divider() {
  return (
    <View style={styles.divider}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>hoặc</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

export default function LoginScreen() {
  const [mode, setMode]         = useState<'login' | 'signup'>('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);

  // ── Handle OAuth deep link callback ──────────────────────────────────
  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      handleOAuthCallback(url);
    });
    // Also handle if app was cold-opened by the link
    Linking.getInitialURL().then(url => { if (url) handleOAuthCallback(url); });
    return () => sub.remove();
  }, []);

  async function handleOAuthCallback(url: string) {
    if (!url) return;
    try {
      // Accept any URL containing auth-callback (works for both dev exp:// and prod tinnimate://)
      if (!url.includes('auth-callback') && !url.includes('auth/callback')) return;

      // PKCE flow: ?code=...
      const parsed  = Linking.parse(url);
      const code    = parsed.queryParams?.code as string | undefined;
      const oauthError = parsed.queryParams?.error as string | undefined;

      if (oauthError) {
        setError('Đăng nhập thất bại: ' + (parsed.queryParams?.error_description ?? oauthError));
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setError('Xác thực thất bại: ' + error.message);
        }
        // On success, the auth state listener in _layout.tsx will navigate to home
        return;
      }
      // Implicit flow: #access_token=...&refresh_token=...
      const fragment      = url.split('#')[1] ?? '';
      const params        = new URLSearchParams(fragment);
      const accessToken   = params.get('access_token');
      const refreshToken  = params.get('refresh_token') ?? '';
      if (accessToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (error) setError('Xác thực thất bại: ' + error.message);
      }
    } catch (e) {
      console.warn('[oauth-callback]', e);
      setError('Đã xảy ra lỗi khi xác thực. Vui lòng thử lại.');
    }
  }

  // ── Google OAuth ──────────────────────────────────────────────────────
  async function signInWithGoogle() {
    setSocialLoading('google');
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const redirectTo = Linking.createURL('auth-callback');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: { access_type: 'offline', prompt: 'select_account' },
        },
      });
      if (error) throw error;
      if (data?.url) {
        // openAuthSessionAsync handles the redirect back to the app
        // and returns the callback URL with the authorization code
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === 'success' && result.url) {
          await handleOAuthCallback(result.url);
        } else if (result.type === 'cancel') {
          // User cancelled — do nothing
        }
      }
    } catch (err: any) {
      setError(err?.message ?? 'Đăng nhập Google thất bại');
    }
    setSocialLoading(null);
  }

  // ── Apple OAuth ───────────────────────────────────────────────────────
  async function signInWithApple() {
    if (Platform.OS !== 'ios') {
      setError('Apple Sign In chỉ khả dụng trên iOS');
      return;
    }
    setSocialLoading('apple');
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const redirectTo = Linking.createURL('auth-callback');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === 'success' && result.url) {
          await handleOAuthCallback(result.url);
        }
      }
    } catch (err: any) {
      setError(err?.message ?? 'Đăng nhập Apple thất bại');
    }
    setSocialLoading(null);
  }

  // ── Email/Password ────────────────────────────────────────────────────
  async function handleEmailSubmit() {
    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (mode === 'login') {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(), password,
      });
      if (err) {
        setError(translateError(err.message));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } else {
      const { error: err } = await supabase.auth.signUp({
        email: email.trim(), password,
      });
      if (err) {
        setError(translateError(err.message));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        setSuccess('Kiểm tra email để xác nhận tài khoản, sau đó đăng nhập!');
        setMode('login');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Logo */}
          <View style={styles.logoArea}>
            <TinniOrb mode="idle" size={100} />
            <Text style={styles.appName}>Tinnimate</Text>
            <Text style={styles.tagline}>Đồng hành trị liệu ù tai · AI by Tinni</Text>
          </View>

          {/* Mode tabs */}
          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'login' && styles.modeTabActive]}
              onPress={() => { setMode('login'); setError(null); setSuccess(null); }}>
              <Text style={[styles.modeTabText, mode === 'login' && styles.modeTabTextActive]}>
                Đăng nhập
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'signup' && styles.modeTabActive]}
              onPress={() => { setMode('signup'); setError(null); setSuccess(null); }}>
              <Text style={[styles.modeTabText, mode === 'signup' && styles.modeTabTextActive]}>
                Đăng ký
              </Text>
            </TouchableOpacity>
          </View>

          {/* Social logins */}
          <View style={styles.socialRow}>
            <SocialBtn
              icon="G"
              label={socialLoading === 'google' ? 'Đang mở...' : 'Google'}
              onPress={signInWithGoogle}
              disabled={!!socialLoading}
            />
            {Platform.OS === 'ios' && (
              <SocialBtn
                icon=""
                label={socialLoading === 'apple' ? 'Đang mở...' : 'Apple'}
                onPress={signInWithApple}
                disabled={!!socialLoading}
              />
            )}
          </View>

          <Divider />

          {/* Email form */}
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#484551"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu"
              placeholderTextColor="#484551"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            {error && (
              <View style={styles.msgBox}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            )}
            {success && (
              <View style={[styles.msgBox, styles.successBox]}>
                <Text style={styles.successText}>✅ {success}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, loading && { opacity: 0.6 }]}
              onPress={handleEmailSubmit}
              disabled={loading}
              activeOpacity={0.85}>
              {loading
                ? <ActivityIndicator color="#1D1928" />
                : <Text style={styles.submitText}>
                    {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                  </Text>}
            </TouchableOpacity>
          </View>

          <Text style={styles.note}>
            Cùng account với{' '}
            <Text style={{ color: '#C7BFFF' }}>tinnimate.vuinghe.com</Text>
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const GAP = 12;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#151120' },
  scroll: { paddingHorizontal: 28, paddingBottom: 40, paddingTop: 16, justifyContent: 'center', flexGrow: 1 },

  logoArea: { alignItems: 'center', marginBottom: 32 },
  appName: { fontSize: 28, fontWeight: '800', color: '#E7DFF5', marginTop: 14, letterSpacing: -0.5 },
  tagline: { fontSize: 12, color: '#938F9C', marginTop: 4, textAlign: 'center' },

  modeTabs: {
    flexDirection: 'row', backgroundColor: '#1D1928', borderRadius: 14,
    padding: 4, marginBottom: 20, borderWidth: 1, borderColor: '#2C2837',
  },
  modeTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  modeTabActive: { backgroundColor: '#4533AD' },
  modeTabText: { fontSize: 14, fontWeight: '600', color: '#938F9C' },
  modeTabTextActive: { color: '#fff' },

  socialRow: { flexDirection: 'row', gap: GAP, marginBottom: 16 },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#1D1928', borderRadius: 14,
    borderWidth: 1, borderColor: '#2C2837', paddingVertical: 13,
  },
  socialIcon: {
    fontSize: 16, fontWeight: '900', color: '#E2E8F0',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  socialLabel: { fontSize: 14, fontWeight: '600', color: '#C9C4D3' },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#2C2837' },
  dividerText: { fontSize: 12, color: '#484551', fontWeight: '500' },

  form: { gap: GAP, marginBottom: 20 },
  input: {
    backgroundColor: '#1D1928', borderRadius: 14, borderWidth: 1, borderColor: '#2C2837',
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#E2E8F0',
  },
  msgBox: {
    backgroundColor: '#EF444415', borderRadius: 12,
    borderWidth: 1, borderColor: '#EF444430', padding: 12,
  },
  successBox: { backgroundColor: '#10B98115', borderColor: '#10B98130' },
  errorText: { fontSize: 13, color: '#FCA5A5', lineHeight: 18 },
  successText: { fontSize: 13, color: '#6EE7B7', lineHeight: 18 },
  submitBtn: {
    backgroundColor: '#FBBC00', borderRadius: 100, paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#C7BFFF', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45, shadowRadius: 12, elevation: 8,
  },
  submitText: { fontSize: 16, fontWeight: '700', color: '#1D1928' },
  note: { textAlign: 'center', fontSize: 11, color: '#2C2837' },
});
