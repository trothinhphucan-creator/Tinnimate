'use client'

import React, { useState } from "react"
import dynamic from "next/dynamic"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import type { SystemPrompt } from "@/types"

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false })

interface Props { prompts: SystemPrompt[] }

export function PromptEditor({ prompts: initial }: Props) {
  const { toast } = useToast()
  const [prompts, setPrompts] = useState(initial)
  const [selected, setSelected] = useState<SystemPrompt | null>(initial[0] ?? null)
  const [content, setContent] = useState(initial[0]?.content ?? "")
  const [name, setName] = useState(initial[0]?.name ?? "")
  const [notes, setNotes] = useState(initial[0]?.notes ?? "")
  const [loading, setLoading] = useState(false)

  // Group by name
  const groups = prompts.reduce<Record<string, SystemPrompt[]>>((acc, p) => {
    ;(acc[p.name] ??= []).push(p)
    return acc
  }, {})

  const select = (p: SystemPrompt) => {
    setSelected(p)
    setContent(p.content)
    setName(p.name)
    setNotes(p.notes ?? "")
  }

  const handleActivate = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/prompts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, is_active: true }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as {error?:string}).error ?? `HTTP ${res.status}`) }
      setPrompts(prev => prev.map(p =>
        p.name === selected.name ? { ...p, is_active: p.id === selected.id } : p
      ))
      toast("Prompt activated", "success")
    } catch (err) {
      console.error('[PromptEditor] activate failed:', err)
      toast("Failed to activate prompt", "error")
    } finally { setLoading(false) }
  }

  const handleSaveNew = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, content, notes }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as {error?:string}).error ?? `HTTP ${res.status}`) }
      const created: SystemPrompt = await res.json()
      setPrompts(prev => [...prev, created])
      setSelected(created)
      toast("New version saved", "success")
    } catch (err) {
      console.error('[PromptEditor] save failed:', err)
      toast("Failed to save version", "error")
    } finally { setLoading(false) }
  }

  const handleDelete = async () => {
    if (!selected || !confirm("Delete this version?")) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/prompts?id=${selected.id}`, { method: "DELETE" })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as {error?:string}).error ?? `HTTP ${res.status}`) }
      const next = prompts.filter(p => p.id !== selected.id)
      setPrompts(next)
      const fallback = next[0] ?? null
      setSelected(fallback)
      setContent(fallback?.content ?? "")
      setName(fallback?.name ?? "")
      setNotes(fallback?.notes ?? "")
      toast("Version deleted", "success")
    } catch (err) {
      console.error('[PromptEditor] delete failed:', err)
      toast("Failed to delete", "error")
    } finally { setLoading(false) }
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-160px)]">
      {/* Left: version list */}
      <ScrollArea className="w-56 shrink-0 bg-slate-800 border border-slate-700 rounded-lg p-3">
        {Object.entries(groups).map(([groupName, versions]) => (
          <div key={groupName} className="mb-4">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2 px-1">{groupName}</p>
            {versions
              .sort((a, b) => b.version - a.version)
              .map(p => (
                <button
                  key={p.id}
                  onClick={() => select(p)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs mb-1 flex items-center justify-between gap-2 transition-colors ${
                    selected?.id === p.id
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <span>v{p.version}</span>
                  {p.is_active && (
                    <Badge className="bg-green-600 text-white text-[10px] px-1 py-0">active</Badge>
                  )}
                </button>
              ))}
          </div>
        ))}
      </ScrollArea>

      {/* Right: editor */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <div className="flex-1 rounded-lg overflow-hidden border border-slate-700">
          <MonacoEditor
            height="100%"
            language="markdown"
            theme="vs-dark"
            value={content}
            onChange={v => setContent(v ?? "")}
            options={{ minimap: { enabled: false }, wordWrap: "on", fontSize: 13 }}
          />
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <Label className="text-slate-400 text-xs mb-1 block">Name</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white text-sm"
              />
            </div>
            <div>
              <Label className="text-slate-400 text-xs mb-1 block">Version</Label>
              <div className="h-9 flex items-center px-3 bg-slate-700 border border-slate-600 rounded-md text-slate-300 text-sm">
                v{selected?.version ?? "—"}
              </div>
            </div>
          </div>

          <div>
            <Label className="text-slate-400 text-xs mb-1 block">Notes</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="bg-slate-700 border-slate-600 text-white text-sm resize-none"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleActivate} disabled={loading || selected?.is_active}
              className="bg-green-700 hover:bg-green-600 text-white text-xs">
              Activate this version
            </Button>
            <Button onClick={handleSaveNew} disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
              Save as new version
            </Button>
            <Button onClick={handleDelete} disabled={loading} variant="destructive"
              className="text-xs ml-auto">
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
