import { useEffect, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { usePathname } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';
import Constants from 'expo-constants';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

// Map expo-router paths to friendly screen names
function toScreenName(path: string): string {
  if (path === '/' || path === '/(tabs)' || path === '/(tabs)/') return 'player';
  if (path.includes('explore')) return 'dashboard';
  if (path.includes('chat'))    return 'chat';
  if (path.includes('profile')) return 'profile';
  if (path.includes('journal')) return 'journal';
  if (path.includes('sleep'))   return 'sleep';
  if (path.includes('cbti'))    return 'cbti';
  if (path.includes('zentitone'))    return 'zentitone';
  if (path.includes('breathing'))    return 'breathing';
  if (path.includes('notch'))        return 'notch_therapy';
  if (path.includes('login'))        return 'login';
  if (path.includes('paywall'))      return 'paywall';
  return path.replace(/\//g, '_').replace(/^\s*_/, '');
}

export function useSessionTracker() {
  const { user } = useUserStore();
  const pathname = usePathname();

  const sessionIdRef   = useRef<string | null>(null);
  const sessionStart   = useRef<Date>(new Date());
  const screensVisited = useRef<string[]>([]);
  const screenEnter    = useRef<Date>(new Date());
  const appState       = useRef<AppStateStatus>(AppState.currentState);

  // ── Start a new session ─────────────────────────────────────────────
  async function startSession() {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('mobile_sessions')
      .insert({
        user_id: user.id,
        platform: Platform.OS as 'ios' | 'android',
        app_version: APP_VERSION,
        screens: [],
      })
      .select('id')
      .single();
    if (!error && data) {
      sessionIdRef.current = data.id;
      sessionStart.current = new Date();
      screensVisited.current = [];
    }
  }

  // ── Close session ────────────────────────────────────────────────────
  async function endSession() {
    if (!sessionIdRef.current || !user?.id) return;
    const duration = Math.round((Date.now() - sessionStart.current.getTime()) / 1000);
    await supabase
      .from('mobile_sessions')
      .update({
        session_end: new Date().toISOString(),
        duration_secs: duration,
        screens: [...new Set(screensVisited.current)],
      })
      .eq('id', sessionIdRef.current);
    sessionIdRef.current = null;
  }

  // ── Track screen view ─────────────────────────────────────────────────
  async function trackScreen(screen: string) {
    if (!user?.id) return;
    screensVisited.current.push(screen);
    await supabase.from('screen_views').insert({
      session_id: sessionIdRef.current,
      user_id: user.id,
      screen,
      viewed_at: new Date().toISOString(),
    });
  }

  // ── AppState: background → end session, foreground → resume ──────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      if (appState.current.match(/active/) && nextState.match(/inactive|background/)) {
        await endSession();
      } else if (appState.current.match(/inactive|background/) && nextState === 'active') {
        await startSession();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [user?.id]);

  // ── Start session when user logs in ──────────────────────────────────
  useEffect(() => {
    if (user?.id) startSession();
    else endSession();
  }, [user?.id]);

  // ── Track screen changes ──────────────────────────────────────────────
  useEffect(() => {
    const screen = toScreenName(pathname);
    trackScreen(screen);
  }, [pathname]);
}
