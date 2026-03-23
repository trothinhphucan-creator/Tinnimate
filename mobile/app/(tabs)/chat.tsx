import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, FlatList,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Send, LayoutGrid } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { TinniOrb } from '@/components/TinniOrb';
import { ChatMessage } from '@/types/chat';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { SuggestionsFAB } from '@/components/chat/SuggestionsFAB';
import { SuggestionsBottomSheet } from '@/components/chat/SuggestionsBottomSheet';
import { useUserStore } from '@/store/use-user-store';
import { useLangStore } from '@/store/use-lang-store';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://tinnimate.vuinghe.com';

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

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useUserStore();
  const { lang } = useLangStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content:
        lang === 'vi'
          ? 'Xin chào! Tôi là Tinni 💙\nHôm nay bạn cảm thấy thế nào? Tôi có thể:\n1. 🎧 Bật âm thanh trị liệu\n2. 👂 Kiểm tra thính lực\n3. 📋 Đánh giá mức độ ù tai\n\nBạn muốn bắt đầu với gì?'
          : 'Hello! I am Tinni 💙\nHow are you feeling today? I can help you with:\n1. 🎧 Sound therapy\n2. 👂 Hearing test\n3. 📋 Tinnitus assessment\n\nWhat would you like to start with?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ text: string; category: string }>>([]);
  const flatRef = useRef<FlatList>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput('');
    setIsLoading(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', timestamp: new Date() },
    ]);

    let fullText = '';
    let toolCall: any = null;

    try {
      // Cancel any previous request
      if (xhrRef.current) {
        xhrRef.current.abort();
      }

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      xhr.open('POST', `${API_BASE}/api/chat`);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Accept', 'text/event-stream');
      if (user?.id) {
        xhr.setRequestHeader('X-User-ID', user.id);
      }

      let lastIndex = 0;
      let buffer = '';

      xhr.onprogress = () => {
        const newText = xhr.responseText.substring(lastIndex);
        lastIndex = xhr.responseText.length;
        buffer += newText;

        // Parse SSE events
        const lines = buffer.split('\n');
        // Keep the last incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          if (line.startsWith('data: ')) {
            const data = line.substring(6); // Remove "data: " prefix

            if (data === '[DONE]') {
              continue;
            }

            try {
              const parsed = JSON.parse(data);

              // Skip empty objects
              if (!parsed || Object.keys(parsed).length === 0) continue;

              // Capture conversationId from server
              if (parsed.conversationId && !conversationId) {
                setConversationId(parsed.conversationId);
              }

              if (parsed.type === 'text') {
                fullText += parsed.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: fullText, toolCall }
                      : m
                  )
                );
              } else if (parsed.type === 'tool_call') {
                toolCall = { name: parsed.name, args: parsed.args ?? {} };
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: fullText, toolCall }
                      : m
                  )
                );
              }
            } catch (err) {
              console.log('Skipping malformed SSE data:', data);
            }
          }
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setIsLoading(false);
          xhrRef.current = null;
        } else {
          throw new Error(`HTTP ${xhr.status}`);
        }
      };

      xhr.onerror = () => {
        throw new Error('Network request failed');
      };

      xhr.onabort = () => {
        console.log('Request aborted');
        setIsLoading(false);
      };

      xhr.send(JSON.stringify({
        messages: allMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        conversationId: conversationId ?? undefined,
        lang,
      }));

    } catch (e) {
      console.error('Chat error:', e);
      const errorMsg = e instanceof Error ? e.message : String(e);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content:
                  lang === 'vi'
                    ? `⚠️ Không kết nối được. Kiểm tra mạng và thử lại!\n\nLỗi: ${errorMsg}`
                    : `⚠️ Connection failed. Please check your network!\n\nError: ${errorMsg}`,
              }
            : m
        )
      );
      setIsLoading(false);
      xhrRef.current = null;
    }
  }

  const handleToolResult = (toolName: string, result: Record<string, unknown>) => {
    console.log('Tool result:', toolName, result);
    // You can send tool results back to chat if needed
    // sendMessage(`Tool ${toolName} completed: ${JSON.stringify(result)}`);
  };

  useEffect(() => {
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  // Fetch suggestions on mount
  useEffect(() => {
    fetchSuggestions();
  }, [user?.id, lang, messages.length]);

  async function fetchSuggestions() {
    try {
      const url = new URL(`${API_BASE}/api/chat/suggestions`);
      url.searchParams.set('lang', lang);
      url.searchParams.set('messageCount', String(messages.length));

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (user?.id) {
        headers['X-User-ID'] = user.id;
      }

      const response = await fetch(url.toString(), { headers });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (xhrRef.current) {
        xhrRef.current.abort();
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <View style={styles.header}>
          <OrbAvatar isTyping={isLoading} />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>Tinni</Text>
            <Text style={styles.headerStatus}>
              {isLoading
                ? lang === 'vi' ? '💬 đang nhập...' : '💬 typing...'
                : lang === 'vi' ? '🟢 trực tuyến 24/7' : '🟢 online 24/7'}
            </Text>
          </View>
          {/* Home button — navigate back to main menu */}
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            style={styles.homeBtn}
            activeOpacity={0.7}
          >
            <LayoutGrid size={22} color="#6366F1" />
          </TouchableOpacity>
        </View>

      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            onSendMessage={sendMessage}
            onToolResult={handleToolResult}
          />
        )}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
      />
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={[styles.inputContainer, { paddingBottom: insets.bottom || (Platform.OS === 'ios' ? 34 : 12) }]}
      >
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={
              lang === 'vi'
                ? 'Nhắn gì đó cho Tinni...'
                : 'Message Tinni...'
            }
            placeholderTextColor="#334155"
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(input)}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!input.trim() || isLoading) && styles.sendBtnDisabled,
            ]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            activeOpacity={0.8}
          >
            <Send
              size={18}
              color={input.trim() ? '#0F172A' : '#334155'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Floating Action Button */}
      <SuggestionsFAB
        onPress={() => setShowSuggestions(true)}
        visible={true}
      />

      {/* Bottom Sheet */}
      <SuggestionsBottomSheet
        visible={showSuggestions}
        onClose={() => setShowSuggestions(false)}
        suggestions={suggestions}
        onSuggestionPress={sendMessage}
        lang={lang}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  safeTop: { flex: 1 },

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
  homeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1E293B',
    alignItems: 'center', justifyContent: 'center',
  },

  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    flexGrow: 1,
  },

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

  inputContainer: {
    backgroundColor: '#020617',
    // paddingBottom set dynamically via insets.bottom in component
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#0F172A',
    backgroundColor: '#020617',
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
