import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  Dimensions, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Volume2, VolumeX, PlayCircle, StopCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useLangStore } from '@/store/use-lang-store';

const { width } = Dimensions.get('window');

interface FrequencyTest {
  freq: number;
  label: string;
  threshold: number | null;
  tested: boolean;
}

const FREQUENCIES = [250, 500, 1000, 2000, 4000, 8000];

export default function HearingTestScreen() {
  const router = useRouter();
  const { lang } = useLangStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFreqIdx, setCurrentFreqIdx] = useState(0);
  const [volume, setVolume] = useState(0.3);
  const [hasStarted, setHasStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [frequencies, setFrequencies] = useState<FrequencyTest[]>(
    FREQUENCIES.map((f) => ({
      freq: f,
      label: `${f} Hz`,
      threshold: null,
      tested: false,
    }))
  );

  const soundRef = useRef<Audio.Sound | null>(null);
  const audioContextRef = useRef<any>(null);
  const oscillatorRef = useRef<any>(null);
  const gainNodeRef = useRef<any>(null);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
    });

    return () => {
      stopTone();
    };
  }, []);

  const playTone = async (frequency: number, vol: number) => {
    try {
      stopTone();

      // Use Web Audio API approach (works in Expo)
      // @ts-ignore
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        Alert.alert(
          lang === 'vi' ? 'Lỗi' : 'Error',
          lang === 'vi'
            ? 'Thiết bị không hỗ trợ audio'
            : 'Audio not supported on this device'
        );
        return;
      }

      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

      gainNode.gain.setValueAtTime(vol, audioContext.currentTime);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();

      audioContextRef.current = audioContext;
      oscillatorRef.current = oscillator;
      gainNodeRef.current = gainNode;

      setIsPlaying(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error playing tone:', error);
      Alert.alert(
        lang === 'vi' ? 'Lỗi' : 'Error',
        lang === 'vi'
          ? 'Không thể phát âm thanh'
          : 'Cannot play sound'
      );
    }
  };

  const stopTone = () => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
      } catch (e) {
        // Oscillator may already be stopped
      }
      oscillatorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    gainNodeRef.current = null;
    setIsPlaying(false);
  };

  const handleStart = () => {
    setHasStarted(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handlePlayTest = () => {
    if (isPlaying) {
      stopTone();
    } else {
      const freq = frequencies[currentFreqIdx].freq;
      playTone(freq, volume);
    }
  };

  const handleCanHear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    stopTone();

    const updatedFreqs = [...frequencies];
    updatedFreqs[currentFreqIdx].threshold = volume;
    updatedFreqs[currentFreqIdx].tested = true;
    setFrequencies(updatedFreqs);

    // Move to next frequency
    if (currentFreqIdx < frequencies.length - 1) {
      setCurrentFreqIdx(currentFreqIdx + 1);
      setVolume(0.3);
    } else {
      setIsComplete(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleCannotHear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    stopTone();

    if (volume < 0.9) {
      setVolume(Math.min(volume + 0.1, 1));
    } else {
      // Max volume reached, mark as unable to hear
      const updatedFreqs = [...frequencies];
      updatedFreqs[currentFreqIdx].threshold = null;
      updatedFreqs[currentFreqIdx].tested = true;
      setFrequencies(updatedFreqs);

      if (currentFreqIdx < frequencies.length - 1) {
        setCurrentFreqIdx(currentFreqIdx + 1);
        setVolume(0.3);
      } else {
        setIsComplete(true);
      }
    }
  };

  const handleRestart = () => {
    setFrequencies(
      FREQUENCIES.map((f) => ({
        freq: f,
        label: `${f} Hz`,
        threshold: null,
        tested: false,
      }))
    );
    setCurrentFreqIdx(0);
    setVolume(0.3);
    setHasStarted(false);
    setIsComplete(false);
    stopTone();
    Haptics.selectionAsync();
  };

  const getVolumePercent = () => Math.round(volume * 100);

  const getResultText = (threshold: number | null) => {
    if (threshold === null) {
      return lang === 'vi' ? 'Không nghe thấy' : 'Cannot hear';
    }
    if (threshold <= 0.3) {
      return lang === 'vi' ? 'Tốt' : 'Good';
    }
    if (threshold <= 0.6) {
      return lang === 'vi' ? 'Trung bình' : 'Fair';
    }
    return lang === 'vi' ? 'Kém' : 'Poor';
  };

  const getResultColor = (threshold: number | null) => {
    if (threshold === null) return '#EF4444';
    if (threshold <= 0.3) return '#10B981';
    if (threshold <= 0.6) return '#F59E0B';
    return '#EF4444';
  };

  if (!hasStarted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color="#E0E7FF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {lang === 'vi' ? 'Kiểm tra thính lực' : 'Hearing Test'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>
            {lang === 'vi' ? '🎧 Kiểm tra thính lực' : '🎧 Hearing Test'}
          </Text>
          <Text style={styles.introDesc}>
            {lang === 'vi'
              ? 'Đo ngưỡng nghe của bạn tại 6 tần số khác nhau (250Hz - 8kHz). Kết quả giúp hiểu rõ hơn về tình trạng thính lực.'
              : 'Test your hearing threshold at 6 frequencies (250Hz - 8kHz). Results help understand your hearing condition.'
            }
          </Text>

          <View style={styles.instructions}>
            <Text style={styles.instructionTitle}>
              {lang === 'vi' ? 'Hướng dẫn:' : 'Instructions:'}
            </Text>
            <Text style={styles.instructionText}>
              {lang === 'vi'
                ? '1. Đeo tai nghe\n2. Tìm nơi yên tĩnh\n3. Nhấn Play để nghe âm thanh\n4. Nhấn "Nghe thấy" nếu bạn nghe được\n5. Nhấn "Không nghe" nếu không nghe thấy'
                : '1. Wear headphones\n2. Find a quiet place\n3. Press Play to hear the tone\n4. Press "Can Hear" if you hear it\n5. Press "Cannot Hear" if you don\'t'
              }
            </Text>
          </View>

          <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.8}>
            <PlayCircle size={20} color="#FFFFFF" />
            <Text style={styles.startBtnText}>
              {lang === 'vi' ? 'Bắt đầu kiểm tra' : 'Start Test'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color="#E0E7FF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {lang === 'vi' ? 'Kết quả' : 'Results'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.resultsContainer} contentContainerStyle={styles.resultsContent}>
          <Text style={styles.resultsTitle}>
            {lang === 'vi' ? '📊 Kết quả kiểm tra' : '📊 Test Results'}
          </Text>

          <View style={styles.resultsGrid}>
            {frequencies.map((freq, idx) => (
              <View key={idx} style={styles.resultCard}>
                <Text style={styles.resultFreq}>{freq.label}</Text>
                <Text
                  style={[
                    styles.resultStatus,
                    { color: getResultColor(freq.threshold) },
                  ]}
                >
                  {getResultText(freq.threshold)}
                </Text>
                {freq.threshold !== null && (
                  <Text style={styles.resultVolume}>
                    {Math.round(freq.threshold * 100)}% {lang === 'vi' ? 'âm lượng' : 'volume'}
                  </Text>
                )}
              </View>
            ))}
          </View>

          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              {lang === 'vi'
                ? '⚠️ Kết quả chỉ mang tính tham khảo. Vui lòng tham khảo bác sĩ chuyên khoa Tai Mũi Họng để được đánh giá chính xác.'
                : '⚠️ Results are for reference only. Please consult an ENT specialist for accurate evaluation.'
              }
            </Text>
          </View>

          <TouchableOpacity style={styles.restartBtn} onPress={handleRestart} activeOpacity={0.8}>
            <Text style={styles.restartBtnText}>
              {lang === 'vi' ? '🔄 Làm lại' : '🔄 Restart'}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const currentFreq = frequencies[currentFreqIdx];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#E0E7FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {lang === 'vi' ? 'Kiểm tra thính lực' : 'Hearing Test'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.testContainer}>
        {/* Progress */}
        <View style={styles.progress}>
          <Text style={styles.progressText}>
            {currentFreqIdx + 1} / {frequencies.length}
          </Text>
          <View style={styles.progressBar}>
            {frequencies.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.progressDot,
                  idx <= currentFreqIdx && styles.progressDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Frequency Display */}
        <View style={styles.freqDisplay}>
          <Text style={styles.freqLabel}>
            {lang === 'vi' ? 'Tần số' : 'Frequency'}
          </Text>
          <Text style={styles.freqValue}>{currentFreq.label}</Text>
        </View>

        {/* Volume Display */}
        <View style={styles.volumeDisplay}>
          <Text style={styles.volumeLabel}>
            {lang === 'vi' ? 'Âm lượng' : 'Volume'}
          </Text>
          <Text style={styles.volumeValue}>{getVolumePercent()}%</Text>
          <View style={styles.volumeBar}>
            <View
              style={[
                styles.volumeFill,
                { width: `${getVolumePercent()}%` },
              ]}
            />
          </View>
        </View>

        {/* Play Button */}
        <TouchableOpacity
          style={[styles.playButton, isPlaying && styles.playButtonActive]}
          onPress={handlePlayTest}
          activeOpacity={0.8}
        >
          {isPlaying ? (
            <StopCircle size={48} color="#FFFFFF" fill="#FFFFFF" />
          ) : (
            <PlayCircle size={48} color="#FFFFFF" fill="#FFFFFF" />
          )}
        </TouchableOpacity>

        {/* Response Buttons */}
        <View style={styles.responseButtons}>
          <TouchableOpacity
            style={[styles.responseBtn, styles.responseBtnNo]}
            onPress={handleCannotHear}
            activeOpacity={0.8}
          >
            <VolumeX size={20} color="#FFFFFF" />
            <Text style={styles.responseBtnText}>
              {lang === 'vi' ? 'Không nghe' : 'Cannot Hear'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.responseBtn, styles.responseBtnYes]}
            onPress={handleCanHear}
            activeOpacity={0.8}
          >
            <Volume2 size={20} color="#FFFFFF" />
            <Text style={styles.responseBtnText}>
              {lang === 'vi' ? 'Nghe thấy' : 'Can Hear'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E0E7FF',
    letterSpacing: 0.2,
  },

  // Intro Screen
  introContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  introTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#E0E7FF',
    textAlign: 'center',
    marginBottom: 16,
  },
  introDesc: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  instructions: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E0E7FF',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 22,
  },
  startBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Test Screen
  testContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  progress: {
    marginBottom: 40,
  },
  progressText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#334155',
  },
  progressDotActive: {
    backgroundColor: '#4F46E5',
  },

  freqDisplay: {
    alignItems: 'center',
    marginBottom: 32,
  },
  freqLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
  },
  freqValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#E0E7FF',
  },

  volumeDisplay: {
    alignItems: 'center',
    marginBottom: 32,
  },
  volumeLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
  },
  volumeValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#818CF8',
    marginBottom: 12,
  },
  volumeBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#1E293B',
    borderRadius: 4,
    overflow: 'hidden',
  },
  volumeFill: {
    height: '100%',
    backgroundColor: '#818CF8',
  },

  playButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 32,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  playButtonActive: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },

  responseButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  responseBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  responseBtnNo: {
    backgroundColor: '#64748B',
  },
  responseBtnYes: {
    backgroundColor: '#10B981',
  },
  responseBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Results Screen
  resultsContainer: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: 24,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#E0E7FF',
    textAlign: 'center',
    marginBottom: 24,
  },
  resultsGrid: {
    gap: 12,
    marginBottom: 24,
  },
  resultCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultFreq: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E0E7FF',
  },
  resultStatus: {
    fontSize: 15,
    fontWeight: '600',
  },
  resultVolume: {
    fontSize: 13,
    color: '#94A3B8',
  },

  disclaimer: {
    backgroundColor: '#7C2D12',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  disclaimerText: {
    fontSize: 13,
    color: '#FED7AA',
    lineHeight: 20,
    textAlign: 'center',
  },

  restartBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  restartBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
