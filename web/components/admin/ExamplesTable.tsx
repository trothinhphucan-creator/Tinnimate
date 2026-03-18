'use client'

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import type { FewShotExample } from "@/types"

interface Props { examples: FewShotExample[] }

function AddForm({ onAdd }: { onAdd: (ex: FewShotExample) => void }) {
  const { toast } = useToast()
  const [userMsg, setUserMsg] = useState("")
  const [aiResp, setAiResp] = useState("")
  const [cat, setCat] = useState("")
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    if (!userMsg.trim() || !aiResp.trim()) { toast("Both messages required", "error"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/admin/examples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_message: userMsg, ai_response: aiResp, category: cat }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as {error?:string}).error ?? `HTTP ${res.status}`) }
      const created: FewShotExample = await res.json()
      onAdd(created)
      setUserMsg(""); setAiResp(""); setCat("")
      toast("Example added", "success")
    } catch (err) {
      console.error('[ExamplesTable] add failed:', err)
      toast("Failed to add example", "error")
    } finally { setLoading(false) }
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader><CardTitle className="text-white text-sm">Add Example</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-slate-400 text-xs mb-1 block">User Message</Label>
          <Textarea value={userMsg} onChange={e => setUserMsg(e.target.value)} rows={3}
            placeholder="What the user says…" className="bg-slate-700 border-slate-600 text-white resize-none" />
        </div>
        <div>
          <Label className="text-slate-400 text-xs mb-1 block">AI Response</Label>
          <Textarea value={aiResp} onChange={e => setAiResp(e.target.value)} rows={3}
            placeholder="How Tinni should respond…" className="bg-slate-700 border-slate-600 text-white resize-none" />
        </div>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Label className="text-slate-400 text-xs mb-1 block">Category</Label>
            <Input value={cat} onChange={e => setCat(e.target.value)}
              placeholder="e.g. therapy, diagnosis" className="bg-slate-700 border-slate-600 text-white" />
          </div>
          <Button onClick={handleAdd} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? "Adding…" : "Add Example"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function EditDialog({ example, onSave }: { example: FewShotExample; onSave: (ex: FewShotExample) => void }) {
  const { toast } = useToast()
  const [userMsg, setUserMsg] = useState(example.user_message)
  const [aiResp, setAiResp] = useState(example.ai_response)
  const [cat, setCat] = useState(example.category ?? "")
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/examples", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: example.id, user_message: userMsg, ai_response: aiResp, category: cat }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as {error?:string}).error ?? `HTTP ${res.status}`) }
      onSave({ ...example, user_message: userMsg, ai_response: aiResp, category: cat })
      setOpen(false)
      toast("Example updated", "success")
    } catch (err) {
      console.error('[ExamplesTable] update failed:', err)
      toast("Failed to update", "error")
    } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-xs text-slate-300 hover:text-white h-7 px-2">Edit</Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-xl">
        <DialogHeader><DialogTitle>Edit Example</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-slate-400 text-xs mb-1 block">User Message</Label>
            <Textarea value={userMsg} onChange={e => setUserMsg(e.target.value)} rows={3}
              className="bg-slate-700 border-slate-600 text-white resize-none" />
          </div>
          <div>
            <Label className="text-slate-400 text-xs mb-1 block">AI Response</Label>
            <Textarea value={aiResp} onChange={e => setAiResp(e.target.value)} rows={4}
              className="bg-slate-700 border-slate-600 text-white resize-none" />
          </div>
          <div>
            <Label className="text-slate-400 text-xs mb-1 block">Category</Label>
            <Input value={cat} onChange={e => setCat(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white" />
          </div>
          <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white w-full">
            {loading ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ExamplesTable({ examples: initial }: Props) {
  const { toast } = useToast()
  const [examples, setExamples] = useState(initial)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleAdd = (ex: FewShotExample) => setExamples(prev => [ex, ...prev])

  const handleUpdate = (updated: FewShotExample) =>
    setExamples(prev => prev.map(e => e.id === updated.id ? updated : e))

  const handleToggle = async (ex: FewShotExample) => {
    setLoadingId(ex.id)
    try {
      const res = await fetch("/api/admin/examples", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ex.id, is_active: !ex.is_active }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as {error?:string}).error ?? `HTTP ${res.status}`) }
      setExamples(prev => prev.map(e => e.id === ex.id ? { ...e, is_active: !e.is_active } : e))
    } catch (err) {
      console.error('[ExamplesTable] toggle failed:', err)
      toast("Failed to toggle", "error")
    } finally { setLoadingId(null) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this example?")) return
    setLoadingId(id)
    try {
      const res = await fetch(`/api/admin/examples?id=${id}`, { method: "DELETE" })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as {error?:string}).error ?? `HTTP ${res.status}`) }
      setExamples(prev => prev.filter(e => e.id !== id))
      toast("Example deleted", "success")
    } catch (err) {
      console.error('[ExamplesTable] delete failed:', err)
      toast("Failed to delete", "error")
    } finally { setLoadingId(null) }
  }

  return (
    <div className="space-y-6">
      <AddForm onAdd={handleAdd} />

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white text-sm">Examples ({examples.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">User Message</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">AI Response</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Category</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Active</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {examples.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-slate-500 text-center">No examples yet</td></tr>
                )}
                {examples.map(ex => (
                  <tr key={ex.id} className="border-b border-slate-700 last:border-0">
                    <td className="px-4 py-3 text-slate-300 max-w-[180px]">
                      <span className="line-clamp-2">{ex.user_message}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 max-w-[200px]">
                      <span className="line-clamp-2">{ex.ai_response}</span>
                    </td>
                    <td className="px-4 py-3">
                      {ex.category && (
                        <Badge className="bg-slate-600 text-slate-200 text-xs">{ex.category}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={ex.is_active ? "bg-green-700 text-white text-xs" : "bg-slate-600 text-slate-300 text-xs"}>
                        {ex.is_active ? "yes" : "no"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <EditDialog example={ex} onSave={handleUpdate} />
                        <Button size="sm" variant="ghost" disabled={loadingId === ex.id}
                          onClick={() => handleToggle(ex)}
                          className="text-xs text-slate-300 hover:text-white h-7 px-2">
                          {ex.is_active ? "Off" : "On"}
                        </Button>
                        <Button size="sm" variant="ghost" disabled={loadingId === ex.id}
                          onClick={() => handleDelete(ex.id)}
                          className="text-xs text-red-400 hover:text-red-300 h-7 px-2">
                          Del
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
