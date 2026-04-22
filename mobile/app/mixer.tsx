import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, Dimensions, PanResponder, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Plus, X, Play, Pause, ChevronLeft, Sliders, Volume2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { TinniOrb } from '@/components/TinniOrb';
import { V } from '@/constants/theme';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 140;

const ALL_SOUNDS = [
  { id: 'white',    emoji: '〰️', name: 'Ồn trắng',   color: '#7A9686', gradient: ['#1F2E25', '#3D5445'] as const, file: require('@/assets/audio/white.mp3') },
  { id: 'pink',     emoji: '🌸', name: 'Ồn hồng',    color: '#EC4899', gradient: ['#831843', '#EC4899'] as const, file: require('@/assets/audio/pink.mp3') },
  { id: 'brown',    emoji: '🟤', name: 'Ồn nâu',     color: '#92400E', gradient: ['#451A03', '#92400E'] as const, file: require('@/assets/audio/brown.mp3') },
  { id: 'rain',     emoji: '🌧️', name: 'Tiếng mưa',  color: '#06B6D4', gradient: ['#164E63', '#06B6D4'] as const, file: require('@/assets/audio/rain.mp3') },
  { id: 'ocean',    emoji: '🌊', name: 'Sóng biển',  color: '#0EA5E9', gradient: ['#0C4A6E', '#0EA5E9'] as const, file: require('@/assets/audio/ocean.mp3') },
  { id: 'forest',   emoji: '🌲', name: 'Rừng đêm',   color: '#16A34A', gradient: ['#14532D', '#16A34A'] as const, file: require('@/assets/audio/forest.mp3') },
  { id: 'campfire', emoji: '🔥', name: 'Lửa trại',   color: '#F97316', gradient: ['#7C2D12', '#F97316'] as const, file: require('@/assets/audio/campfire.mp3') },
  { id: 'birds',    emoji: '🐦', name: 'Tiếng chim', color: '#84CC16', gradient: ['#365314', '#84CC16'] as const, file: require('@/assets/audio/birds.mp3') },
  { id: 'zen',      emoji: '🔔', name: 'Zen bells',  color: '#00B896', gradient: ['#003D31', '#00B896'] as const, file: require('@/assets/audio/zen.mp3') },
  { id: '528hz',    emoji: '✨', name: 'Tone 528Hz', color: V.secondary, gradient: ['#003D31', '#C86B2A'] as const, file: require('@/assets/audio/528hz.mp3') },
];

interface Layer { id: string; volume: number }

// Volume slider with custom styling
function VolumeSlider({
  value, color, onChange,
}: { value: number; color: string; onChange: (v: number) => void }) {
  const xAnim = useRef(new Animated.Value((value / 100) * SLIDER_WIDTH)).current;
  const xRef  = useRef((value / 100) * SLIDER_WIDTH);

  const pan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      // @ts-ignore
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
  track:  { width: SLIDER_WIDTH, height: 6, backgroundColor: V.surfaceHigh, borderRadius: 3, marginTop: 10 },
  fill:   { height: 6, borderRadius: 3 },
  thumb:  { position: 'absolute', top: -5, width: 16, height: 16, borderRadius: 8, elevation: 4, borderWidth: 2, borderColor: '#fff' },
});

// Player hooks
function useLayerPlayers(layers: Layer[]) {
  const s  = (i: number) => ALL_SOUNDS.find(s => s.id === layers[i]?.id);
  const p0 = useAudioPlayer(s(0)?.file ?? require('@/assets/audio/white.mp3'));
  const p1 = useAudioPlayer(s(1)?.file ?? require('@/assets/audio/pink.mp3'));
  const p2 = useAudioPlayer(s(2)?.file ?? require('@/assets/audio/brown.mp3'));
  return [p0, p1, p2];
}

