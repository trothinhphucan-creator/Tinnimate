import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  Dimensions, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { ChevronLeft, Play, Square, Volume2, Crown, Sparkles, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { TinniOrb } from '@/components/TinniOrb';
import { FractalToneEngine, ZEN_STYLES } from '@/lib/audio/fractal-engine';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Trial limits per tier — Ultra-only feature
const TRIAL_LIMITS: Record<string, number> = {
  free: 0,
  premium: 0,
  pro: 0,
  ultra: Infinity,
};

const STORAGE_KEY = 'zentones_trials';

export default function ZentonesScreen() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [trialCount, setTrialCount] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const router = useRouter();
  const engineRef = useRef<FractalToneEngine | null>(null);

  // TODO: Get from user store
  const tier: 'free' | 'premium' | 'pro' | 'ultra' = 'free'; // Replace with actual user tier
  const maxTrials = TRIAL_LIMITS[tier] ?? 1;
  const trialsRemaining = maxTrials === Infinity ? Infinity : Math.max(0, maxTrials - trialCount);
  const canPlay = trialsRemaining > 0 || maxTrials === Infinity;

  const selected = ZEN_STYLES[selectedIdx];

  // Load trial count
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      setTrialCount(parseInt(val ?? '0', 10));
    });
  }, []);

  // Get engine
  const getEngine = () => {
    if (!engineRef.current) engineRef.current = new FractalToneEngine();
    return engineRef.current;
  };

  // Play/stop
  const handlePlay = async () => {
    const engine = getEngine();
    if (isPlaying) {
      await engine.stop();
      setIsPlaying(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      if (!canPlay) {
        setShowUpgrade(true);
        return;
      }
      // Increment trial count
      const newCount = trialCount + 1;
      setTrialCount(newCount);
      await AsyncStorage.setItem(STORAGE_KEY, String(newCount));

      await engine.start(selected, volume);
      setIsPlaying(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  // Style change
  const handleStyleChange = async (idx: number) => {
    setSelectedIdx(idx);
    if (isPlaying) {
      const engine = getEngine();
      await engine.stop();
      await engine.start(ZEN_STYLES[idx], volume);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Volume change
  const handleVolumeChange = (val: number) => {
    setVolume(val);
    engineRef.current?.setVolume(val);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      engineRef.current?.stop();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Upgrade Modal */}
      <Modal visible={showUpgrade} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowUpgrade(false)}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.modalIcon}>
              <Crown size={28} color="#fff" />
            </View>

            <Text style={styles.modalTitle}>Nâng cấp Zentones Ultra</Text>
            <Text style={styles.modalDesc}>
              Zentones là tính năng độc quyền gói Ultra. Nâng cấp để mở khóa không giới hạn.
            </Text>

            <View style={styles.tierList}>
              {([
                { tier: 'Free', trials: 'Không có quyền', tierKey: 'free' as const },
                { tier: 'Premium', trials: 'Không có quyền', tierKey: 'premium' as const },
                { tier: 'Pro', trials: 'Không có quyền', tierKey: 'pro' as const },
                { tier: 'Ultra', trials: 'Không giới hạn ♾️', tierKey: 'ultra' as const },
              ] as const).map(t => {
                const isActive = tier === t.tierKey;
                return (
                  <View
                    key={t.tier}
                    style={[styles.tierRow, isActive && styles.tierRowActive]}>
                    <Text style={styles.tierName}>{isActive && '→ '}{t.tier}</Text>
                    <Text style={styles.tierTrials}>{t.trials}</Text>
                  </View>
                );
              })}
            </View>

            <TouchableOpacity style={styles.upgradeBtn} onPress={() => router.push('/pricing' as any)}>
              <Text style={styles.upgradeBtnText}>✨ Xem bảng giá</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#94A3B8" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>🎵 Zentones</Text>
          <Text style={styles.titleSub}>Giai điệu fractal trị liệu</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Trial counter */}
        {maxTrials !== Infinity && (
          <View style={[styles.trialBanner, trialsRemaining === 0 && styles.trialBannerEmpty]}>
            <Sparkles size={14} color={trialsRemaining > 0 ? '#F59E0B' : '#EF4444'} />
            <Text style={styles.trialText}>
              {trialsRemaining > 0
                ? `Còn ${trialsRemaining} lần dùng thử`
                : 'Hết lượt thử — nâng cấp để dùng không giới hạn'}
            </Text>
          </View>
        )}

        {/* Orb + Now Playing */}
        <View
          style={[
            styles.nowPlaying,
            { borderColor: selected.color + '40', backgroundColor: selected.color + '10' },
          ]}>
          <TinniOrb mode={isPlaying ? 'playing' : 'idle'} size={120} />
          <Text style={styles.npEmoji}>{selected.emoji}</Text>
          <Text style={styles.npName}>{selected.nameVi}</Text>
          <Text style={styles.npDesc}>{selected.descriptionVi}</Text>

          <TouchableOpacity
            style={[
              styles.playBtn,
              !canPlay && styles.playBtnDisabled,
              isPlaying && { backgroundColor: selected.color },
            ]}
            onPress={handlePlay}>
            {isPlaying ? (
              <Square size={20} color="#fff" fill="#fff" />
            ) : (
              <Play size={22} color={canPlay ? '#fff' : '#64748B'} fill={canPlay ? '#fff' : 'transparent'} />
            )}
          </TouchableOpacity>

          {isPlaying && (
            <Text style={styles.npStatus}>♪ Đang tạo giai điệu...</Text>
          )}
        </View>

        {/* Style selector */}
        <Text style={styles.sectionTitle}>🎨 Chọn Phong Cách ({ZEN_STYLES.length})</Text>
        <View style={styles.styleGrid}>
          {ZEN_STYLES.map((style, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.styleCard,
                selectedIdx === idx && {
                  borderColor: style.color + '80',
                  backgroundColor: style.color + '20',
                },
              ]}
              onPress={() => handleStyleChange(idx)}>
              <Text style={styles.styleEmoji}>{style.emoji}</Text>
              <Text style={styles.styleName} numberOfLines={1}>
                {style.nameVi.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Volume */}
        <View style={styles.volumeCard}>
          <Volume2 size={18} color="#94A3B8" />
          <Slider
            style={styles.volumeSlider}
            minimumValue={0}
            maximumValue={1}
            value={volume}
            onValueChange={handleVolumeChange}
            minimumTrackTintColor="#3B82F6"
            maximumTrackTintColor="#1E293B"
            thumbTintColor="#3B82F6"
          />
          <Text style={styles.volumeText}>{Math.round(volume * 100)}%</Text>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Zentones hoạt động thế nào</Text>
          {[
            { icon: '🎶', text: 'Thuật toán fractal tạo giai điệu như chuông gió — mỗi lần phát đều khác nhau' },
            { icon: '🧠', text: 'Não bạn lắng nghe thụ động, dần hình thành thói quen không chú ý đến tiếng ù' },
            { icon: '✨', text: 'Sau 4-8 tuần sử dụng đều, cường độ cảm nhận ù tai giảm rõ rệt' },
          ].map((item, i) => (
            <View key={i} style={styles.infoRow}>
              <Text style={styles.infoIcon}>{item.icon}</Text>
              <Text style={styles.infoText}>{item.text}</Text>
            </View>
          ))}

          <View style={styles.badgeRow}>
            {[
              { emoji: '🔬', label: 'Có nghiên cứu' },
              { emoji: '♾️', label: 'Không lặp lại' },
              { emoji: '🎵', label: '10 phong cách' },
            ].map(badge => (
              <View key={badge.emoji} style={styles.badge}>
                <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                <Text style={styles.badgeLabel}>{badge.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#fff' },
  titleSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  scroll: { padding: 16, paddingBottom: 40 },

  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F59E0B15',
    borderWidth: 1,
    borderColor: '#F59E0B30',
    marginBottom: 16,
  },
  trialBannerEmpty: { backgroundColor: '#EF444415', borderColor: '#EF444430' },
  trialText: { fontSize: 12, color: '#F59E0B', flex: 1 },

  nowPlaying: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 24,
  },
  npEmoji: { fontSize: 32, marginTop: 16, marginBottom: 8 },
  npName: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 },
  npDesc: { fontSize: 11, color: '#94A3B8', textAlign: 'center', marginBottom: 20 },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  playBtnDisabled: { backgroundColor: '#334155' },
  npStatus: { fontSize: 10, color: '#64748B', marginTop: 12 },

  sectionTitle: { fontSize: 11, fontWeight: '600', color: '#64748B', marginBottom: 12, textTransform: 'uppercase' },
  styleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  styleCard: {
    width: (width - 48) / 5,
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  styleEmoji: { fontSize: 20, marginBottom: 4 },
  styleName: { fontSize: 8, color: '#94A3B8', textAlign: 'center' },

  volumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
  },
  volumeSlider: { flex: 1, height: 40 },
  volumeText: { fontSize: 11, color: '#64748B', width: 32, textAlign: 'right' },

  infoCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  infoTitle: { fontSize: 12, fontWeight: '600', color: '#E2E8F0', marginBottom: 12 },
  infoRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  infoIcon: { fontSize: 12 },
  infoText: { fontSize: 11, color: '#64748B', flex: 1, lineHeight: 16 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  badge: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    alignItems: 'center',
  },
  badgeEmoji: { fontSize: 16, marginBottom: 4 },
  badgeLabel: { fontSize: 8, color: '#64748B', textAlign: 'center' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 8 },
  modalDesc: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginBottom: 20 },
  tierList: { gap: 8, marginBottom: 20 },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    backgroundColor: '#0F172A',
  },
  tierRowActive: { borderColor: '#F59E0B50', backgroundColor: '#F59E0B15' },
  tierName: { fontSize: 13, fontWeight: '600', color: '#E2E8F0' },
  tierTrials: { fontSize: 12, color: '#64748B' },
  upgradeBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
  },
  upgradeBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
