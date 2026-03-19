'use client'
// Preset UI metadata for each therapy sound type
import type { TherapySound } from '@/types'

interface TherapyPreset {
  label: string
  labelVi: string
  description: string
  descriptionVi: string
  color: string
  icon: string
}

export const THERAPY_PRESETS: Record<TherapySound, TherapyPreset> = {
  white_noise: {
    label: 'White Noise',
    labelVi: 'Tiếng ồn trắng',
    description: 'Broadband noise that masks all tinnitus frequencies equally.',
    descriptionVi: 'Tiếng ồn dải rộng che phủ mọi tần số ù tai.',
    color: '#e2e8f0',
    icon: '〰️',
  },
  pink_noise: {
    label: 'Pink Noise',
    labelVi: 'Tiếng ồn hồng',
    description: 'Balanced noise with reduced highs — natural and soothing.',
    descriptionVi: 'Tiếng ồn cân bằng, giảm tần cao — tự nhiên và dễ chịu.',
    color: '#fbcfe8',
    icon: '🌸',
  },
  brown_noise: {
    label: 'Brown Noise',
    labelVi: 'Tiếng ồn nâu',
    description: 'Deep, rumbling noise — great for low-pitched tinnitus.',
    descriptionVi: 'Âm trầm sâu — phù hợp với ù tai tần số thấp.',
    color: '#a16207',
    icon: '🟤',
  },
  rain: {
    label: 'Rain',
    labelVi: 'Tiếng mưa',
    description: 'Gentle rainfall — calming and immersive.',
    descriptionVi: 'Mưa nhẹ — yên bình và thư giãn.',
    color: '#93c5fd',
    icon: '🌧️',
  },
  ocean: {
    label: 'Ocean Waves',
    labelVi: 'Sóng biển',
    description: 'Rhythmic ocean waves for deep relaxation.',
    descriptionVi: 'Sóng biển nhịp nhàng giúp thư giãn sâu.',
    color: '#0ea5e9',
    icon: '🌊',
  },
  forest: {
    label: 'Forest',
    labelVi: 'Rừng xanh',
    description: 'Wind rustling through leaves in a peaceful forest.',
    descriptionVi: 'Gió xào xạc qua lá trong rừng yên tĩnh.',
    color: '#16a34a',
    icon: '🌲',
  },
  campfire: {
    label: 'Campfire',
    labelVi: 'Lửa trại',
    description: 'Crackling fire sounds for warmth and comfort.',
    descriptionVi: 'Tiếng lửa tí tách ấm áp và thư thái.',
    color: '#ea580c',
    icon: '🔥',
  },
  birds: {
    label: 'Birds',
    labelVi: 'Tiếng chim',
    description: 'Morning birdsong for a natural wake-up atmosphere.',
    descriptionVi: 'Tiếng chim ban sáng tạo không khí tự nhiên.',
    color: '#65a30d',
    icon: '🐦',
  },
  creek: {
    label: 'Creek',
    labelVi: 'Suối chảy',
    description: 'Gentle stream flowing over rocks — deeply calming.',
    descriptionVi: 'Suối nhẹ chảy qua đá — cực kỳ thư giãn.',
    color: '#06b6d4',
    icon: '💧',
  },
  thunder: {
    label: 'Thunder',
    labelVi: 'Tiếng sấm',
    description: 'Distant rumbling thunder for cozy relaxation.',
    descriptionVi: 'Tiếng sấm xa xa tạo cảm giác ấm cúng.',
    color: '#475569',
    icon: '⛈️',
  },
  wind: {
    label: 'Wind',
    labelVi: 'Tiếng gió',
    description: 'Soft wind blowing through open spaces.',
    descriptionVi: 'Gió nhẹ thổi qua không gian mở.',
    color: '#94a3b8',
    icon: '💨',
  },
  singing_bowl: {
    label: 'Singing Bowl',
    labelVi: 'Chuông xoay',
    description: 'Tibetan singing bowl at 528 Hz — healing frequency.',
    descriptionVi: 'Chuông xoay Tây Tạng 528 Hz — tần số chữa lành.',
    color: '#d97706',
    icon: '🔔',
  },
  wind_chimes: {
    label: 'Wind Chimes',
    labelVi: 'Chuông gió',
    description: 'Gentle metallic tones carried by the breeze.',
    descriptionVi: 'Tiếng chuông gió nhẹ nhàng trong gió.',
    color: '#c084fc',
    icon: '🎐',
  },
  crickets: {
    label: 'Crickets',
    labelVi: 'Dế đêm',
    description: 'Nighttime cricket chorus for peaceful sleep.',
    descriptionVi: 'Hợp xướng dế ban đêm cho giấc ngủ yên bình.',
    color: '#84cc16',
    icon: '🦗',
  },
  heartbeat: {
    label: 'Heartbeat',
    labelVi: 'Nhịp tim',
    description: 'Steady heartbeat rhythm — grounding and calming.',
    descriptionVi: 'Nhịp tim đều đặn — giúp bình tĩnh và ổn định.',
    color: '#ef4444',
    icon: '❤️',
  },
  om_drone: {
    label: 'OM Drone',
    labelVi: 'Tiếng OM',
    description: 'Deep OM vibration at 136.1 Hz — meditation frequency.',
    descriptionVi: 'Rung động OM sâu 136.1 Hz — tần số thiền định.',
    color: '#7c3aed',
    icon: '🕉️',
  },
  binaural_alpha: {
    label: 'Binaural Alpha (10 Hz)',
    labelVi: 'Sóng alpha nhị tai (10 Hz)',
    description: 'Alpha waves promote relaxed alertness and reduce anxiety.',
    descriptionVi: 'Sóng alpha giúp tỉnh táo thư giãn và giảm lo âu.',
    color: '#a78bfa',
    icon: '🧠',
  },
  binaural_theta: {
    label: 'Binaural Theta (6 Hz)',
    labelVi: 'Sóng theta nhị tai (6 Hz)',
    description: 'Theta waves support deep meditation and creativity.',
    descriptionVi: 'Sóng theta hỗ trợ thiền sâu và sáng tạo.',
    color: '#7c3aed',
    icon: '💜',
  },
  binaural_delta: {
    label: 'Binaural Delta (2 Hz)',
    labelVi: 'Sóng delta nhị tai (2 Hz)',
    description: 'Delta waves encourage deep, restorative sleep.',
    descriptionVi: 'Sóng delta hỗ trợ giấc ngủ sâu phục hồi.',
    color: '#1e1b4b',
    icon: '🌙',
  },
  notch_therapy: {
    label: 'Notch Therapy',
    labelVi: 'Liệu pháp lọc âm',
    description: 'Personalized audio with tinnitus frequency notched out.',
    descriptionVi: 'Âm thanh cá nhân hóa lọc bỏ tần số ù tai.',
    color: '#14b8a6',
    icon: '🎵',
  },
}
