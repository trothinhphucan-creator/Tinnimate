import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput,
  TouchableOpacity, Dimensions, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { TinniOrb } from '@/components/TinniOrb';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [mode, setMode]         = useState<'login' | 'signup'>('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);

  const { signIn, signUp } = useAuth();
  const router = useRouter();

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (mode === 'login') {
      const { error: err } = await signIn(email.trim(), password);
      if (err) {
        setError(translateError(err));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)');
      }
    } else {
      const { error: err } = await signUp(email.trim(), password);
      if (err) {
        setError(translateError(err));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        setSuccess('Kiểm tra email để xác nhận tài khoản, sau đó đăng nhập!');
        setMode('login');
      }
    }
    setLoading(false);
  }

  function translateError(err: string) {
    if (err.includes('Invalid login')) return 'Email hoặc mật khẩu không đúng';
    if (err.includes('Email not confirmed')) return 'Vui lòng xác nhận email trước khi đăng nhập';
    if (err.includes('already registered')) return 'Email này đã được đăng ký';
    if (err.includes('password')) return 'Mật khẩu cần ít nhất 6 ký tự';
    return err;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.inner} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Aurora Orb logo */}
        <View style={styles.logoArea}>
          <TinniOrb mode="idle" size={100} />
          <Text style={styles.appName}>Tinnimate</Text>
          <Text style={styles.tagline}>Đồng hành trị liệu ù tai</Text>
        </View>

        {/* Mode tabs */}
        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'login' && styles.modeTabActive]}
            onPress={() => { setMode('login'); setError(null); }}>
            <Text style={[styles.modeTabText, mode === 'login' && styles.modeTabTextActive]}>
              Đăng nhập
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'signup' && styles.modeTabActive]}
            onPress={() => { setMode('signup'); setError(null); }}>
            <Text style={[styles.modeTabText, mode === 'signup' && styles.modeTabTextActive]}>
              Đăng ký
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
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

          {/* Error / Success messages */}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}
          {success && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>✅ {success}</Text>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#1D1928" />
              : <Text style={styles.submitText}>
                  {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                </Text>}
          </TouchableOpacity>
        </View>

        {/* Skip / guest */}
        <TouchableOpacity style={styles.skipBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.skipText}>Dùng thử không cần tài khoản →</Text>
        </TouchableOpacity>

        {/* Note */}
        <Text style={styles.note}>
          Cùng account với{' '}
          <Text style={{ color: '#C7BFFF' }}>tinnimate.vuinghe.com</Text>
        </Text>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#151120' },
  inner: { flex: 1, paddingHorizontal: 28, justifyContent: 'center' },

  logoArea: { alignItems: 'center', marginBottom: 40 },
  appName: { fontSize: 28, fontWeight: '800', color: '#E7DFF5', marginTop: 16, letterSpacing: -0.5 },
  tagline: { fontSize: 13, color: '#938F9C', marginTop: 4 },

  modeTabs: {
    flexDirection: 'row', backgroundColor: '#1D1928',
    borderRadius: 14, padding: 4, marginBottom: 24,
    borderWidth: 1, borderColor: '#2C2837',
  },
  modeTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  modeTabActive: { backgroundColor: '#4533AD' },
  modeTabText: { fontSize: 14, fontWeight: '600', color: '#938F9C' },
  modeTabTextActive: { color: '#fff' },

  form: { gap: 12, marginBottom: 20 },
  input: {
    backgroundColor: '#1D1928', borderRadius: 14,
    borderWidth: 1, borderColor: '#2C2837',
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: '#E2E8F0',
  },
  errorBox: {
    backgroundColor: '#EF444415', borderRadius: 12,
    borderWidth: 1, borderColor: '#EF444430',
    padding: 12,
  },
  errorText: { fontSize: 13, color: '#FCA5A5', lineHeight: 18 },
  successBox: {
    backgroundColor: '#10B98115', borderRadius: 12,
    borderWidth: 1, borderColor: '#10B98130',
    padding: 12,
  },
  successText: { fontSize: 13, color: '#6EE7B7', lineHeight: 18 },

  submitBtn: {
    backgroundColor: '#FBBC00', borderRadius: 100,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: '#C7BFFF', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#1D1928' },

  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipText: { fontSize: 13, color: '#484551' },

  note: { textAlign: 'center', fontSize: 11, color: '#2C2837', marginTop: 8 },
});
