import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, FlatList,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Send, LayoutGrid, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { TinniOrb } from '@/components/TinniOrb';
import { ChatMessage } from '@/types/chat';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { SuggestionsFAB } from '@/components/chat/SuggestionsFAB';
import { SuggestionsBottomSheet } from '@/components/chat/SuggestionsBottomSheet';
import { useUserStore } from '@/store/use-user-store';
import { useLangStore } from '@/store/use-lang-store';
import { V } from '@/constants/theme';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://tinnimate.vuinghe.com';

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
      <TinniOrb mode={isTyping ? 'chat' : 'idle'} size={36} />
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
          ? 'Xin chào! Tôi là Tinni 💜\nHôm nay bạn cảm thấy thế nào? Tôi có thể:\n1. 🎧 Bật âm thanh trị liệu\n2. 👂 Kiểm tra thính lực\n3. 📋 Đánh giá mức độ ù tai\n\nBạn muốn bắt đầu với gì?'
          : 'Hello! I am Tinni 💜\nHow are you feeling today? I can help you with:\n1. 🎧 Sound therapy\n2. 👂 Hearing test\n3. 📋 Tinnitus assessment\n\nWhat would you like to start with?',
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

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          if (line.startsWith('data: ')) {
            const data = line.substring(6);

            if (data === '[DONE]') {
              continue;
            }

            try {
              const parsed = JSON.parse(data);

              if (!parsed || Object.keys(parsed).length === 0) continue;

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
  };

  useEffect(() => {
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

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

  useEffect(() => {
    return () => {
      if (xhrRef.current) {
        xhrRef.current.abort();
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* ── Gradient Header ── */}
      <LinearGradient
        colors={['#3D2B85', '#5B4BC4', V.bg]}
        locations={[0, 0.5, 1]}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']} style={styles.safeHeader}>
          <View style={styles.header}>
            <OrbAvatar isTyping={isLoading} />
            <View style={styles.headerInfo}>
              <View style={styles.headerNameRow}>
                <Text style={styles.headerName}>Tinni</Text>
                <View style={styles.aiBadge}>
                  <Sparkles size={8} color={V.primary} />
                  <Text style={styles.aiBadgeText}>AI</Text>
                </View>
              </View>
              <Text style={styles.headerStatus}>
                {isLoading
                  ? lang === 'vi' ? '💬 đang suy nghĩ...' : '💬 thinking...'
                  : lang === 'vi' ? '🟢 sẵn sàng' : '🟢 ready'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)')}
              style={styles.homeBtn}
              activeOpacity={0.7}
            >
              <LayoutGrid size={18} color={V.secondary} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ── Messages ── */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(m) => m.id}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            onSendMessage={sendMessage}
            onToolResult={handleToolResult}
          />
        )}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      />

      {/* ── Input Bar ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={[styles.inputContainer, { paddingBottom: insets.bottom || (Platform.OS === 'ios' ? 34 : 12) }]}
      >
        <View style={styles.inputBar}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={
                lang === 'vi'
                  ? 'Hỏi Tinni bất cứ điều gì...'
                  : 'Ask Tinni anything...'
              }
              placeholderTextColor={V.textDim}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={() => sendMessage(input)}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!input.trim() || isLoading) && styles.sendBtnDisabled,
            ]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            activeOpacity={0.8}
          >
            {input.trim() ? (
              <LinearGradient
                colors={[V.primary, '#FFA726']}
                style={styles.sendBtnGradient}
              >
                <Send size={16} color={V.primaryDark} />
              </LinearGradient>
            ) : (
              <Send size={16} color={V.textDim} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <SuggestionsFAB
        onPress={() => setShowSuggestions(true)}
        visible={true}
      />

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
  container: { flex: 1, backgroundColor: V.bg },

  // ── Gradient Header ──
  headerGradient: {
    paddingBottom: 8,
  },
  safeHeader: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerInfo: { flex: 1 },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerName: { fontSize: 18, fontWeight: '700', color: '#fff' },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(251,188,0,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  aiBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: V.primary,
    letterSpacing: 0.5,
  },
  headerStatus: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  homeBtn: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Messages ──
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    flexGrow: 1,
  },

  // ── Input ──
  inputContainer: {
    backgroundColor: V.bg,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: V.surface,
    backgroundColor: V.bg,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: V.surface,
    borderWidth: 1,
    borderColor: V.outlineVariant + '30',
    borderRadius: 24,
    overflow: 'hidden',
  },
  input: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    color: V.textPrimary,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: V.surface,
  },
  sendBtnGradient: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: V.surface },
});
