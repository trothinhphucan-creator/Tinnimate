'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { SquarePen, Sparkles, LogIn } from 'lucide-react'
import Link from 'next/link'
import { useChatStore } from '@/stores/use-chat-store'
import { useLangStore } from '@/stores/use-lang-store'
import { useUserStore } from '@/stores/use-user-store'
import { t } from '@/lib/i18n'
import { ChatMessage, ToolCall } from '@/types'
import { ChatMessageBubble } from '@/components/chat-message-bubble'
import { ChatInputArea } from '@/components/chat-input-area'

const GUEST_MAX = 2

/* ── Tool Card Config ── */
const TOOL_STYLES = {
  hearing_test:  { emoji: '🎧', color: 'from-blue-600/20 to-blue-800/10 border-blue-500/20 hover:border-blue-400/40', iconBg: 'bg-blue-500/20' },
  sound_therapy: { emoji: '🎵', color: 'from-emerald-600/20 to-emerald-800/10 border-emerald-500/20 hover:border-emerald-400/40', iconBg: 'bg-emerald-500/20' },
  quiz:          { emoji: '📋', color: 'from-purple-600/20 to-purple-800/10 border-purple-500/20 hover:border-purple-400/40', iconBg: 'bg-purple-500/20' },
  relaxation:    { emoji: '🧘', color: 'from-teal-600/20 to-teal-800/10 border-teal-500/20 hover:border-teal-400/40', iconBg: 'bg-teal-500/20' },
  diagnosis:     { emoji: '🔍', color: 'from-rose-600/20 to-rose-800/10 border-rose-500/20 hover:border-rose-400/40', iconBg: 'bg-rose-500/20' },
  checkin:       { emoji: '📝', color: 'from-amber-600/20 to-amber-800/10 border-amber-500/20 hover:border-amber-400/40', iconBg: 'bg-amber-500/20' },
} as const

