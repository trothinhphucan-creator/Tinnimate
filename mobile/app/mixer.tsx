import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, Dimensions, PanResponder, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Plus, X, Play, Pause, ChevronLeft, Sliders } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { TinniOrb } from '@/components/TinniOrb';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 120;

const ALL_SOUNDS = [
  { id: 'white',    emoji: '⬜', name: 'Ồn trắng',   color: '#94A3B8', file: require('@/assets/audio/white.mp3')    },
  { id: 'pink',     emoji: '🌸', name: 'Ồn hồng',    color: '#EC4899', file: require('@/assets/audio/pink.mp3')     },
  { id: 'brown',    emoji: '🟤', name: 'Ồn nâu',     color: '#92400E', file: require('@/assets/audio/brown.mp3')    },
  { id: 'rain',     emoji: '🌧️', name: 'Tiếng mưa',  color: '#06B6D4', file: require('@/assets/audio/rain.mp3')     },
  { id: 'ocean',    emoji: '🌊', name: 'Sóng biển',  color: '#0EA5E9', file: require('@/assets/audio/ocean.mp3')    },
  { id: 'forest',   emoji: '🌲', name: 'Rừng đêm',   color: '#16A34A', file: require('@/assets/audio/forest.mp3')   },
  { id: 'campfire', emoji: '🔥', name: 'Lửa trại',   color: '#F97316', file: require('@/assets/audio/campfire.mp3') },
  { id: 'birds',    emoji: '🐦', name: 'Tiếng chim', color: '#84CC16', file: require('@/assets/audio/birds.mp3')    },
  { id: 'zen',      emoji: '🔔', name: 'Zen bells',  color: '#A855F7', file: require('@/assets/audio/zen.mp3')      },
  { id: '528hz',    emoji: '✨', name: 'Tone 528Hz', color: '#6366F1', file: require('@/assets/audio/528hz.mp3')    },
];

interface Layer { id: string; volume: number }

// Simple touch-drag volume slider
function VolumeSlider({
  value, color, onChange,
}: { value: number; color: string; onChange: (v: number) => void }) {
  const xAnim = useRef(new Animated.Value((value / 100) * SLIDER_WIDTH)).current;
  const xRef  = useRef((value / 100) * SLIDER_WIDTH);

  const pan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { 
      // @ts-ignore - accessing private _value property
      xRef.current = xAnim._value; 
    },
    onPanResponderMove: (_, gs) => {
      const nx = Math.max(0, Math.min(SLIDER_WIDTH, xRef.current + gs.dx));
      xAnim.setValue(nx);
      onChange(Math.round((nx / SLIDER_WIDTH) * 100));
    },
  });

  return (
    <View style={sliderStyles.track} {...pan.panHandlers}>
      <Animated.View style={[sliderStyles.fill, { width: xAnim, backgroundColor: color }]} />
      <Animated.View style={[sliderStyles.thumb, { backgroundColor: color, transform: [{ translateX: Animated.subtract(xAnim, 8) }] }]} />
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  track:  { width: SLIDER_WIDTH, height: 6, backgroundColor: '#1E293B', borderRadius: 3, marginTop: 10 },
  fill:   { height: 6, borderRadius: 3 },
  thumb:  { position: 'absolute', top: -5, width: 16, height: 16, borderRadius: 8, elevation: 4 },
});

// Each active layer gets its own player (max 3 slots)
function useLayerPlayers(layers: Layer[]) {
  const s  = (i: number) => ALL_SOUNDS.find(s => s.id === layers[i]?.id);
  const p0 = useAudioPlayer(s(0)?.file ?? require('@/assets/audio/white.mp3'));
  const p1 = useAudioPlayer(s(1)?.file ?? require('@/assets/audio/pink.mp3'));
  const p2 = useAudioPlayer(s(2)?.file ?? require('@/assets/audio/brown.mp3'));
  return [p0, p1, p2];
}

