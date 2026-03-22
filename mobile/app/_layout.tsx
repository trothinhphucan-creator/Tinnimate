import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useSessionTracker } from '@/hooks/useSessionTracker';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { session, setSession } = useUserStore();
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
      setIsInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Redirect to the login page.
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // Redirect away from the login page.
      router.replace('/(tabs)');
    }
  }, [session, isInitialized, segments]);

  if (!isInitialized) return null; // Or a splash screen

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
        <Stack.Screen name="zentitone" options={{ headerShown: false }} />
        <Stack.Screen name="breathing" options={{ headerShown: false }} />
        <Stack.Screen name="notch-therapy" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
