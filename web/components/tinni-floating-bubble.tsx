'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { MessageCircle, X } from 'lucide-react'
import { useLangStore } from '@/stores/use-lang-store'
import { usePathname } from 'next/navigation'

const MESSAGES_VI = [
  'Hôm nay bạn thế nào? 💙',
  'Đã thử âm thanh trị liệu chưa? 🎧',
  'Nhớ uống nước nhé! 💧',
  'Hít thở sâu 3 lần nào 🧘',
  'Tinni luôn ở đây khi bạn cần 🤗',
  'Check-in hôm nay chưa? 📝',
  'Nghe tiếng mưa để thư giãn nhé 🌧️',
  'Bạn đang làm rất tốt! ⭐',
  'Kiên nhẫn nhé, sẽ tốt hơn thôi 🌱',
  'Thử bài tập thở 4-7-8 nào? 😌',
]

const MESSAGES_EN = [
  'How are you today? 💙',
  'Tried sound therapy yet? 🎧',
  'Stay hydrated! 💧',
  'Take 3 deep breaths 🧘',
  'Tinni is always here for you 🤗',
  'Did you check in today? 📝',
  'Listen to rain sounds to relax 🌧️',
  'You\'re doing great! ⭐',
  'Be patient, it gets better 🌱',
  'Try 4-7-8 breathing? 😌',
]

const BUBBLE_INTERVAL = 45000 // Show a bubble every 45 seconds
const BUBBLE_DURATION = 6000  // Bubble visible for 6 seconds

export function TinniFloatingBubble() {
  const { lang } = useLangStore()
  const pathname = usePathname()
  const [bubbleMsg, setBubbleMsg] = useState<string | null>(null)
  const [isMinimized, setIsMinimized] = useState(false)
  const msgIdxRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Don't show on chat page (already on chat)
  const isOnChat = pathname === '/chat'

  const messages = lang === 'vi' ? MESSAGES_VI : MESSAGES_EN

  useEffect(() => {
    if (isOnChat || isMinimized) return

    const showBubble = () => {
      const msg = messages[msgIdxRef.current % messages.length]
      msgIdxRef.current++
      setBubbleMsg(msg)
      setTimeout(() => setBubbleMsg(null), BUBBLE_DURATION)
    }

    // Show first bubble after 15 seconds
    const initialTimeout = setTimeout(showBubble, 15000)
    timerRef.current = setInterval(showBubble, BUBBLE_INTERVAL)

    return () => {
      clearTimeout(initialTimeout)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isOnChat, isMinimized, messages])

  if (isOnChat) return null

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
      {/* Speech bubble */}
      {bubbleMsg && !isMinimized && (
        <div className="relative bg-slate-800/95 backdrop-blur-lg border border-white/10 rounded-2xl rounded-br-md px-4 py-3 max-w-[220px] shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="text-xs text-slate-200 leading-relaxed">{bubbleMsg}</p>
          <button
            onClick={() => setBubbleMsg(null)}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-700 border border-white/10 flex items-center justify-center hover:bg-slate-600 transition-colors"
          >
            <X size={10} className="text-slate-400" />
          </button>
        </div>
      )}

      {/* Floating button */}
      <Link
        href="/chat"
        className="group w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-110 active:scale-95 transition-all duration-200"
        title={lang === 'vi' ? 'Chat với Tinni' : 'Chat with Tinni'}
      >
        <MessageCircle size={24} className="text-white" />
        {/* Online indicator */}
        <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-950" />
        </span>
      </Link>

      {/* Minimize toggle */}
      {!isMinimized ? (
        <button
          onClick={() => setIsMinimized(true)}
          className="text-[8px] text-slate-600 hover:text-slate-400 transition-colors"
        >
          {lang === 'vi' ? 'Ẩn' : 'Hide'}
        </button>
      ) : (
        <button
          onClick={() => setIsMinimized(false)}
          className="text-[8px] text-slate-600 hover:text-slate-400 transition-colors"
        >
          {lang === 'vi' ? 'Hiện tin nhắn' : 'Show messages'}
        </button>
      )}
    </div>
  )
}
