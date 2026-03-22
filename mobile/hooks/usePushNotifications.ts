import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';

// Configure how notifications appear when app is foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('[push] Skip — not a physical device');
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[push] Permission denied');
    return null;
  }

  // Get Expo Push Token — requires projectId (not available in Expo Go)
  try {
    const projectId =
      (Constants.expoConfig?.extra?.eas?.projectId as string | undefined) ??
      (Constants.easConfig?.projectId as string | undefined);
    if (!projectId) {
      console.log('[push] No projectId — skipping token (Expo Go)');
      return null;
    }
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366F1',
      });
    }
    return token;
  } catch (e) {
    console.log('[push] Token error (Expo Go?):', e);
    return null;
  }
}

async function savePushToken(token: string, userId: string) {
  const platform = Platform.OS as 'ios' | 'android' | 'web';
  const deviceName = Device.deviceName ?? undefined;

  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      { user_id: userId, token, platform, device_name: deviceName, last_seen: new Date().toISOString() },
      { onConflict: 'user_id,token' }
    );

  if (error) console.warn('[push] Failed to save token:', error.message);
  else console.log('[push] Token saved:', token.slice(0, 20) + '...');
}

// ── Hook ────────────────────────────────────────────────────────────────
export function usePushNotifications() {
  const { user } = useUserStore();
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener     = useRef<Notifications.Subscription | undefined>(undefined);

  useEffect(() => {
    if (user?.id) {
      registerForPushNotifications().then(token => {
        if (token) savePushToken(token, user.id);
      });
    }

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('[push] Received:', notification.request.content.title);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('[push] Tapped:', data);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user?.id]);
}
