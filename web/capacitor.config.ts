import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vuinghe.tinnimate',
  appName: 'TinniMate',
  webDir: 'out',

  // Live reload from production server
  server: {
    url: 'https://tinnimate.vuinghe.com',
    cleartext: false,
    allowNavigation: [
      'tinnimate.vuinghe.com',
      '*.supabase.co',
      '*.supabase.com',
      'accounts.google.com',
      '*.google.com',
      'appleid.apple.com',
      '*.apple.com',
    ],
  },

  // iOS-specific settings
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#020617',
    preferredContentMode: 'mobile',
    scheme: 'TinniMate',
    appendUserAgent: 'TinniMateApp',
  },

  // Android-specific settings
  android: {
    backgroundColor: '#020617',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    appendUserAgent: 'TinniMateApp',
  },

  // Plugins
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#020617',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#020617',
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
