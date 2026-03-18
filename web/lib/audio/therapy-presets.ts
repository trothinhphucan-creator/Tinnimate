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
    description: 'Birds and rustling leaves in a peaceful forest.',
    descriptionVi: 'Tiếng chim và lá xào xạc trong rừng yên tĩnh.',
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
