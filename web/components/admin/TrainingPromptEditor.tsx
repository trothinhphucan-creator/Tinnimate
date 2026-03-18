'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import type { SystemPrompt } from '@/types'

interface Props {
  initialPrompt: SystemPrompt | null
  fallbackContent: string
}

export function TrainingPromptEditor({ initialPrompt, fallbackContent }: Props) {
  const { toast } = useToast()
  const [content, setContent] = useState(initialPrompt?.content ?? fallbackContent)
  const [saving, setSaving] = useState(false)
  const [activePrompt, setActivePrompt] = useState<SystemPrompt | null>(initialPrompt)

  const isDirty = content !== (activePrompt?.content ?? fallbackContent)

  const handleSave = async () => {
    if (!content.trim()) return
    setSaving(true)
    try {
      // Create new version
      const createRes = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'training_mode', content }),
      })
      if (!createRes.ok) { const e = await createRes.json().catch(() => ({})); throw new Error((e as {error?:string}).error ?? `HTTP ${createRes.status}`) }
      const newPrompt: SystemPrompt = await createRes.json()

      // Activate it immediately
      const activateRes = await fetch('/api/admin/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newPrompt.id }),
      })
      if (!activateRes.ok) { const e = await activateRes.json().catch(() => ({})); throw new Error((e as {error?:string}).error ?? `HTTP ${activateRes.status}`) }
      const activated: SystemPrompt = await activateRes.json()

      setActivePrompt(activated)
      setContent(activated.content)
      toast('Training prompt saved & activated', 'success')
    } catch (err) {
      console.error('[TrainingPromptEditor] save failed:', err)
      toast('Failed to save prompt', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setContent(activePrompt?.content ?? fallbackContent)
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {activePrompt ? (
            <Badge className="text-[10px] bg-green-900/40 text-green-300 border border-green-700 px-1.5 py-0">
              v{activePrompt.version} active
            </Badge>
          ) : (
            <Badge className="text-[10px] bg-yellow-900/40 text-yellow-300 border border-yellow-700 px-1.5 py-0">
              using default
            </Badge>
          )}
          {isDirty && (
            <span className="text-[10px] text-slate-400">unsaved changes</span>
          )}
        </div>
      </div>

      <Textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={18}
        className="bg-slate-900 border-slate-600 text-slate-100 text-xs font-mono resize-none flex-1"
        placeholder="Training mode system prompt…"
      />

      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={saving || !isDirty}
          size="sm"
          className="bg-purple-700 hover:bg-purple-600 text-white flex-1 text-xs"
        >
          {saving ? 'Saving…' : 'Save & Activate'}
        </Button>
        {isDirty && (
          <Button onClick={handleReset} size="sm" variant="ghost"
            className="text-slate-400 hover:text-white text-xs">
            Reset
          </Button>
        )}
      </div>

      <p className="text-[10px] text-slate-500 leading-relaxed">
        Changes take effect on the next training session. This prompt is injected alongside the main system prompt only in training mode.
      </p>
    </div>
  )
}