function EmptyState({ onSelectTool }: { onSelectTool: (trigger: string) => void }) {
  const { lang } = useLangStore()
  const d = t(lang)
  const toolKeys = Object.keys(TOOL_STYLES) as (keyof typeof TOOL_STYLES)[]

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-6 text-center max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center text-3xl shadow-lg shadow-blue-500/10">
        💙
      </div>
      <div className="space-y-2">
        <h2 className="font-bold text-xl text-slate-100">{d.chat.greeting}</h2>
        <p className="text-sm text-slate-300 leading-relaxed max-w-sm mx-auto" dangerouslySetInnerHTML={{ __html: d.chat.intro }} />
        <p className="text-xs text-slate-500">{d.chat.pickTool}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 w-full">
        {toolKeys.map((key) => {
          const style = TOOL_STYLES[key]
          const text = d.tools[key]
          return (
            <button
              key={key}
              onClick={() => onSelectTool(text.trigger)}
              className={`group flex flex-col items-start gap-1.5 p-3 rounded-xl border bg-gradient-to-br text-left transition-all duration-200 ${style.color} hover:scale-[1.02] active:scale-[0.98]`}
            >
              <div className={`w-8 h-8 rounded-lg ${style.iconBg} flex items-center justify-center text-base`}>
                {style.emoji}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">{text.label}</p>
                <p className="text-[10px] text-slate-500 group-hover:text-slate-400 transition-colors">{text.desc}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* New user question suggestions */}
      <div className="w-full space-y-1.5">
        <p className="text-[9px] text-slate-600 text-center">{lang === 'vi' ? '💡 Hoặc hỏi Tinni:' : '💡 Or ask Tinni:'}</p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {'newUserQuestions' in d && Array.isArray(d.newUserQuestions) && d.newUserQuestions.map((q: string) => (
            <button
              key={q}
              onClick={() => onSelectTool(q)}
              className="px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/15 text-[10px] text-slate-400 hover:text-white transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-slate-600 mt-1">{d.chat.orChat}</p>

      {/* Medical disclaimer */}
      <p className="text-[8px] text-slate-700 text-center max-w-xs mt-2 leading-relaxed">
        ⚕️ {'disclaimer' in d && typeof d.disclaimer === 'string' ? d.disclaimer : ''}
      </p>
    </div>
  )
}

export default function ChatPage() {
  const { messages, isLoading, addMessage, updateLastMessage, appendToolCall, setLoading, conversationId, setConversationId, clearMessages } =
    useChatStore()
  const { user } = useUserStore()
  const [userLoaded, setUserLoaded] = useState(false)
  const isGuest = userLoaded && !user
  const [input, setInput] = useState('')
  const [guestCount, setGuestCount] = useState(0)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Wait for user store to hydrate before showing guest UI
  useEffect(() => {
    const timer = setTimeout(() => setUserLoaded(true), 500)
    return () => clearTimeout(timer)
  }, [])

  // If user becomes available, mark as loaded immediately
  useEffect(() => {
    if (user) setUserLoaded(true)
  }, [user])

  // Restore guest count from localStorage
  useEffect(() => {
    if (isGuest) {
      const saved = parseInt(localStorage.getItem('tinni_guest_count') ?? '0')
      setGuestCount(saved)
      if (saved >= GUEST_MAX) setShowSignupModal(true)
    } else {
      setShowSignupModal(false)
    }
  }, [isGuest])

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const { lang } = useLangStore()
  const d = t(lang)

  const sendMessage = useCallback(async (content: string) => {
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
      // Guest mode: check limit before sending
      if (isGuest && guestCount >= GUEST_MAX) {
        setShowSignupModal(true)
        return
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (isGuest) headers['X-Guest-Count'] = String(guestCount)

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: [...messages, userMsg],
          conversationId: isGuest ? undefined : conversationId,
          lang,
        }),
      })

      if (!response.ok || !response.body) {
        try {
          const errData = await response.json()
          if (errData?.error === 'guest_limit') {
            setShowSignupModal(true)
            updateLastMessage('')
            return
          }
          const msg = errData?.error ?? `Lỗi ${response.status}`
          updateLastMessage(`⚠️ ${msg}`)
        } catch {
          updateLastMessage(`⚠️ Lỗi ${response.status}. Vui lòng thử lại.`)
        }
        return
      }

      // Update guest count after successful send
      if (isGuest) {
        const newCount = guestCount + 1
        setGuestCount(newCount)
        localStorage.setItem('tinni_guest_count', String(newCount))
        if (newCount >= GUEST_MAX) {
          setTimeout(() => setShowSignupModal(true), 3000)
        }
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
            // Capture conversationId from server
            if (data.conversationId && !conversationId) {
              setConversationId(data.conversationId)
            }
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
  }, [addMessage, setLoading, updateLastMessage, appendToolCall, isGuest, guestCount, messages, conversationId, lang])

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
  }, [addMessage, sendMessage])

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Guest banner */}
      {isGuest && !showSignupModal && (
        <div className="bg-gradient-to-r from-blue-600/20 to-violet-600/20 border-b border-blue-500/20 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-blue-300">
            <Sparkles size={12} />
            {lang === 'vi'
              ? `Bạn đang dùng thử! Còn ${Math.max(0, GUEST_MAX - guestCount)} tin nhắn miễn phí`
              : `You're trying Tinni! ${Math.max(0, GUEST_MAX - guestCount)} free messages left`}
          </div>
          <Link href="/signup" className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 transition-colors">
            {lang === 'vi' ? 'Đăng ký miễn phí →' : 'Sign up free →'}
          </Link>
        </div>
      )}

      {/* Signup modal after guest limit */}
      {showSignupModal && (
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/30 flex items-center justify-center text-3xl mx-auto mb-4">
              💙
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {lang === 'vi' ? 'Bạn thích Tinni chứ? 😊' : 'Enjoying Tinni? 😊'}
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              {lang === 'vi'
                ? 'Đăng ký miễn phí để tiếp tục chat, lưu lịch sử và trải nghiệm tất cả tính năng!'
                : 'Sign up free to continue chatting, save history, and unlock all features!'}
            </p>
            <Link href="/signup" className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-blue-500/25">
              <LogIn size={16} /> {lang === 'vi' ? 'Đăng ký miễn phí' : 'Sign Up Free'}
            </Link>
            <Link href="/login" className="block mt-3 text-xs text-slate-500 hover:text-slate-300 transition-colors">
              {lang === 'vi' ? 'Đã có tài khoản? Đăng nhập' : 'Already have an account? Log in'}
            </Link>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">Tinni 💙</span>
          {isLoading && (
            <span className="text-xs text-slate-500 animate-pulse">{d.common.loading}</span>
          )}
        </div>
        <button
          onClick={clearMessages}
          title={d.chat.newChat}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
        >
          <SquarePen size={13} />
          {d.chat.newChat}
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
