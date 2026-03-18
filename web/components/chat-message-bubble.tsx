'use client'

import { ChatMessage } from '@/types'
import { ChatToolCallCard } from '@/components/chat-tool-call-card'
import { useChatStore } from '@/stores/use-chat-store'

interface ChatMessageBubbleProps {
  message: ChatMessage
  onSendMessage?: (content: string) => void
}

/**
 * Parse assistant text to split into body text + clickable option buttons.
 * Detects patterns like:
 *   1. 🎧 Kiểm tra thính lực
 *   2. 🎵 Nghe âm thanh trị liệu
 * Also handles: "- 🎧 ...", "• 🎧 ..."
 */
function parseOptions(content: string): { body: string; options: string[] } {
  if (!content) return { body: '', options: [] }

  const lines = content.split('\n')
  const bodyLines: string[] = []
  const options: string[] = []
  // Match: "1. text", "2. text", "- text", "• text"  (with optional emoji)
  const optionPattern = /^\s*(?:\d+[\.\)]\s*|[-•]\s+)(.+)$/

  // Find where options start — look for consecutive option-like lines
  let optionStartIdx = -1
  for (let i = lines.length - 1; i >= 0; i--) {
    if (optionPattern.test(lines[i])) {
      optionStartIdx = i
    } else if (optionStartIdx !== -1) {
      break // Found the start of consecutive options block
    }
  }

  if (optionStartIdx === -1 || optionStartIdx === 0) {
    // No options block found, or entire message is options (unlikely)
    return { body: content, options: [] }
  }

  for (let i = 0; i < lines.length; i++) {
    if (i >= optionStartIdx) {
      const match = lines[i].match(optionPattern)
      if (match) {
        options.push(match[1].trim())
      } else if (lines[i].trim()) {
        // Non-empty line after options (like "Bạn muốn chọn cái nào?")
        // Skip — it's a trailing prompt we don't need as a button
      }
    } else {
      bodyLines.push(lines[i])
    }
  }

  // Clean up trailing empty lines from body
  while (bodyLines.length > 0 && !bodyLines[bodyLines.length - 1].trim()) {
    bodyLines.pop()
  }

  return {
    body: bodyLines.join('\n'),
    options: options.length >= 2 ? options : [], // Only show buttons if 2+ options
  }
}

export function ChatMessageBubble({ message, onSendMessage }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="chat-bubble flex justify-end px-4">
        <div className="max-w-[75%] rounded-tl-2xl rounded-tr-sm rounded-bl-2xl rounded-br-2xl bg-blue-600 px-4 py-3 text-sm text-white">
          {message.content}
        </div>
      </div>
    )
  }

  // Parse options from assistant text
  const { body, options } = parseOptions(message.content)

  return (
    <div className="chat-bubble flex items-start gap-3 px-4">
      {/* Tinni avatar */}
      <div className="shrink-0 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-base leading-none">
        💙
      </div>

      <div className="flex flex-col gap-2 max-w-[75%]">
        {/* Text body */}
        <div className="rounded-tr-2xl rounded-tl-sm rounded-bl-2xl rounded-br-2xl bg-slate-800 px-4 py-3 text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">
          {body || message.content || (
            <span className="inline-flex gap-1 items-center text-slate-500">
              <span className="animate-bounce">.</span>
              <span className="animate-bounce [animation-delay:0.15s]">.</span>
              <span className="animate-bounce [animation-delay:0.3s]">.</span>
            </span>
          )}
        </div>

        {/* Clickable option buttons */}
        {options.length > 0 && onSendMessage && (
          <div className="flex flex-wrap gap-1.5">
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={() => onSendMessage(opt)}
                className="text-left px-3 py-2 rounded-xl border border-slate-700/60 bg-slate-800/80 text-xs text-slate-300 hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-300 active:scale-[0.97] transition-all cursor-pointer"
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Tool call widget */}
        {message.toolCall && (
          <ChatToolCallCard toolCall={message.toolCall} />
        )}
      </div>
    </div>
  )
}
