'use client'

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import type { KnowledgeDoc } from "@/types"

const CATEGORIES = ["medical", "therapy", "faq", "general"] as const

interface Props { docs: KnowledgeDoc[] }

export function KnowledgeUploader({ docs: initial }: Props) {
  const { toast } = useToast()
  const [docs, setDocs] = useState(initial)
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<KnowledgeDoc["category"]>("general")
  const [docContent, setDocContent] = useState("")
  const [uploading, setUploading] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleUpload = async () => {
    if (!title.trim() || !docContent.trim()) {
      toast("Title and content are required", "error")
      return
    }
    setUploading(true)
    try {
      const res = await fetch("/api/admin/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, content: docContent }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as {error?:string}).error ?? `HTTP ${res.status}`) }
      const created: KnowledgeDoc = await res.json()
      setDocs(prev => [created, ...prev])
      setTitle("")
      setDocContent("")
      setCategory("general")
      toast("Document uploaded and embedded", "success")
    } catch (err) {
      console.error('[KnowledgeUploader] upload failed:', err)
      toast("Failed to upload document", "error")
    } finally {
      setUploading(false)
    }
  }

  const handleToggle = async (doc: KnowledgeDoc) => {
    setLoadingId(doc.id)
    try {
      const res = await fetch("/api/admin/knowledge", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: doc.id, is_active: !doc.is_active }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as {error?:string}).error ?? `HTTP ${res.status}`) }
      setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, is_active: !d.is_active } : d))
    } catch (err) {
      console.error('[KnowledgeUploader] toggle failed:', err)
      toast("Failed to update document", "error")
    } finally {
      setLoadingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document?")) return
    setLoadingId(id)
    try {
      const res = await fetch(`/api/admin/knowledge?id=${id}`, { method: "DELETE" })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as {error?:string}).error ?? `HTTP ${res.status}`) }
      setDocs(prev => prev.filter(d => d.id !== id))
      toast("Document deleted", "success")
    } catch (err) {
      console.error('[KnowledgeUploader] delete failed:', err)
      toast("Failed to delete document", "error")
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload form */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white text-sm">Add Document</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <Label className="text-slate-400 text-xs mb-1 block">Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Document title" className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div className="w-40">
              <Label className="text-slate-400 text-xs mb-1 block">Category</Label>
              <Select value={category} onValueChange={v => setCategory(v as KnowledgeDoc["category"])}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-slate-400 text-xs mb-1 block">Content</Label>
            <Textarea value={docContent} onChange={e => setDocContent(e.target.value)}
              rows={5} placeholder="Paste document content here…"
              className="bg-slate-700 border-slate-600 text-white resize-none" />
          </div>
          <Button onClick={handleUpload} disabled={uploading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {uploading ? "Embedding…" : "Upload Document"}
          </Button>
        </CardContent>
      </Card>

      {/* Documents table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white text-sm">Documents ({docs.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Title</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Category</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Created</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {docs.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-slate-500 text-center">No documents yet</td></tr>
                )}
                {docs.map(doc => (
                  <tr key={doc.id} className="border-b border-slate-700 last:border-0">
                    <td className="px-4 py-3 text-white max-w-[200px] truncate">{doc.title}</td>
                    <td className="px-4 py-3">
                      <Badge className="bg-slate-600 text-slate-200 text-xs capitalize">{doc.category}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={doc.is_active ? "bg-green-700 text-white text-xs" : "bg-slate-600 text-slate-300 text-xs"}>
                        {doc.is_active ? "active" : "inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" disabled={loadingId === doc.id}
                          onClick={() => handleToggle(doc)}
                          className="text-xs text-slate-300 hover:text-white h-7 px-2">
                          {doc.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button size="sm" variant="ghost" disabled={loadingId === doc.id}
                          onClick={() => handleDelete(doc.id)}
                          className="text-xs text-red-400 hover:text-red-300 h-7 px-2">
                          Delete
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
