import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { CheckCircle2, Circle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { QuizType } from '@/types/chat';

interface Props {
  quizType: QuizType;
  onResult?: (result: Record<string, unknown>) => void;
}

const QUIZ_DATA: Record<QuizType, { name: string; emoji: string; questions: string[] }> = {
  THI: {
    name: 'Tinnitus Handicap Inventory',
    emoji: '🔊',
    questions: [
      'Ù tai làm bạn khó tập trung?',
      'Ù tai làm bạn khó nghe rõ?',
      'Ù tai làm bạn tức giận?',
      'Ù tai làm bạn bối rối?',
      'Ù tai làm bạn tuyệt vọng?',
    ],
  },
  PHQ9: {
    name: 'PHQ-9 Depression',
    emoji: '😔',
    questions: [
      'Ít thích thú với mọi việc?',
      'Buồn chán, chán nản?',
      'Khó ngủ hoặc ngủ quá nhiều?',
      'Mệt mỏi, thiếu năng lượng?',
      'Ăn kém hoặc ăn quá nhiều?',
    ],
  },
  GAD7: {
    name: 'GAD-7 Anxiety',
    emoji: '😰',
    questions: [
      'Cảm thấy lo lắng, bồn chồn?',
      'Không kiểm soát được sự lo lắng?',
      'Lo lắng quá nhiều về nhiều thứ?',
      'Khó thư giãn?',
      'Bồn chồn đến mức khó ngồi yên?',
    ],
  },
  ISI: {
    name: 'Insomnia Severity',
    emoji: '🌙',
    questions: [
      'Khó đi vào giấc ngủ?',
      'Duy trì giấc ngủ khó khăn?',
      'Thức dậy quá sớm?',
      'Không hài lòng với giấc ngủ?',
      'Giấc ngủ ảnh hưởng đến cuộc sống?',
    ],
  },
  PSS: {
    name: 'Perceived Stress',
    emoji: '😓',
    questions: [
      'Bạn có bị stress không?',
      'Cảm thấy không kiểm soát được?',
      'Lo lắng về những việc phải làm?',
      'Cảm thấy căng thẳng?',
      'Khó xử lý các vấn đề?',
    ],
  },
};

export function InlineQuiz({ quizType, onResult }: Props) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const quiz = QUIZ_DATA[quizType];

  // Safety check - if quiz type not found, show error
  if (!quiz) {
    return (
      <View style={styles.card}>
        <Text style={styles.errorText}>
          ⚠️ Quiz type "{quizType}" not found
        </Text>
      </View>
    );
  }

  const handleAnswer = (questionIdx: number, score: number) => {
    Haptics.selectionAsync();
    setAnswers((prev) => ({ ...prev, [questionIdx]: score }));
  };

  const handleSubmit = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const totalScore = Object.values(answers).reduce((sum, val) => sum + val, 0);
    const maxScore = quiz.questions.length * 4;

    setSubmitted(true);

    onResult?.({
      quiz_type: quizType,
      score: totalScore,
      max_score: maxScore,
      answers,
      timestamp: new Date().toISOString(),
    });
  };

  const getSeverity = () => {
    const totalScore = Object.values(answers).reduce((sum, val) => sum + val, 0);
    const percentage = (totalScore / (quiz.questions.length * 4)) * 100;

    if (percentage < 25) return { text: 'Nhẹ', color: '#10B981' };
    if (percentage < 50) return { text: 'Trung bình', color: '#F59E0B' };
    if (percentage < 75) return { text: 'Nặng', color: '#F97316' };
    return { text: 'Rất nặng', color: '#EF4444' };
  };

  const allAnswered = quiz.questions.every((_, idx) => answers[idx] !== undefined);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>{quiz.emoji}</Text>
        <View style={styles.info}>
          <Text style={styles.title}>{quiz.name}</Text>
          <Text style={styles.subtitle}>
            {Object.keys(answers).length}/{quiz.questions.length} câu hỏi
          </Text>
        </View>
      </View>

      {!submitted ? (
        <>
          <ScrollView style={styles.questions} showsVerticalScrollIndicator={false}>
            {quiz.questions.map((question, idx) => {
              const selected = answers[idx];
              return (
                <View key={idx} style={styles.question}>
                  <Text style={styles.questionText}>
                    {idx + 1}. {question}
                  </Text>
                  <View style={styles.options}>
                    {[
                      { label: 'Không', value: 0 },
                      { label: 'Ít', value: 1 },
                      { label: 'Vừa', value: 2 },
                      { label: 'Nhiều', value: 3 },
                      { label: 'Rất nhiều', value: 4 },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[
                          styles.option,
                          selected === opt.value && styles.optionSelected,
                        ]}
                        onPress={() => handleAnswer(idx, opt.value)}
                        activeOpacity={0.7}
                      >
                        {selected === opt.value ? (
                          <CheckCircle2 size={16} color="#4F46E5" />
                        ) : (
                          <Circle size={16} color="#475569" />
                        )}
                        <Text
                          style={[
                            styles.optionText,
                            selected === opt.value && styles.optionTextSelected,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={[styles.submitBtn, !allAnswered && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!allAnswered}
            activeOpacity={0.8}
          >
            <Text style={styles.submitBtnText}>
              {allAnswered ? '✓ Hoàn thành' : 'Trả lời tất cả câu hỏi'}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.result}>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreValue}>
              {Object.values(answers).reduce((sum, val) => sum + val, 0)}/
              {quiz.questions.length * 4}
            </Text>
          </View>
          <View
            style={[
              styles.severityBadge,
              { backgroundColor: getSeverity().color + '20', borderColor: getSeverity().color },
            ]}
          >
            <Text style={[styles.severityText, { color: getSeverity().color }]}>
              {getSeverity().text}
            </Text>
          </View>
          <Text style={styles.resultText}>Cảm ơn bạn đã hoàn thành bài đánh giá!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#6366F1',
    borderRadius: 16,
    padding: 12,
    marginTop: 8,
    maxHeight: 400,
  },
  card: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#F59E0B',
    textAlign: 'center',
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
    color: '#E0E7FF',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  questions: {
    maxHeight: 240,
  },
  question: {
    marginBottom: 16,
  },
  questionText: {
    fontSize: 13,
    color: '#CBD5E1',
    marginBottom: 8,
    lineHeight: 18,
  },
  options: {
    gap: 6,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  optionSelected: {
    backgroundColor: '#4F46E520',
    borderColor: '#4F46E5',
  },
  optionText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  optionTextSelected: {
    color: '#C7D2FE',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtnDisabled: {
    backgroundColor: '#334155',
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  result: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  scoreBadge: {
    marginBottom: 12,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#E0E7FF',
  },
  severityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  severityText: {
    fontSize: 13,
    fontWeight: '700',
  },
  resultText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});
