// Shared track metadata — single source of truth for web and mobile
// Admin can override via Remote Config key "tracks"

export interface Track {
  id: string;
  name: string;       // Short name (UI)
  fullName: string;   // Full Vietnamese name
  emoji: string;
  color: string;
  free: boolean;      // false = Pro required
  file?: number;      // require('@/assets/audio/xxx.mp3') — set per platform
}

export const TRACK_META: Omit<Track, 'file'>[] = [
  // Noise
  { id: 'white',    name: 'White',   fullName: 'Ồn Trắng',    emoji: '⬜', color: '#94A3B8', free: true  },
  { id: 'pink',     name: 'Pink',    fullName: 'Ồn Hồng',     emoji: '🌸', color: '#EC4899', free: true  },
  { id: 'brown',    name: 'Brown',   fullName: 'Ồn Nâu',      emoji: '🟤', color: '#92400E', free: true  },
  // Nature
  { id: 'rain',     name: 'Mưa',     fullName: 'Tiếng Mưa',   emoji: '🌧️', color: '#06B6D4', free: true  },
  { id: 'ocean',    name: 'Sóng',    fullName: 'Sóng Biển',   emoji: '🌊', color: '#0EA5E9', free: true  },
  { id: 'forest',   name: 'Rừng',    fullName: 'Rừng Đêm',    emoji: '🌲', color: '#16A34A', free: false },
  { id: 'campfire', name: 'Lửa',     fullName: 'Lửa Trại',    emoji: '🔥', color: '#F97316', free: false },
  { id: 'birds',    name: 'Chim',    fullName: 'Tiếng Chim',  emoji: '🐦', color: '#84CC16', free: false },
  // Tones
  { id: 'zen',      name: 'Zen',     fullName: 'Zen Bells',   emoji: '🔔', color: '#A855F7', free: false },
  { id: '528hz',    name: '528Hz',   fullName: 'Tone 528Hz',  emoji: '✨', color: '#6366F1', free: false },
];

// Web mixer key → our standard id mapping
export const WEB_KEY_MAP: Record<string, string> = {
  white: 'white', pink: 'pink', brown: 'brown',
  rain: 'rain', ocean: 'ocean', forest: 'forest',
  campfire: 'campfire', birds: 'birds',
};
