'use client'
import { create } from 'zustand'
import { ChatMessage, ToolCall } from '@/types'

interface ChatStore {
  messages: ChatMessage[]
  isLoading: boolean
  conversationId: string | null
  addMessage: (msg: ChatMessage) => void
  updateLastMessage: (content: string) => void
  appendToolCall: (toolCall: ToolCall) => void
  setLoading: (loading: boolean) => void
  setConversationId: (id: string) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isLoading: false,
  conversationId: null,

  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  // Appends streaming chunk to the last assistant message
  updateLastMessage: (content) =>
    set((state) => {
      const messages = [...state.messages]
      const last = messages[messages.length - 1]
      if (!last || last.role !== 'assistant') return state
      messages[messages.length - 1] = { ...last, content: last.content + content }
      return { messages }
    }),

  // Attaches a tool_call to the last assistant message for inline rendering
  appendToolCall: (toolCall) =>
    set((state) => {
      const messages = [...state.messages]
      // Find last assistant message (tool call belongs to it)
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'assistant') {
          messages[i] = { ...messages[i], toolCall }
          return { messages }
        }
      }
      return state
    }),

  setLoading: (loading) => set({ isLoading: loading }),
  setConversationId: (id) => set({ conversationId: id }),
  clearMessages: () => set({ messages: [], conversationId: null }),
}))
