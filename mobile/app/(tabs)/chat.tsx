import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, FlatList,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Send, LayoutGrid, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ChatMessage } from '@/types/chat';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { SuggestionsFAB } from '@/components/chat/SuggestionsFAB';
import { SuggestionsBottomSheet } from '@/components/chat/SuggestionsBottomSheet';
import { useUserStore } from '@/store/use-user-store';
import { useLangStore } from '@/store/use-lang-store';
import { V } from '@/constants/theme';
import { LotusOrb, FloatingLeavesBackground } from '@/components/botanical';

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
      <LotusOrb size={36} progress={isTyping ? 0.6 : 0} animate={isTyping} />
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
    <View style={s.container}>
      <FloatingLeavesBackground count={3} />

      {/* Header */}
      <SafeAreaView edges={['top']} style={s.safeHeader}>
        <View style={s.header}>
          <OrbAvatar isTyping={isLoading} />
          <View style={s.headerInfo}>
            <View style={s.headerNameRow}>
              <Text style={s.headerName}>Tinni</Text>
              <View style={s.aiBadge}>
                <Sparkles size={8} color={V.sage} />
                <Text style={s.aiBadgeText}>AI</Text>
              </View>
            </View>
            <Text style={s.headerStatus}>
              {isLoading
                ? lang === 'vi' ? '💬 đang suy nghĩ...' : '💬 thinking...'
                : lang === 'vi' ? '🌿 sẵn sàng' : '🌿 ready'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            style={s.homeBtn}
            activeOpacity={0.7}
          >
            <LayoutGrid size={18} color={V.textSecondary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Messages */}
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
        contentContainerStyle={s.messageList}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      />

      {/* Input Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={[s.inputContainer, { paddingBottom: insets.bottom || (Platform.OS === 'ios' ? 34 : 12) }]}
      >
        <View style={s.inputBar}>
          <View style={s.inputWrapper}>
            <TextInput
              style={s.input}
              value={input}
              onChangeText={setInput}
              placeholder={lang === 'vi' ? 'Hỏi Tinni bất cứ điều gì...' : 'Ask Tinni anything...'}
              placeholderTextColor={V.textDim}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={() => sendMessage(input)}
            />
          </View>
          <TouchableOpacity
            style={[s.sendBtn, input.trim() && !isLoading ? s.sendBtnActive : s.sendBtnDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            activeOpacity={0.8}
          >
            <Send size={16} color={input.trim() && !isLoading ? V.bg : V.textDim} />
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

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: V.bg },

  safeHeader:     { backgroundColor: V.surfaceHigh, borderBottomWidth: 1, borderBottomColor: V.borderCard },
  header:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12 },
  headerInfo:     { flex: 1 },
  headerNameRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerName:     { fontSize: 18, fontWeight: '700', color: V.cream },
  aiBadge:        { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: `${V.sage}20`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: `${V.sage}40` },
  aiBadgeText:    { fontSize: 9, fontWeight: '800', color: V.sage, letterSpacing: 0.5 },
  headerStatus:   { fontSize: 11, color: V.textMuted, marginTop: 2 },
  homeBtn:        { width: 40, height: 40, borderRadius: 14, backgroundColor: V.surface, borderWidth: 1, borderColor: V.borderCard, alignItems: 'center', justifyContent: 'center' },

  messageList:    { paddingHorizontal: 16, paddingVertical: 12, gap: 12, flexGrow: 1 },

  inputContainer: { backgroundColor: V.bg },
  inputBar:       { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderTopWidth: 1, borderTopColor: V.borderCard, backgroundColor: V.bg },
  inputWrapper:   { flex: 1, backgroundColor: V.surface, borderWidth: 1, borderColor: V.borderCard, borderRadius: 24, overflow: 'hidden' },
  input:          { paddingHorizontal: 18, paddingVertical: 12, color: V.cream, fontSize: 14, maxHeight: 100 },
  sendBtn:        { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  sendBtnActive:  { backgroundColor: V.sage, shadowColor: V.sage, shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  sendBtnDisabled:{ backgroundColor: V.surface },
});
