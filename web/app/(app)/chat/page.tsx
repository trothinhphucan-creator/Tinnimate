'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { SquarePen } from 'lucide-react'
import { useChatStore } from '@/stores/use-chat-store'
import { ChatMessage, ToolCall } from '@/types'
import { ChatMessageBubble } from '@/components/chat-message-bubble'
import { ChatInputArea } from '@/components/chat-input-area'

/* ── Tool Menu cho Welcome Screen ── */
const TOOL_CARDS = [
  {
    id: 'hearing_test',
    emoji: '🎧',
    label: 'Kiểm tra thính lực',
    desc: 'Đo ngưỡng nghe 6 tần số',
    trigger: 'Tôi muốn kiểm tra thính lực',
    color: 'from-blue-600/20 to-blue-800/10 border-blue-500/20 hover:border-blue-400/40',
    iconBg: 'bg-blue-500/20',
  },
  {
    id: 'sound_therapy',
    emoji: '🎵',
    label: 'Âm thanh trị liệu',
    desc: 'White noise, tiếng mưa, thiên nhiên',
    trigger: 'Tôi muốn nghe âm thanh trị liệu',
    color: 'from-emerald-600/20 to-emerald-800/10 border-emerald-500/20 hover:border-emerald-400/40',
    iconBg: 'bg-emerald-500/20',
  },
  {
    id: 'quiz',
    emoji: '📋',
    label: 'Trắc nghiệm đánh giá',
    desc: 'THI, PHQ-9, GAD-7',
    trigger: 'Tôi muốn làm trắc nghiệm đánh giá',
    color: 'from-purple-600/20 to-purple-800/10 border-purple-500/20 hover:border-purple-400/40',
    iconBg: 'bg-purple-500/20',
  },
  {
    id: 'relaxation',
    emoji: '🧘',
    label: 'Bài tập thư giãn',
    desc: 'Hít thở, thiền, thư giãn cơ',
    trigger: 'Hướng dẫn tôi bài tập thư giãn',
    color: 'from-teal-600/20 to-teal-800/10 border-teal-500/20 hover:border-teal-400/40',
    iconBg: 'bg-teal-500/20',
  },
  {
    id: 'diagnosis',
    emoji: '🔍',
    label: 'Chẩn đoán ù tai',
    desc: 'Phân tích triệu chứng của bạn',
    trigger: 'Tôi muốn được chẩn đoán tình trạng ù tai',
    color: 'from-rose-600/20 to-rose-800/10 border-rose-500/20 hover:border-rose-400/40',
    iconBg: 'bg-rose-500/20',
  },
  {
    id: 'checkin',
    emoji: '📝',
    label: 'Check-in hôm nay',
    desc: 'Ghi nhận tâm trạng & triệu chứng',
    trigger: 'Tôi muốn check-in hôm nay',
    color: 'from-amber-600/20 to-amber-800/10 border-amber-500/20 hover:border-amber-400/40',
    iconBg: 'bg-amber-500/20',
  },
]

function EmptyState({ onSelectTool }: { onSelectTool: (trigger: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-6 text-center max-w-lg mx-auto">
      {/* Tinni Avatar + Intro */}
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center text-3xl shadow-lg shadow-blue-500/10">
        💙
      </div>
      <div className="space-y-2">
        <h2 className="font-bold text-xl text-slate-100">
          Xin chào! Tôi là Tinni 💙
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
          Tôi là trợ lý AI được thiết kế riêng để <strong className="text-blue-400">đồng hành cùng bạn quản lý tiếng ù tai</strong>. 
          Dù bạn mới phát hiện hay đã sống chung với ù tai lâu năm — tôi luôn ở đây.
        </p>
        <p className="text-xs text-slate-500">
          ✨ Bạn không đơn độc. Hãy chọn một công cụ để bắt đầu:
        </p>
      </div>

      {/* Tool Cards Grid */}
      <div className="grid grid-cols-2 gap-2 w-full">
        {TOOL_CARDS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onSelectTool(tool.trigger)}
            className={`group flex flex-col items-start gap-1.5 p-3 rounded-xl border bg-gradient-to-br text-left transition-all duration-200 ${tool.color} hover:scale-[1.02] active:scale-[0.98]`}
          >
            <div className={`w-8 h-8 rounded-lg ${tool.iconBg} flex items-center justify-center text-base`}>
              {tool.emoji}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
                {tool.label}
              </p>
              <p className="text-[10px] text-slate-500 group-hover:text-slate-400 transition-colors">
                {tool.desc}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Or just chat */}
      <p className="text-[10px] text-slate-600 mt-1">
        Hoặc bạn cũng có thể nhắn tin trực tiếp với Tinni bên dưới 👇
      </p>
    </div>
  )
}

export default function ChatPage() {
  const { messages, isLoading, addMessage, updateLastMessage, appendToolCall, setLoading, conversationId, clearMessages } =
    useChatStore()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Callback when a tool widget reports its result (e.g. quiz score, hearing test)
  const handleToolResult = useCallback((toolName: string, result: Record<string, unknown>) => {
    const resultMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: `[Kết quả ${toolName}]: ${JSON.stringify(result)}`,
      timestamp: new Date(),
    }
    addMessage(resultMsg)
    sendMessage(`Tôi vừa hoàn thành ${toolName}. Kết quả: ${JSON.stringify(result)}`)
  }, [addMessage])

  const sendMessage = async (content: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    }
    addMessage(userMsg)
    setLoading(true)

    // Placeholder assistant message for streaming
    const assistantId = (Date.now() + 1).toString()
    addMessage({ id: assistantId, role: 'assistant', content: '', timestamp: new Date() })

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          conversationId,
        }),
      })

      if (!response.ok || !response.body) {
        try {
          const errData = await response.json()
          const msg = errData?.error ?? `Lỗi ${response.status}`
          updateLastMessage(`⚠️ ${msg}`)
        } catch {
          updateLastMessage(`⚠️ Lỗi ${response.status}. Vui lòng thử lại.`)
        }
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value)
        const lines = text.split('\n').filter((l) => l.startsWith('data: '))
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6))
            if (data.type === 'text') updateLastMessage(data.content)
            if (data.type === 'tool_call') {
              const toolCall: ToolCall = { name: data.name, args: data.args ?? {} }
              appendToolCall(toolCall)
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } catch {
      updateLastMessage('Không thể kết nối. Vui lòng kiểm tra mạng.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">Tinni 💙</span>
          {isLoading && (
            <span className="text-xs text-slate-500 animate-pulse">đang trả lời...</span>
          )}
        </div>
        <button
          onClick={clearMessages}
          title="Cuộc trò chuyện mới"
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
        >
          <SquarePen size={13} />
          Mới
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-4">
        {messages.length === 0 ? (
          <EmptyState onSelectTool={(trigger) => {
            setInput('')
            sendMessage(trigger)
          }} />
        ) : (
          messages.map((msg) => (
            <ChatMessageBubble key={msg.id} message={msg} onSendMessage={(content) => {
              setInput('')
              sendMessage(content)
            }} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInputArea
        value={input}
        onChange={setInput}
        onSend={(content) => {
          setInput('')
          sendMessage(content)
        }}
        disabled={isLoading}
        showQuickActions={messages.length > 0}
      />
    </div>
  )
}
