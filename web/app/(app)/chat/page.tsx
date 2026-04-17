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
  hearing_test:  { emoji: '🎧', color: 'from-[#024e41]/30 to-[#165042]/10 border-[#94d3c1]/20 hover:border-[#94d3c1]/40', iconBg: 'bg-[#94d3c1]/20' },
  sound_therapy: { emoji: '🎵', color: 'from-[#165042]/30 to-[#024e41]/10 border-[#9ad2c0]/20 hover:border-[#9ad2c0]/40', iconBg: 'bg-[#9ad2c0]/20' },
  quiz:          { emoji: '📋', color: 'from-[#603d00]/30 to-[#452b00]/10 border-[#ffb954]/20 hover:border-[#ffb954]/40', iconBg: 'bg-[#ffb954]/20' },
  relaxation:    { emoji: '🧘', color: 'from-[#024e41]/30 to-[#172121]/10 border-[#afefdd]/20 hover:border-[#afefdd]/40', iconBg: 'bg-[#afefdd]/20' },
  diagnosis:     { emoji: '🔍', color: 'from-[#93000a]/15 to-[#172121]/10 border-[#ffb4ab]/20 hover:border-[#ffb4ab]/40', iconBg: 'bg-[#ffb4ab]/20' },
  checkin:       { emoji: '📝', color: 'from-[#603d00]/20 to-[#172121]/10 border-[#ffddb4]/20 hover:border-[#ffddb4]/40', iconBg: 'bg-[#ffddb4]/20' },
} as const

