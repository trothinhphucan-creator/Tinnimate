'use client'

import { useState } from 'react'
import { MessageSquare, X } from 'lucide-react'

interface ConversationRow {
  id: string
  title?: string | null
  updated_at: string
  messages?: MessageRow[]
}

interface MessageRow {
  id: string
  role: string
  content: string
  created_at?: string
}

interface Props {
  conversations: ConversationRow[]
  userId: string
}

export function ConversationsTab({ conversations }: Props) {
  const [selected, setSelected] = useState<ConversationRow | null>(null)
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)

  const openConversation = async (conv: ConversationRow) => {
    setSelected(conv)
    setLoadingMsgs(true)
    try {
      const res = await fetch(`/api/admin/conversations/${conv.id}/messages?limit=5`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages ?? [])
      } else {
        setMessages([])
      }
    } catch {
      setMessages([])
    }
    setLoadingMsgs(false)
  }

  return (
    <div>
      {/* Modal for last 5 messages */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelected(null)}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-lg w-full shadow-2xl max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <p className="text-sm font-semibold text-white truncate">
                {selected.title ?? 'Untitled conversation'}
              </p>
              <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white ml-2 flex-shrink-0">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMsgs ? (
                <p className="text-xs text-slate-500 text-center py-4">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No messages found.</p>
              ) : messages.map(m => (
                <div key={m.id} className={`text-xs rounded-lg p-3 ${m.role === 'user' ? 'bg-blue-600/20 ml-6' : 'bg-white/[0.03] mr-6'}`}>
                  <p className="text-[10px] text-slate-500 mb-1 capitalize">{m.role}</p>
                  <p className="text-slate-300 whitespace-pre-wrap line-clamp-6">{m.content}</p>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-white/5">
              <p className="text-[10px] text-slate-600 text-center">Showing last 5 messages (read-only)</p>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400 font-medium mb-3 uppercase tracking-wider">
        Conversations ({conversations.length})
      </p>
      {conversations.length === 0 ? (
        <p className="text-sm text-slate-500">No conversations found.</p>
      ) : (
        <div className="space-y-1.5">
          {conversations.map(c => (
            <button key={c.id} onClick={() => openConversation(c)}
              className="w-full text-left flex items-center gap-3 p-3 bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 rounded-lg transition-colors">
              <MessageSquare size={14} className="text-slate-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{c.title ?? 'Untitled'}</p>
              </div>
              <p className="text-[10px] text-slate-600 flex-shrink-0">
                {new Date(c.updated_at).toLocaleDateString()}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
