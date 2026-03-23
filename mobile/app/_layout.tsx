import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserStore as useLegacyStore } from '@/store/userStore';
import { useUserStore } from '@/store/use-user-store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useSessionTracker } from '@/hooks/useSessionTracker';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { session, setSession } = useLegacyStore();
  const { setUser, clearUser } = useUserStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  // Register device for push notifications
  usePushNotifications();
  // Track session & screen views for Admin CRM
  useSessionTracker();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user.id, session.user.email ?? '');
      }
      setIsInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        await loadUserProfile(session.user.id, session.user.email ?? '');
      } else {
        clearUser();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load full profile with subscription_tier from profiles table
  async function loadUserProfile(userId: string, email: string) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, name, subscription_tier, is_admin, created_at')
        .eq('id', userId)
        .single();

      if (profile) {
        setUser({
          id: profile.id,
          email: profile.email ?? email,
          name: profile.name,
          subscription_tier: profile.subscription_tier ?? 'free',
          is_admin: profile.is_admin ?? false,
          created_at: profile.created_at,
        });
      } else {
        // Fallback: use auth user data with free tier
        setUser({
          id: userId,
          email,
          subscription_tier: 'free',
          is_admin: false,
          created_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('[Layout] Failed to load profile:', err);
    }
  }

  useEffect(() => {
    if (!isInitialized) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, isInitialized, segments]);

  if (!isInitialized) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="paywall" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="journal" options={{ headerShown: false }} />
        <Stack.Screen name="sleep" options={{ headerShown: false }} />
        <Stack.Screen name="cbti" options={{ headerShown: false }} />
        <Stack.Screen name="mixer" options={{ headerShown: false }} />
        <Stack.Screen name="zentones" options={{ headerShown: false }} />
        <Stack.Screen name="zentitone" options={{ headerShown: false }} />
        <Stack.Screen name="breathing" options={{ headerShown: false }} />
        <Stack.Screen name="notch-therapy" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
