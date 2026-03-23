import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, FlatList,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Send, Mic } from 'lucide-react-native';
import { TinniOrb } from '@/components/TinniOrb';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://tinnimate.vuinghe.com';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_CHIPS = [
  '🎧 Phát nhạc trị liệu',
  '👂 Test thính lực',
  '🧘 Bài tập hít thở',
  '📋 Đánh giá mức ù tai',
  '🌙 Chế độ ngủ',
  '💊 Ù tai hôm nay thế nào?',
];

function OrbAvatar({ isTyping }: { isTyping: boolean }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isTyping) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.1, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1.0, duration: 600, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      Animated.timing(pulse, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [isTyping]);

  return (
    <Animated.View style={{ transform: [{ scale: pulse }] }}>
      <TinniOrb mode={isTyping ? 'chat' : 'idle'} size={32} />
    </Animated.View>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
      {!isUser && (
        <View style={styles.orbBubble}>
          <TinniOrb mode="chat" size={28} />
        </View>
      )}
      <View style={[
        styles.bubble,
        isUser ? styles.bubbleUser : styles.bubbleAssistant,
      ]}>
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
          {msg.content}
        </Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Xin chào! Tôi là Tinni 💙\nHôm nay bạn cảm thấy thế nào? Tôi có thể:\n1. 🎧 Bật âm thanh trị liệu\n2. 👂 Kiểm tra thính lực\n3. 📋 Đánh giá mức độ ù tai\n\nBạn muốn bắt đầu với gì?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatRef = useRef<FlatList>(null);

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
    };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput('');
    setIsLoading(true);

    // Placeholder
    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages,
          lang: 'vi',
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'text') {
              fullText = data.content;
              setMessages(prev =>
                prev.map(m => m.id === assistantId ? { ...m, content: fullText } : m)
              );
            }
          } catch { /* skip */ }
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: '⚠️ Không kết nối được. Kiểm tra mạng và thử lại!' }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <OrbAvatar isTyping={isLoading} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>Tinni</Text>
          <Text style={styles.headerStatus}>
            {isLoading ? '💬 đang nhập...' : '🟢 trực tuyến 24/7'}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={m => m.id}
        renderItem={({ item }) => <MessageBubble msg={item} />}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
      />

      {/* Quick chips */}
      {messages.length < 3 && (
        <View style={styles.chipsScroll}>
          {QUICK_CHIPS.map(chip => (
            <TouchableOpacity
              key={chip}
              style={styles.chip}
              onPress={() => sendMessage(chip)}
              activeOpacity={0.7}>
              <Text style={styles.chipText}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Input bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Nhắn gì đó cho Tinni..."
            placeholderTextColor="#334155"
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(input)}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            activeOpacity={0.8}>
            <Send size={18} color={input.trim() ? '#0F172A' : '#334155'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#0F172A',
  },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '700', color: '#E0E7FF' },
  headerStatus: { fontSize: 11, color: '#475569', marginTop: 1 },

  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    flexGrow: 1,
  },

  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    maxWidth: '85%',
  },
  bubbleRowUser: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  orbBubble: { width: 28, height: 28, marginBottom: 2 },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '90%',
  },
  bubbleAssistant: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: '#4F46E5',
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
  },
  bubbleTextUser: { color: '#fff' },

  chipsScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  chipText: { fontSize: 12, color: '#64748B' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#0F172A',
  },
  input: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#E0E7FF',
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#C7D2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#1E293B' },
});
