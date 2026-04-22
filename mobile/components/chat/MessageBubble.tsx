import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { TinniOrb } from '@/components/TinniOrb';
import { ChatMessage } from '@/types/chat';
import { ChatToolRenderer } from './ChatToolRenderer';

interface Props {
  message: ChatMessage;
  onSendMessage?: (content: string) => void;
  onToolResult?: (toolName: string, result: Record<string, unknown>) => void;
}

/**
 * Parse assistant text to split into body text + clickable option buttons.
 * Detects patterns like:
 *   1. 🎧 Kiểm tra thính lực
 *   2. 🎵 Nghe âm thanh trị liệu
 * Also handles: "- 🎧 ...", "• 🎧 ..."
 */
function parseOptions(content: string): { body: string; options: string[] } {
  if (!content) return { body: '', options: [] };

  const lines = content.split('\n');
  const bodyLines: string[] = [];
  const options: string[] = [];
  // Match: "1. text", "2. text", "- text", "• text"  (with optional emoji)
  const optionPattern = /^\s*(?:\d+[\.\)]\s*|[-•]\s+)(.+)$/;

  // Find where options start — look for consecutive option-like lines
  let optionStartIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (optionPattern.test(lines[i])) {
      optionStartIdx = i;
    } else if (optionStartIdx !== -1) {
      break; // Found the start of consecutive options block
    }
  }

  if (optionStartIdx === -1 || optionStartIdx === 0) {
    // No options block found, or entire message is options (unlikely)
    return { body: content, options: [] };
  }

  for (let i = 0; i < lines.length; i++) {
    if (i >= optionStartIdx) {
      const match = lines[i].match(optionPattern);
      if (match) {
        options.push(match[1].trim());
      } else if (lines[i].trim()) {
        // Non-empty line after options (like "Bạn muốn chọn cái nào?")
        // Skip — it's a trailing prompt we don't need as a button
      }
    } else {
      bodyLines.push(lines[i]);
    }
  }

  // Clean up trailing empty lines from body
  while (bodyLines.length > 0 && !bodyLines[bodyLines.length - 1].trim()) {
    bodyLines.pop();
  }

  return {
    body: bodyLines.join('\n'),
    options: options.length >= 2 ? options : [], // Only show buttons if 2+ options
  };
}

export function MessageBubble({ message, onSendMessage, onToolResult }: Props) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <View style={[styles.bubbleRow, styles.bubbleRowUser]}>
        <View style={[styles.bubble, styles.bubbleUser]}>
          <Text style={[styles.bubbleText, styles.bubbleTextUser]}>
            {message.content}
          </Text>
        </View>
      </View>
    );
  }

  // Parse options from assistant text
  const { body, options } = parseOptions(message.content);

  return (
    <View style={styles.bubbleRow}>
      <View style={styles.orbBubble}>
        <TinniOrb mode="chat" size={28} />
      </View>

      <View style={styles.bubbleContainer}>
        {/* Text body */}
        <View style={[styles.bubble, styles.bubbleAssistant]}>
          <Text style={styles.bubbleText}>
            {body || message.content || (
              <View style={styles.typing}>
                <Text style={styles.typingDot}>.</Text>
                <Text style={[styles.typingDot, styles.typingDot2]}>.</Text>
                <Text style={[styles.typingDot, styles.typingDot3]}>.</Text>
              </View>
            )}
          </Text>
        </View>

        {/* Clickable option buttons */}
        {options.length > 0 && onSendMessage && (
          <View style={styles.optionsContainer}>
            {options.map((opt, i) => (
              <TouchableOpacity
                key={i}
                style={styles.optionButton}
                onPress={() => {
                  Haptics.selectionAsync();
                  onSendMessage(opt);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Tool call widget */}
        {message.toolCall && (
          <ChatToolRenderer
            toolCall={message.toolCall}
            onResult={onToolResult}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  orbBubble: {
    width: 28,
    height: 28,
    marginBottom: 2,
  },
  bubbleContainer: {
    flex: 1,
    gap: 8,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleAssistant: {
    backgroundColor: '#141E18',
    borderWidth: 1,
    borderColor: '#1F2E25',
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: '#7A3B1E',
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    color: '#BDD0C3',
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: '#fff',
  },
  typing: {
    flexDirection: 'row',
    gap: 2,
  },
  typingDot: {
    fontSize: 14,
    color: '#7A9686',
  },
  typingDot2: {
    opacity: 0.7,
  },
  typingDot3: {
    opacity: 0.4,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3D5445',
    backgroundColor: '#141E18',
  },
  optionText: {
    fontSize: 11,
    color: '#7A9686',
    fontWeight: '500',
  },
});