export default function MixerScreen() {
  const router = useRouter();
  const [layers, setLayers]       = useState<Layer[]>([
    { id: 'rain',  volume: 60 },
    { id: 'brown', volume: 35 },
  ]);
  const [masterVol, setMasterVol]   = useState(70);
  const [isPlaying, setIsPlaying]   = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const players = useLayerPlayers(layers);

  // Keep players in sync when layers change during playback
  useEffect(() => {
    if (!isPlaying) return;
    layers.forEach((layer, i) => {
      const p = players[i];
      if (!p) return;
      p.volume = (layer.volume / 100) * (masterVol / 100);
      p.loop   = true;
      if (!p.playing) p.play();
    });
    // Pause slots without a layer
    for (let i = layers.length; i < 3; i++) {
      if (players[i]?.playing) players[i].pause();
    }
  }, [layers, masterVol, isPlaying]);

  async function togglePlay() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setAudioModeAsync({ playsInSilentMode: true });
    if (isPlaying) {
      players.forEach(p => { try { p.pause(); } catch {} });
      setIsPlaying(false);
    } else {
      layers.forEach((layer, i) => {
        const p = players[i];
        p.volume = (layer.volume / 100) * (masterVol / 100);
        p.loop   = true;
        p.play();
      });
      setIsPlaying(true);
    }
  }

  function updateVolume(idx: number, vol: number) {
    setLayers(ls => ls.map((l, i) => i === idx ? { ...l, volume: vol } : l));
    if (isPlaying) {
      players[idx].volume = (vol / 100) * (masterVol / 100);
    }
  }

  function updateMaster(vol: number) {
    setMasterVol(vol);
    if (isPlaying) {
      layers.forEach((layer, i) => { players[i].volume = (layer.volume / 100) * (vol / 100); });
    }
  }

  function addLayer(id: string) {
    if (layers.length >= 3 || layers.some(l => l.id === id)) return;
    setLayers(ls => [...ls, { id, volume: 45 }]);
    setShowPicker(false);
    Haptics.selectionAsync();
  }

  function removeLayer(idx: number) {
    try { players[idx]?.pause(); } catch {}
    setLayers(ls => ls.filter((_, i) => i !== idx));
    Haptics.selectionAsync();
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#94A3B8" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sound Mixer</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Orb */}
        <View style={styles.orbArea}>
          <TinniOrb mode={isPlaying ? 'playing' : 'idle'} size={110} />
          <Text style={styles.orbLabel}>
            {isPlaying ? `${layers.length} track đang hòa âm` : 'Chọn âm thanh → Phát'}
          </Text>
        </View>

        {/* Master volume */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Sliders size={14} color="#475569" />
            <Text style={styles.sectionLabel}>Master Volume</Text>
            <Text style={styles.sectionVal}>{masterVol}%</Text>
          </View>
          <VolumeSlider value={masterVol} color="#6366F1" onChange={updateMaster} />
        </View>

        {/* Active layers */}
        <Text style={styles.layersTitle}>Layers ({layers.length}/3)</Text>
        {layers.map((layer, idx) => {
          const sound = ALL_SOUNDS.find(s => s.id === layer.id)!;
          return (
            <View key={`${layer.id}-${idx}`} style={[styles.layerCard, { borderColor: sound.color + '40' }]}>
              <View style={[styles.layerIcon, { backgroundColor: sound.color + '20' }]}>
                <Text style={{ fontSize: 22 }}>{sound.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.layerRow}>
                  <Text style={styles.layerName}>{sound.name}</Text>
                  <Text style={[styles.layerVol, { color: sound.color }]}>{layer.volume}%</Text>
                  <TouchableOpacity onPress={() => removeLayer(idx)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <X size={16} color="#334155" />
                  </TouchableOpacity>
                </View>
                <VolumeSlider value={layer.volume} color={sound.color} onChange={v => updateVolume(idx, v)} />
              </View>
            </View>
          );
        })}

        {/* Add layer button */}
        {layers.length < 3 && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => { Haptics.selectionAsync(); setShowPicker(v => !v); }}
            activeOpacity={0.8}>
            <Plus size={18} color="#818CF8" />
            <Text style={styles.addBtnText}>Thêm âm thanh</Text>
          </TouchableOpacity>
        )}

        {/* Sound picker */}
        {showPicker && (
          <View style={styles.pickerGrid}>
            {ALL_SOUNDS.filter(s => !layers.some(l => l.id === s.id)).map(s => (
              <TouchableOpacity
                key={s.id}
                style={[styles.pickerChip, { borderColor: s.color + '50' }]}
                onPress={() => addLayer(s.id)}
                activeOpacity={0.8}>
                <Text style={{ fontSize: 20 }}>{s.emoji}</Text>
                <Text style={[styles.pickerLabel, { color: s.color }]}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Play button */}
        <TouchableOpacity
          style={[styles.playBtn, isPlaying && styles.playBtnStop]}
          onPress={togglePlay}
          activeOpacity={0.85}>
          {isPlaying
            ? <><Pause size={20} color="#94A3B8" /><Text style={[styles.playText, { color: '#64748B' }]}>Dừng</Text></>
            : <><Play  size={20} color="#0F172A"  /><Text style={styles.playText}>Phát hòa âm</Text></>
          }
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#E0E7FF' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  orbArea: { alignItems: 'center', paddingVertical: 20 },
  orbLabel: { fontSize: 13, color: '#475569', marginTop: 12 },

  section: {
    backgroundColor: '#0F172A', borderRadius: 16, borderWidth: 1, borderColor: '#1E293B',
    padding: 14, marginBottom: 16,
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionLabel: { flex: 1, fontSize: 12, color: '#475569', fontWeight: '600' },
  sectionVal: { fontSize: 12, color: '#818CF8', fontWeight: '700' },

  layersTitle: { fontSize: 11, color: '#334155', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },

  layerCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#0F172A', borderRadius: 16, borderWidth: 1.5,
    padding: 12, marginBottom: 10,
  },
  layerIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  layerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  layerName: { flex: 1, fontSize: 14, fontWeight: '700', color: '#CBD5E1' },
  layerVol: { fontSize: 12, fontWeight: '700' },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#4F46E540', borderStyle: 'dashed',
    borderRadius: 14, paddingVertical: 14, marginBottom: 12,
  },
  addBtnText: { fontSize: 14, fontWeight: '600', color: '#818CF8' },

  pickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  pickerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#0F172A', borderRadius: 12, borderWidth: 1.5,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  pickerLabel: { fontSize: 12, fontWeight: '700' },

  playBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#C7D2FE', borderRadius: 100, paddingVertical: 18, marginTop: 8,
    shadowColor: '#818CF8', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8,
  },
  playBtnStop: { backgroundColor: '#1E293B', shadowOpacity: 0 },
  playText: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
});
