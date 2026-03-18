'use client'

import React, { useState, useRef, useEffect } from "react"
import { Send, ThumbsUp, ThumbsDown, Trash2, Brain, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { TrainingPromptEditor } from "@/components/admin/TrainingPromptEditor"
import type { ChatMessage, TrainingNote, TrainingSession, SystemPrompt } from "@/types"

interface Props {
  sessions: TrainingSession[]
  trainingPrompt: SystemPrompt | null
  trainingPromptFallback: string
}

type RightTab = 'session' | 'memory' | 'prompt'

const CATEGORY_COLORS: Record<string, string> = {
  medical: 'bg-red-900/40 text-red-300 border-red-700',
  behavioral: 'bg-blue-900/40 text-blue-300 border-blue-700',
  faq: 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  general: 'bg-slate-700 text-slate-300 border-slate-600',
}

function MessageBubble({
  msg,
  onFeedback,
}: {
  msg: ChatMessage
  onFeedback: (id: string, fb: "good" | "bad") => void
}) {
  const isUser = msg.role === "user"
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`max-w-[75%] rounded-xl px-4 py-2.5 text-sm ${isUser ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-100"}`}>
        <p className="whitespace-pre-wrap">{msg.content}</p>
        {!isUser && (
          <div className="flex gap-2 mt-2 pt-1 border-t border-slate-600">
            <button onClick={() => onFeedback(msg.id, "good")}
              className={`text-xs transition-colors ${msg.feedback === "good" ? "text-green-400" : "text-slate-400 hover:text-green-400"}`}>
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onFeedback(msg.id, "bad")}
              className={`text-xs transition-colors ${msg.feedback === "bad" ? "text-red-400" : "text-slate-400 hover:text-red-400"}`}>
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function TrainingChat({ sessions: initialSessions, trainingPrompt, trainingPromptFallback }: Props) {
  const { toast } = useToast()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [feedback, setFeedback] = useState<Record<string, "good" | "bad">>({})
  const [notes, setNotes] = useState("")
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sessions, setSessions] = useState(initialSessions)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [trainingNotes, setTrainingNotes] = useState<TrainingNote[]>([])
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null)
  const [rightTab, setRightTab] = useState<RightTab>('session')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load existing training notes on mount
  useEffect(() => {
    fetch("/api/admin/training/notes")
      .then(r => r.ok ? r.json() : [])
      .then((data: TrainingNote[]) => setTrainingNotes(data))
      .catch(() => {/* silent */})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleFeedback = (id: string, fb: "good" | "bad") => {
    setFeedback(prev => ({ ...prev, [id]: fb }))
    setMessages(prev => prev.map(m => m.id === id ? { ...m, feedback: fb } : m))
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    }
    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setInput("")
    setSending(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Training-Mode": "true" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok || !res.body) throw new Error("Chat request failed")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue
          const raw = line.slice(6).trim()
          if (raw === "[DONE]" || !raw) continue
          try {
            const parsed = JSON.parse(raw)
            if (parsed?.type === "text" && parsed?.content) {
              accumulated += parsed.content
              setMessages(prev => prev.map(m =>
                m.id === assistantMsg.id ? { ...m, content: accumulated } : m
              ))
            }
            // When AI saves a training note, update the notes panel in real time
            if (parsed?.type === "training_note_saved" && parsed?.note) {
              setTrainingNotes(prev => [parsed.note as TrainingNote, ...prev])
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === assistantMsg.id ? { ...m, content: "Error: failed to get response." } : m
      ))
      toast("Chat request failed", "error")
    } finally {
      setSending(false)
    }
  }

  const handleSave = async () => {
    if (messages.length === 0) { toast("No messages to save", "error"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, feedback, notes }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as {error?:string}).error ?? `HTTP ${res.status}`) }
      const session: TrainingSession = await res.json()
      setSessions(prev => [session, ...prev])
      toast("Session saved", "success")
    } catch (err) {
      console.error('[TrainingChat] save session failed:', err)
      toast("Failed to save session", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleClear = () => {
    setMessages([])
    setFeedback({})
    setNotes("")
  }

  const handleDeleteSession = async (id: string) => {
    if (!confirm("Delete this session?")) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/training?id=${id}`, { method: "DELETE" })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as {error?:string}).error ?? `HTTP ${res.status}`) }
      setSessions(prev => prev.filter(s => s.id !== id))
      toast("Session deleted", "success")
    } catch (err) {
      console.error('[TrainingChat] delete session failed:', err)
      toast("Failed to delete session", "error")
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteNote = async (id: string) => {
    if (!confirm("Delete this training note?")) return
    setDeletingNoteId(id)
    try {
      const res = await fetch(`/api/admin/training/notes?id=${id}`, { method: "DELETE" })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as {error?:string}).error ?? `HTTP ${res.status}`) }
      setTrainingNotes(prev => prev.filter(n => n.id !== id))
      toast("Note deleted", "success")
    } catch (err) {
      console.error('[TrainingChat] delete note failed:', err)
      toast("Failed to delete note", "error")
    } finally {
      setDeletingNoteId(null)
    }
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-160px)]">
      {/* Left: chat panel */}
      <div className="flex-1 flex flex-col bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700">
          <p className="text-sm font-medium text-white">Training Chat</p>
          <p className="text-xs text-slate-400">{messages.length} messages</p>
        </div>

        <ScrollArea className="flex-1 px-4 py-3">
          {messages.length === 0 && (
            <p className="text-slate-500 text-sm text-center mt-8">Start chatting with Tinni in training mode…</p>
          )}
          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} onFeedback={handleFeedback} />
          ))}
          <div ref={bottomRef} />
        </ScrollArea>

        <div className="px-4 py-3 border-t border-slate-700 flex gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Type a message… (Enter to send)"
            rows={2}
            className="bg-slate-700 border-slate-600 text-white resize-none text-sm flex-1"
          />
          <Button onClick={handleSend} disabled={sending || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white self-end" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Right: tabbed panel */}
      <div className="w-72 shrink-0 flex flex-col bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-slate-700 shrink-0">
          {([
            { key: 'session', label: 'Session' },
            { key: 'memory',  label: <><Brain className="h-3 w-3 inline mr-1" />{trainingNotes.length}</> },
            { key: 'prompt',  label: <><Settings className="h-3 w-3 inline mr-1" />Prompt</> },
          ] as { key: RightTab; label: React.ReactNode }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setRightTab(tab.key)}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                rightTab === tab.key
                  ? 'text-white border-b-2 border-purple-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Session tab */}
        {rightTab === 'session' && (
          <div className="flex flex-col gap-3 p-3 overflow-y-auto flex-1">
            {/* Active session controls */}
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm">Active Session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-slate-400 text-xs mb-1">Notes</p>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                    rows={3} placeholder="Session notes…"
                    className="bg-slate-800 border-slate-600 text-white resize-none text-sm" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving} size="sm"
                    className="bg-green-700 hover:bg-green-600 text-white flex-1 text-xs">
                    {saving ? "Saving…" : "Save Session"}
                  </Button>
                  <Button onClick={handleClear} size="sm" variant="ghost"
                    className="text-slate-400 hover:text-white text-xs" title="Clear chat">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Saved sessions list */}
            <Card className="bg-slate-700/50 border-slate-600 flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm">Saved ({sessions.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                {sessions.length === 0 && (
                  <p className="text-slate-500 text-xs text-center py-4">No sessions saved yet</p>
                )}
                {sessions.map(s => (
                  <div key={s.id} className="flex items-start justify-between gap-2 p-2 bg-slate-800/60 rounded-lg">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-300 font-medium">
                        {new Date(s.created_at).toLocaleDateString()} · {s.messages.length} msgs
                      </p>
                      {s.notes && <p className="text-xs text-slate-400 truncate mt-0.5">{s.notes}</p>}
                    </div>
                    <button onClick={() => handleDeleteSession(s.id)} disabled={deletingId === s.id}
                      className="text-slate-500 hover:text-red-400 transition-colors shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Memory tab */}
        {rightTab === 'memory' && (
          <div className="flex flex-col gap-2 p-3 overflow-y-auto flex-1">
            <p className="text-slate-400 text-xs">AI saves knowledge here during training</p>
            {trainingNotes.length === 0 && (
              <p className="text-slate-500 text-xs text-center py-8">No notes saved yet</p>
            )}
            {trainingNotes.map(note => (
              <div key={note.id} className="p-2.5 bg-slate-700/60 rounded-lg border border-slate-600">
                <div className="flex items-start justify-between gap-1.5 mb-1">
                  <p className="text-xs font-medium text-slate-200 leading-tight">{note.title}</p>
                  <button onClick={() => handleDeleteNote(note.id)} disabled={deletingNoteId === note.id}
                    className="text-slate-500 hover:text-red-400 transition-colors shrink-0 mt-0.5">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{note.content}</p>
                <div className="mt-1.5">
                  <Badge className={`text-[10px] px-1.5 py-0 border ${CATEGORY_COLORS[note.category] ?? CATEGORY_COLORS.general}`}>
                    {note.category}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Prompt tab */}
        {rightTab === 'prompt' && (
          <div className="p-3 flex-1 overflow-hidden flex flex-col">
            <p className="text-slate-400 text-xs mb-3">
              Training mode instructions injected into Gemini when admin chats. Edit &amp; save to take effect immediately.
            </p>
            <TrainingPromptEditor
              initialPrompt={trainingPrompt}
              fallbackContent={trainingPromptFallback}
            />
          </div>
        )}
      </div>
    </div>
  )
}
