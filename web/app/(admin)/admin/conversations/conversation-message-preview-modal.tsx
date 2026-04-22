'use client'

import { useEffect, useState } from 'react'
import { X, Loader2 } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'tool'
  content: string
  created_at: string
}

interface Props {
  conversationId: string
  title: string | null
  onClose: () => void
}

export function ConversationMessagePreviewModal({ conversationId, title, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/conversations/${conversationId}/messages`)
      .then(r => r.json())
      .then(d => setMessages(d.messages ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [conversationId])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">{title ?? 'Conversation'}</h3>
            <p className="text-[10px] text-slate-500">Read-only preview · last 30 messages</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white ml-3 flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Message thread */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-500">
              <Loader2 size={20} className="animate-spin mr-2" /> Loading…
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-8">No messages</p>
          ) : messages.map(msg => {
            const isUser = msg.role === 'user'
            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap break-words ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                  <div className={`mt-1 text-[9px] ${isUser ? 'text-blue-300' : 'text-slate-500'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
