import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking } from 'react-native';
import { ToolCall } from '@/types/chat';
import { InlineSoundPlayer } from './InlineSoundPlayer';
import { InlineQuiz } from './InlineQuiz';

interface Props {
  toolCall: ToolCall;
  onResult?: (toolName: string, result: Record<string, unknown>) => void;
}

export function ChatToolRenderer({ toolCall, onResult }: Props) {
  const { name, args } = toolCall;

  switch (name) {
    case 'play_sound_therapy': {
      const soundType = (args.sound_type as string) ?? 'white_noise';
      const duration = (args.duration_minutes as number) ?? 15;
      return (
        <InlineSoundPlayer
          soundType={soundType as any}
          durationMinutes={duration}
          onResult={(data) => onResult?.(name, data)}
        />
      );
    }

    case 'start_quiz': {
      const quizType = (args.quiz_type as string) ?? 'THI';
      return (
        <InlineQuiz
          quizType={quizType as any}
          onResult={(data) => onResult?.(name, data)}
        />
      );
    }

    case 'start_hearing_test':
      return (
        <View style={[styles.card, styles.cardOrange]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🎧</Text>
            <Text style={styles.cardTitle}>Kiểm tra thính lực</Text>
          </View>
          <Text style={styles.cardDesc}>
            Test ngưỡng nghe tại 6 tần số (250Hz - 8kHz)
          </Text>
          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => {
              // TODO: Navigate to hearing test screen
              onResult?.(name, { action: 'clicked' });
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.cardButtonText}>Bắt đầu test →</Text>
          </TouchableOpacity>
        </View>
      );

    case 'daily_checkin':
      return (
        <View style={[styles.card, styles.cardPurple]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>📝</Text>
            <Text style={styles.cardTitle}>Check-in hàng ngày</Text>
          </View>
          <Text style={styles.cardDesc}>
            Ghi lại tâm trạng và triệu chứng của bạn hôm nay
          </Text>
          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => {
              onResult?.(name, { mood: 'neutral', symptoms: [] });
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.cardButtonText}>Ghi nhận →</Text>
          </TouchableOpacity>
        </View>
      );

    case 'show_progress': {
      const period = (args.period as string) ?? 'week';
      const periodLabels: Record<string, string> = {
        week: 'tuần',
        month: 'tháng',
        all: 'tất cả',
      };
      return (
        <View style={[styles.card, styles.cardTeal]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>📊</Text>
            <Text style={styles.cardTitle}>
              Tiến triển ({periodLabels[period] ?? period})
            </Text>
          </View>
          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => {
              // TODO: Navigate to progress screen
              onResult?.(name, { period, action: 'viewed' });
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.cardButtonText}>Xem dashboard →</Text>
          </TouchableOpacity>
        </View>
      );
    }

    case 'run_diagnosis':
      return (
        <View style={[styles.card, styles.cardRose]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🔍</Text>
            <Text style={styles.cardTitle}>Chẩn đoán ù tai</Text>
          </View>
          <Text style={styles.cardDesc}>
            Đang thu thập thông tin triệu chứng...
          </Text>
        </View>
      );

    case 'play_relaxation': {
      const exerciseType = (args.exercise_type as string) ?? 'breathing';
      const exerciseNames: Record<string, string> = {
        breathing: 'Hít thở sâu',
        progressive_relaxation: 'Thư giãn cơ',
        meditation: 'Thiền định',
      };
      return (
        <View style={[styles.card, styles.cardIndigo]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🧘</Text>
            <Text style={styles.cardTitle}>
              {exerciseNames[exerciseType] ?? 'Thư giãn'}
            </Text>
          </View>
          <Text style={styles.cardDesc}>Bài tập thư giãn 5 phút</Text>
          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => {
              onResult?.(name, { exercise_type: exerciseType, action: 'started' });
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.cardButtonText}>Bắt đầu →</Text>
          </TouchableOpacity>
        </View>
      );
    }

    default:
      return (
        <View style={styles.cardDefault}>
          <Text style={styles.cardDefaultText}>🔧 {name}</Text>
        </View>
      );
  }
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
  },
  cardGreen: {
    backgroundColor: '#141E18',
    borderColor: '#10B981',
  },
  cardOrange: {
    backgroundColor: '#141E18',
    borderColor: '#F59E0B',
  },
  cardPurple: {
    backgroundColor: '#141E18',
    borderColor: '#8B5CF6',
  },
  cardTeal: {
    backgroundColor: '#141E18',
    borderColor: '#14B8A6',
  },
  cardRose: {
    backgroundColor: '#141E18',
    borderColor: '#F43F5E',
  },
  cardIndigo: {
    backgroundColor: '#141E18',
    borderColor: '#C86B2A',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardIcon: {
    fontSize: 20,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E8F0EB',
  },
  cardDesc: {
    fontSize: 11,
    color: '#3D5445',
    marginBottom: 10,
  },
  cardButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cardButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#BDD0C3',
  },
  cardDefault: {
    backgroundColor: '#1F2E25',
    borderWidth: 1,
    borderColor: '#3D5445',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
  },
  cardDefaultText: {
    fontSize: 11,
    color: '#3D5445',
  },
});
