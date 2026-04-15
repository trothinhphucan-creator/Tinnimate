import { useState, useEffect } from 'react';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://tinnimate.vuinghe.com';

// ── Default config — used before network response arrives ─────────────────
export const DEFAULT_CONFIG: MobileConfig = {
  features: {
    zentones: true,
    notch_therapy: true,
    breathing: true,
    cbti: false,
    journal: false,
    sleep: false,
  },
  audio_tracks: [
    { id: 'rain',    name: 'Tiếng Mưa',  emoji: '🌧️', color: '#06B6D4', enabled: true },
    { id: 'ocean',   name: 'Sóng Biển',  emoji: '🌊', color: '#0EA5E9', enabled: true },
    { id: 'wind',    name: 'Gió Núi',    emoji: '🌬️', color: '#8B5CF6', enabled: true },
    { id: 'fire',    name: 'Lửa Trại',   emoji: '🔥', color: '#F97316', enabled: true },
    { id: 'white',   name: 'White Noise', emoji: '⬜', color: '#94A3B8', enabled: true },
    { id: 'forest',  name: 'Rừng Đêm',   emoji: '🌲', color: '#16A34A', enabled: true },
    { id: 'zen',     name: 'Zen Bells',  emoji: '🔔', color: '#A855F7', enabled: true },
    { id: 'tone528', name: 'Tone 528Hz', emoji: '✨', color: '#6366F1', enabled: true },
  ],
  app_banner: { active: false, text: '', color: '#4F46E5', link: '' },
  tinni_greeting: {
    messages: [
      'Tinni đang ở đây cùng bạn 💙',
      'Hôm nay bạn cảm thấy thế nào?',
      'Hãy thử 5 phút White Noise trước khi ngủ nhé!',
    ],
  },
  maintenance: { active: false, message: 'Tinnimate đang bảo trì, vui lòng thử lại sau.' },
};

// ── Types ─────────────────────────────────────────────────────────────────
export interface MobileConfig {
  features: {
    zentones: boolean;
    notch_therapy: boolean;
    breathing: boolean;
    cbti: boolean;
    journal: boolean;
    sleep: boolean;
  };
  audio_tracks: Array<{
    id: string;
    name: string;
    emoji: string;
    color: string;
    enabled: boolean;
  }>;
  app_banner: { active: boolean; text: string; color: string; link: string };
  tinni_greeting: { messages: string[] };
  maintenance: { active: boolean; message: string };
}

// ── Hook ──────────────────────────────────────────────────────────────────
let cachedConfig: MobileConfig | null = null;
let lastFetch = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 min in-memory cache

export function useRemoteConfig(): MobileConfig {
  const [config, setConfig] = useState<MobileConfig>(cachedConfig ?? DEFAULT_CONFIG);

  useEffect(() => {
    const now = Date.now();
    if (cachedConfig && now - lastFetch < CACHE_TTL) return; // use in-memory cache

    fetch(`${API_BASE}/api/mobile-config`)
      .then(r => r.json())
      .then((data: Partial<MobileConfig>) => {
        const merged: MobileConfig = { ...DEFAULT_CONFIG, ...data };
        cachedConfig = merged;
        lastFetch = Date.now();
        setConfig(merged);
      })
      .catch(() => {
        // Network fail — keep defaults, no crash
      });
  }, []);

  return config;
}