function EmptyState({ onSelectTool }: { onSelectTool: (trigger: string) => void }) {
  const { lang } = useLangStore()
  const d = t(lang)
  const toolKeys = Object.keys(TOOL_STYLES) as (keyof typeof TOOL_STYLES)[]

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-6 text-center max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#024e41]/30 to-[#94d3c1]/20 border border-[#94d3c1]/30 flex items-center justify-center text-3xl shadow-lg shadow-[#94d3c1]/10">
        💙
      </div>
      <div className="space-y-2">
        <h2 className="font-bold text-xl text-[#dae5e4]">{d.chat.greeting}</h2>
        <p className="text-sm text-[#bfc8c8] leading-relaxed max-w-sm mx-auto" dangerouslySetInnerHTML={{ __html: d.chat.intro }} />
        <p className="text-xs text-[#899392]">{d.chat.pickTool}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 w-full">
        {toolKeys.map((key) => {
          const style = TOOL_STYLES[key]
          const text = d.tools[key]
          return (
            <button
              key={key}
              onClick={() => onSelectTool(text.trigger)}
              className={`group flex flex-col items-start gap-1.5 p-3 rounded-xl border bg-gradient-to-br text-left transition-all duration-300 ${style.color} hover:scale-[1.02] active:scale-[0.98]`}
            >
              <div className={`w-8 h-8 rounded-lg ${style.iconBg} flex items-center justify-center text-base`}>
                {style.emoji}
              </div>
              <div>
                <p className="text-xs font-semibold text-[#dae5e4] group-hover:text-white transition-colors">{text.label}</p>
                <p className="text-[10px] text-[#899392] group-hover:text-[#bfc8c8] transition-colors">{text.desc}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* New user question suggestions */}
      <div className="w-full space-y-1.5">
        <p className="text-[9px] text-[#899392] text-center">{lang === 'vi' ? '💡 Hoặc hỏi Tinni:' : '💡 Or ask Tinni:'}</p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {'newUserQuestions' in d && Array.isArray(d.newUserQuestions) && d.newUserQuestions.map((q: string) => (
            <button
              key={q}
              onClick={() => onSelectTool(q)}
              className="px-3 py-1.5 rounded-full border border-[#3f4848]/30 bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#94d3c1]/30 text-[10px] text-[#bfc8c8] hover:text-white transition-all duration-300"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-[#899392] mt-1">{d.chat.orChat}</p>

      {/* Medical disclaimer */}
      <p className="text-[8px] text-[#3f4848] text-center max-w-xs mt-2 leading-relaxed">
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

  // Wait for Zustand store to hydrate before showing guest/user UI
  // Using onRehydrateStorage or a simple store subscription avoids 500ms flicker
  useEffect(() => {
    // If user is already available (SSR hydrated), mark immediately
    if (user !== undefined) {
      setUserLoaded(true)
      return
    }
    // Otherwise wait briefly for client-side hydration
    const timer = setTimeout(() => setUserLoaded(true), 150)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // If user becomes available after mount, mark as loaded immediately
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
          if (response.status === 429) {
            updateLastMessage(lang === 'vi'
              ? '😅 Ôi, bạn đang chat nhanh quá! Tinni cần nghỉ một chút. Vui lòng đợi khoảng 1 phút rồi thử lại nhé 💙'
              : '😅 Oops, you\'re chatting too fast! Tinni needs a short break. Please wait about 1 minute and try again 💙')
          } else if (response.status === 503 || response.status === 502) {
            updateLastMessage(lang === 'vi'
              ? '🔧 Xin lỗi bạn, Tinni đang được bảo trì hoặc gặp sự cố kết nối tạm thời. Bạn vui lòng thử lại sau vài phút nhé!\n\n💡 Trong lúc đợi, bạn vẫn có thể sử dụng các tính năng khác như **Liệu pháp âm thanh**, **Kiểm tra thính lực** hoặc **Bài tập thở** mà không cần chat.\n\nNếu lỗi vẫn tiếp tục, hãy liên hệ quản trị viên để được hỗ trợ 🙏'
              : '🔧 Sorry, Tinni is currently under maintenance or experiencing a temporary connection issue. Please try again in a few minutes!\n\n💡 While waiting, you can still use features like **Sound Therapy**, **Hearing Test** or **Breathing Exercises** without chat.\n\nIf the error persists, please contact the admin for support 🙏')
          } else {
            updateLastMessage(lang === 'vi'
              ? `😔 Xin lỗi bạn, Tinni gặp trục trặc khi xử lý tin nhắn. Bạn thử gửi lại nhé!\n\n💡 Nếu lỗi tiếp tục, hãy thử:\n• Tải lại trang (F5)\n• Bắt đầu cuộc chat mới\n• Liên hệ quản trị viên nếu cần hỗ trợ\n\nTinni rất tiếc vì sự bất tiện này 🙏`
              : `😔 Sorry, Tinni encountered an issue processing your message. Please try resending!\n\n💡 If the error continues, try:\n• Refresh the page (F5)\n• Start a new chat\n• Contact admin if you need support\n\nTinni apologizes for the inconvenience 🙏`)
          }
        } catch {
          updateLastMessage(lang === 'vi'
            ? '😔 Xin lỗi bạn, Tinni gặp trục trặc không mong muốn. Bạn vui lòng thử lại nhé!\n\n💡 Nếu lỗi tiếp tục, hãy tải lại trang hoặc liên hệ quản trị viên để được hỗ trợ 🙏'
            : '😔 Sorry, Tinni encountered an unexpected issue. Please try again!\n\n💡 If the error continues, try refreshing the page or contacting the admin for support 🙏')
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
      // {stream:true} enables proper multi-chunk UTF-8 decoding without boundary splits
      const decoder = new TextDecoder('utf-8', { fatal: false })
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        // Keep the last (potentially incomplete) line in the buffer
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
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
      updateLastMessage(lang === 'vi'
        ? '📡 Ôi, Tinni không thể kết nối được. Có vẻ mạng internet đang gặp vấn đề.\n\n💡 Bạn hãy thử:\n• Kiểm tra kết nối WiFi/4G\n• Tải lại trang\n• Thử lại sau vài giây\n\nTinni xin lỗi vì sự bất tiện này nhé 💙'
        : '📡 Oops, Tinni can\'t connect right now. It seems like there\'s a network issue.\n\n💡 Please try:\n• Check your WiFi/mobile data\n• Refresh the page\n• Try again in a few seconds\n\nTinni apologizes for the inconvenience 💙')
    } finally {
      setLoading(false)
    }
  }, [addMessage, setLoading, updateLastMessage, appendToolCall, isGuest, guestCount, messages, conversationId, lang])

  // Callback when a tool widget reports its result (e.g. quiz score, hearing test)
  const handleToolResult = useCallback((toolName: string, result: Record<string, unknown>) => {
    // sendMessage internally calls addMessage for the user message — don't double-add
    sendMessage(`Tôi vừa hoàn thành ${toolName}. Kết quả: ${JSON.stringify(result)}`)
  }, [sendMessage])

  return (
    <div className="flex flex-col h-full bg-[#0b1515]">
      {/* Guest banner */}
      {isGuest && !showSignupModal && (
        <div className="bg-gradient-to-r from-[#024e41]/30 to-[#94d3c1]/10 border-b border-[#94d3c1]/20 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#94d3c1]">
            <Sparkles size={12} />
            {lang === 'vi'
              ? `Bạn đang dùng thử! Còn ${Math.max(0, GUEST_MAX - guestCount)} tin nhắn miễn phí`
              : `You're trying Tinni! ${Math.max(0, GUEST_MAX - guestCount)} free messages left`}
          </div>
          <Link href="/signup" className="text-[10px] font-semibold text-[#94d3c1] hover:text-[#afefdd] transition-colors">
            {lang === 'vi' ? 'Đăng ký miễn phí →' : 'Sign up free →'}
          </Link>
        </div>
      )}

      {/* Signup modal after guest limit */}
      {showSignupModal && (
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#172121] border border-[#3f4848]/30 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#024e41]/30 to-[#94d3c1]/20 border border-[#94d3c1]/30 flex items-center justify-center text-3xl mx-auto mb-4">
              💙
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {lang === 'vi' ? 'Bạn thích Tinni chứ? 😊' : 'Enjoying Tinni? 😊'}
            </h3>
            <p className="text-sm text-[#bfc8c8] mb-6">
              {lang === 'vi'
                ? 'Đăng ký miễn phí để tiếp tục chat, lưu lịch sử và trải nghiệm tất cả tính năng!'
                : 'Sign up free to continue chatting, save history, and unlock all features!'}
            </p>
            <Link href="/signup" className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#024e41] to-[#94d3c1] hover:from-[#165042] hover:to-[#afefdd] text-[#00201a] rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-[#94d3c1]/25">
              <LogIn size={16} /> {lang === 'vi' ? 'Đăng ký miễn phí' : 'Sign Up Free'}
            </Link>
            <Link href="/login" className="block mt-3 text-xs text-[#899392] hover:text-[#bfc8c8] transition-colors">
              {lang === 'vi' ? 'Đã có tài khoản? Đăng nhập' : 'Already have an account? Log in'}
            </Link>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#3f4848]/30 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-[#dae5e4]">Tinni 🌿</span>
          {isLoading && (
            <span className="text-xs text-[#899392] animate-pulse">{d.common.loading}</span>
          )}
        </div>
        <button
          onClick={clearMessages}
          title={d.chat.newChat}
          className="flex items-center gap-1.5 rounded-xl border border-[#3f4848]/30 px-3 py-1.5 text-xs text-[#bfc8c8] hover:bg-white/[0.04] hover:text-[#dae5e4] transition-all duration-300"
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
