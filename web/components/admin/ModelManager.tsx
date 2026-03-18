'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { ModelManagerForm } from './model-manager-form'
import type { LLMModel } from '@/types'

const PROVIDER_COLORS: Record<string, string> = {
  gemini: 'bg-blue-900/40 text-blue-300 border-blue-700',
  openai: 'bg-green-900/40 text-green-300 border-green-700',
  anthropic: 'bg-orange-900/40 text-orange-300 border-orange-700',
}

interface Props {
  initialModels: LLMModel[]
  activeModelId: string  // current admin_config.ai_model
}

export function ModelManager({ initialModels, activeModelId: initActiveId }: Props) {
  const { toast } = useToast()
  const [models, setModels] = useState<LLMModel[]>(initialModels)
  const [activeModelId, setActiveModelId] = useState(initActiveId)
  const [editing, setEditing] = useState<LLMModel | null | 'new'>(null)

  const refresh = async () => {
    const res = await fetch('/api/admin/models')
    if (res.ok) setModels(await res.json())
  }

  const handleSave = async (data: Record<string, unknown>, id?: string) => {
    const url = '/api/admin/models'
    const method = id ? 'PUT' : 'POST'
    const body = id ? { id, ...data } : data
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) { toast((await res.json()).error ?? 'Save failed', 'error'); return }
    toast(id ? 'Model updated' : 'Model added', 'success')
    setEditing(null)
    await refresh()
  }

  const handleDelete = async (model: LLMModel) => {
    if (!confirm(`Delete "${model.name}"? This cannot be undone.`)) return
    const res = await fetch('/api/admin/models', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: model.id }),
    })
    if (!res.ok) { toast((await res.json()).error ?? 'Delete failed', 'error'); return }
    toast('Model deleted', 'success')
    await refresh()
  }

  const handleToggleActive = async (model: LLMModel) => {
    const res = await fetch('/api/admin/models', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: model.id, is_active: !model.is_active }),
    })
    if (!res.ok) { toast('Update failed', 'error'); return }
    setModels((prev) => prev.map((m) => m.id === model.id ? { ...m, is_active: !m.is_active } : m))
  }

  const handleSetActive = async (model: LLMModel) => {
    const res = await fetch('/api/admin/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ai_model: model.model_id }),
    })
    if (!res.ok) { toast('Failed to set active model', 'error'); return }
    setActiveModelId(model.model_id)
    toast(`${model.name} is now the active model`, 'success')
  }

  return (
    <div className="space-y-6">
      {/* Model table */}
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/60">
              {['Model', 'Provider', 'Model ID', 'Cost (in/out per 1M)', 'Visible', 'Actions'].map((h) => (
                <th key={h} className="text-left px-3 py-2.5 text-slate-400 font-medium text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.id} className={`border-b border-slate-700/50 last:border-0 ${m.model_id === activeModelId ? 'bg-blue-900/10' : ''}`}>
                <td className="px-3 py-2.5">
                  <span className="text-white font-medium text-xs">{m.name}</span>
                  {m.model_id === activeModelId && (
                    <span className="ml-2 text-[10px] text-blue-400 font-semibold">● ACTIVE</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <Badge className={`text-[10px] border px-1.5 py-0 ${PROVIDER_COLORS[m.provider] ?? ''}`}>
                    {m.provider}
                  </Badge>
                </td>
                <td className="px-3 py-2.5 text-slate-400 text-xs font-mono">{m.model_id}</td>
                <td className="px-3 py-2.5 text-slate-300 text-xs">
                  ${m.input_cost_per_1m} / ${m.output_cost_per_1m}
                </td>
                <td className="px-3 py-2.5">
                  <button onClick={() => handleToggleActive(m)}
                    className={`w-8 h-4 rounded-full transition-colors ${m.is_active ? 'bg-blue-600' : 'bg-slate-600'}`} />
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-1.5">
                    {m.model_id !== activeModelId && (
                      <Button size="sm" variant="ghost" onClick={() => handleSetActive(m)}
                        className="text-[10px] h-6 px-2 text-blue-400 hover:text-blue-300">
                        Set Active
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setEditing(m)}
                      className="text-[10px] h-6 px-2 text-slate-400 hover:text-white">
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(m)}
                      className="text-[10px] h-6 px-2 text-red-400 hover:text-red-300">
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {models.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500 text-sm">No models configured</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit form */}
      {editing !== null ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <ModelManagerForm
            editing={editing === 'new' ? null : editing}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        </div>
      ) : (
        <Button onClick={() => setEditing('new')} size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
          + Add Model
        </Button>
      )}
    </div>
  )
}
