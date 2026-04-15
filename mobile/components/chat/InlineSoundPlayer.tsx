import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Play, Pause, Volume2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { SoundType } from '@/types/chat';

interface Props {
  soundType: SoundType;
  durationMinutes?: number;
  onResult?: (result: Record<string, unknown>) => void;
}

const SOUND_MAP: Record<string, { name: string; emoji: string; file: any }> = {
  white_noise: { name: 'Ồn trắng', emoji: '⬜', file: require('@/assets/audio/white.mp3') },
  pink_noise: { name: 'Ồn hồng', emoji: '🌸', file: require('@/assets/audio/pink.mp3') },
  brown_noise: { name: 'Ồn nâu', emoji: '🟤', file: require('@/assets/audio/brown.mp3') },
  rain: { name: 'Mưa', emoji: '🌧️', file: require('@/assets/audio/rain.mp3') },
  ocean: { name: 'Sóng biển', emoji: '🌊', file: require('@/assets/audio/ocean.mp3') },
  forest: { name: 'Rừng đêm', emoji: '🌲', file: require('@/assets/audio/forest.mp3') },
  campfire: { name: 'Lửa trại', emoji: '🔥', file: require('@/assets/audio/campfire.mp3') },
  birds: { name: 'Chim hót', emoji: '🐦', file: require('@/assets/audio/birds.mp3') },
  zen_bells: { name: 'Zen Bells', emoji: '🔔', file: require('@/assets/audio/zen.mp3') },
  '528hz': { name: '528Hz', emoji: '✨', file: require('@/assets/audio/528hz.mp3') },
};

export function InlineSoundPlayer({ soundType, durationMinutes = 15, onResult }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const soundInfo = SOUND_MAP[soundType] || SOUND_MAP.white_noise;

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
    });

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setElapsed((e) => e + 1);
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isPlaying]);

  const togglePlay = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isPlaying) {
      await sound?.pauseAsync();
      setIsPlaying(false);
    } else {
      if (!sound) {
        const { sound: newSound } = await Audio.Sound.createAsync(
          soundInfo.file,
          { shouldPlay: true, isLooping: true, volume: 0.8 }
        );
        setSound(newSound);
        setIsPlaying(true);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }

      onResult?.({
        sound_type: soundType,
        action: 'started',
        timestamp: new Date().toISOString(),
      });
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>{soundInfo.emoji}</Text>
        <View style={styles.info}>
          <Text style={styles.title}>{soundInfo.name}</Text>
          <Text style={styles.subtitle}>
            {durationMinutes} phút • {isPlaying ? 'Đang phát' : 'Sẵn sàng'}
          </Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.playButton} onPress={togglePlay} activeOpacity={0.8}>
          {isPlaying ? (
            <Pause size={20} color="#FFFFFF" fill="#FFFFFF" />
          ) : (
            <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
          )}
        </TouchableOpacity>

        <View style={styles.timeInfo}>
          <Text style={styles.timeText}>{formatTime(elapsed)}</Text>
          {isPlaying && <Volume2 size={14} color="#10B981" />}
        </View>
      </View>

      {isPlaying && (
        <View style={styles.progress}>
          <View
            style={[
              styles.progressBar,
              { width: `${Math.min((elapsed / (durationMinutes * 60)) * 100, 100)}%` },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1D1928',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 16,
    padding: 12,
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  icon: {
    fontSize: 28,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E7DFF5',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    color: '#484551',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C9C4D3',
  },
  progress: {
    height: 4,
    backgroundColor: '#2C2837',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10B981',
  },
});
