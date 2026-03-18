'use client'

import { useRef, KeyboardEvent } from 'react'
import { Send } from 'lucide-react'
import { useLangStore } from '@/stores/use-lang-store'
import { t } from '@/lib/i18n'

interface ChatInputAreaProps {
  value: string
  onChange: (val: string) => void
  onSend: (content: string) => void
  disabled: boolean
  showQuickActions?: boolean
}

export function ChatInputArea({ value, onChange, onSend, disabled, showQuickActions = true }: ChatInputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { lang } = useLangStore()
  const d = t(lang)

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    onChange('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  return (
    <div className="border-t border-slate-800 bg-slate-950 px-4 py-3 flex flex-col gap-2">
      {/* Quick actions */}
      {showQuickActions && (
        <div className="flex flex-wrap gap-1.5">
          {d.quickActions.map((action) => (
            <button
              key={action.text}
              onClick={() => onSend(action.trigger)}
              disabled={disabled}
              className="rounded-full border border-slate-700/60 bg-slate-900/50 px-2.5 py-1 text-[11px] text-slate-400 hover:border-blue-500/50 hover:text-blue-400 hover:bg-blue-500/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {action.text}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => { onChange(e.target.value); handleInput() }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          placeholder={d.chat.inputPlaceholder}
          className="flex-1 resize-none rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 transition-colors leading-relaxed"
          style={{ minHeight: '42px', maxHeight: '120px' }}
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Send"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