export default function MixerScreen() {
  const router = useRouter();
  const [layers, setLayers] = useState<Layer[]>([
    { id: 'rain',  volume: 60 },
    { id: 'brown', volume: 35 },
  ]);
  const [masterVol, setMasterVol] = useState(70);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const players = useLayerPlayers(layers);

  useEffect(() => {
    if (!isPlaying) return;
    layers.forEach((layer, i) => {
      const p = players[i];
      if (!p) return;
      p.volume = (layer.volume / 100) * (masterVol / 100);
      p.loop   = true;
      if (!p.playing) p.play();
    });
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
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Gradient Header ── */}
        <LinearGradient
          colors={['#003D31', '#C86B2A', V.bg]}
          locations={[0, 0.5, 1]}
          style={styles.heroGradient}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                <ChevronLeft size={22} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Sound Mixer</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Orb */}
            <View style={styles.orbArea}>
              <View style={styles.orbGlow}>
                <TinniOrb mode={isPlaying ? 'playing' : 'idle'} size={100} />
              </View>
              <Text style={styles.orbLabel}>
                {isPlaying ? `${layers.length} track đang hòa âm` : 'Chọn âm thanh → Phát'}
              </Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* ── Master volume ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.masterCard}>
            <View style={styles.masterRow}>
              <Volume2 size={16} color={V.secondary} />
              <Text style={styles.masterLabel}>Master Volume</Text>
              <Text style={styles.masterVal}>{masterVol}%</Text>
            </View>
            <VolumeSlider value={masterVol} color={V.secondary} onChange={updateMaster} />
          </View>
        </View>

        {/* ── Active layers ── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>LAYERS ({layers.length}/3)</Text>
          {layers.map((layer, idx) => {
            const sound = ALL_SOUNDS.find(s => s.id === layer.id)!;
            return (
              <View key={`${layer.id}-${idx}`} style={styles.layerCard}>
                <LinearGradient
                  colors={[...sound.gradient]}
                  style={styles.layerIconGradient}
                >
                  <Text style={{ fontSize: 20 }}>{sound.emoji}</Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <View style={styles.layerRow}>
                    <Text style={styles.layerName}>{sound.name}</Text>
                    <Text style={[styles.layerVol, { color: sound.color }]}>{layer.volume}%</Text>
                    <TouchableOpacity onPress={() => removeLayer(idx)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <View style={styles.removeBtn}>
                        <X size={12} color={V.textMuted} />
                      </View>
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
              <Plus size={18} color={V.secondary} />
              <Text style={styles.addBtnText}>Thêm âm thanh</Text>
            </TouchableOpacity>
          )}

          {/* Sound picker */}
          {showPicker && (
            <View style={styles.pickerGrid}>
              {ALL_SOUNDS.filter(s => !layers.some(l => l.id === s.id)).map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.pickerChip}
                  onPress={() => addLayer(s.id)}
                  activeOpacity={0.8}>
                  <LinearGradient
                    colors={[...s.gradient]}
                    style={styles.pickerGradient}
                  >
                    <Text style={{ fontSize: 16 }}>{s.emoji}</Text>
                    <Text style={styles.pickerLabel}>{s.name}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Play button ── */}
        <View style={styles.playSection}>
          <TouchableOpacity
            style={styles.playBtnWrap}
            onPress={togglePlay}
            activeOpacity={0.85}
          >
            {isPlaying ? (
              <View style={styles.stopBtn}>
                <Pause size={20} color={V.textMuted} />
                <Text style={styles.stopText}>Dừng</Text>
              </View>
            ) : (
              <LinearGradient
                colors={[V.primary, '#FFA726']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.playBtnGradient}
              >
                <Play size={20} color={V.primaryDark} />
                <Text style={styles.playText}>Phát hòa âm</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: V.bg },
  scroll: { paddingBottom: 40 },

  // ── Hero ──
  heroGradient: { paddingBottom: 24 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },

  orbArea: { alignItems: 'center', paddingVertical: 16 },
  orbGlow: {
    padding: 14, borderRadius: 100,
    backgroundColor: 'rgba(91,75,196,0.15)',
  },
  orbLabel: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 12 },

  // ── Sections ──
  sectionWrap: { paddingHorizontal: 20, marginTop: 16 },
  sectionLabel: {
    fontSize: 11, color: V.textMuted, fontWeight: '700',
    letterSpacing: 1.5, marginBottom: 12,
  },

  // ── Master ──
  masterCard: {
    backgroundColor: V.surface, borderRadius: 18, borderWidth: 1,
    borderColor: V.outlineVariant + '20', padding: 16,
  },
  masterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  masterLabel: { flex: 1, fontSize: 13, color: V.textSecondary, fontWeight: '600' },
  masterVal: { fontSize: 13, color: V.secondary, fontWeight: '700' },

  // ── Layers ──
  layerCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: V.surface, borderRadius: 18, borderWidth: 1,
    borderColor: V.outlineVariant + '20',
    padding: 14, marginBottom: 10,
  },
  layerIconGradient: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  layerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  layerName: { flex: 1, fontSize: 15, fontWeight: '700', color: V.textPrimary },
  layerVol: { fontSize: 12, fontWeight: '700' },
  removeBtn: {
    width: 24, height: 24, borderRadius: 8,
    backgroundColor: V.surfaceHigh,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Add ──
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: V.outlineVariant + '30', borderStyle: 'dashed',
    borderRadius: 16, paddingVertical: 14, marginBottom: 12,
  },
  addBtnText: { fontSize: 14, fontWeight: '600', color: V.secondary },

  // ── Picker ──
  pickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  pickerChip: {
    borderRadius: 14, overflow: 'hidden',
  },
  pickerGradient: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14,
  },
  pickerLabel: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // ── Play ──
  playSection: { paddingHorizontal: 20, marginTop: 20 },
  playBtnWrap: {
    borderRadius: 100, overflow: 'hidden',
    shadowColor: V.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
  },
  playBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 18, borderRadius: 100,
  },
  playText: { fontSize: 16, fontWeight: '700', color: V.primaryDark },
  stopBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 18, backgroundColor: V.surfaceHigh, borderRadius: 100,
    borderWidth: 1, borderColor: V.outlineVariant + '30',
  },
  stopText: { fontSize: 16, fontWeight: '700', color: V.textMuted },
});
