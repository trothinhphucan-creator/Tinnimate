'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MODEL_PRESETS, findPreset } from '@/lib/ai/model-presets'
import type { LLMModel, ProviderType } from '@/types'

const CUSTOM_VALUE = '__custom__'

type FormData = {
  name: string; model_id: string; provider: ProviderType
  api_key_env: string; api_key_override: string
  context_window: number; max_output_tokens: number
  input_cost_per_1m: number; output_cost_per_1m: number
  notes: string; sort_order: number
}

const EMPTY: FormData = {
  name: '', model_id: '', provider: 'gemini',
  api_key_env: '', api_key_override: '',
  context_window: 32768, max_output_tokens: 8192,
  input_cost_per_1m: 0, output_cost_per_1m: 0,
  notes: '', sort_order: 99,
}

function initModelMode(editing: LLMModel | null): 'preset' | 'custom' {
  if (!editing) return 'preset'
  return findPreset(editing.provider, editing.model_id) ? 'preset' : 'custom'
}

interface Props {
  editing: LLMModel | null
  onSave: (data: FormData, id?: string) => Promise<void>
  onCancel: () => void
}

export function ModelManagerForm({ editing, onSave, onCancel }: Props) {
  const [form, setForm] = useState<FormData>(
    editing
      ? {
          name: editing.name, model_id: editing.model_id, provider: editing.provider,
          api_key_env: editing.api_key_env ?? '', api_key_override: editing.api_key_override ?? '',
          context_window: editing.context_window, max_output_tokens: editing.max_output_tokens,
          input_cost_per_1m: editing.input_cost_per_1m, output_cost_per_1m: editing.output_cost_per_1m,
          notes: editing.notes ?? '', sort_order: editing.sort_order,
        }
      : EMPTY
  )
  const [modelMode, setModelMode] = useState<'preset' | 'custom'>(initModelMode(editing))
  const [saving, setSaving] = useState(false)

  const set = (k: keyof FormData, v: string | number) => setForm((p) => ({ ...p, [k]: v }))

  // When provider changes: reset model selection (add mode only)
  const handleProviderChange = (provider: ProviderType) => {
    setForm((p) => ({ ...p, provider, model_id: '', name: '' }))
    setModelMode('preset')
  }

  // When preset is selected: auto-fill costs + context window + name
  const handlePresetSelect = (value: string) => {
    if (value === CUSTOM_VALUE) {
      setModelMode('custom')
      setForm((p) => ({ ...p, model_id: '' }))
      return
    }
    const preset = findPreset(form.provider, value)
    if (!preset) return
    setModelMode('preset')
    setForm((p) => ({
      ...p,
      model_id: preset.model_id,
      name: p.name || preset.name, // only auto-fill name if currently blank
      input_cost_per_1m: preset.input_cost_per_1m,
      output_cost_per_1m: preset.output_cost_per_1m,
      context_window: preset.context_window,
      max_output_tokens: preset.max_output_tokens,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try { await onSave(form, editing?.id) } finally { setSaving(false) }
  }

  const presets = MODEL_PRESETS[form.provider] ?? []
  const selectValue = modelMode === 'custom' ? CUSTOM_VALUE : form.model_id

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="text-sm font-semibold text-white">{editing ? 'Edit Model' : 'Add Model'}</h3>

      {/* Provider + API key env */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-slate-400 text-xs">Provider</Label>
          <Select value={form.provider}
            onValueChange={(v) => editing ? set('provider', v as ProviderType) : handleProviderChange(v as ProviderType)}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white text-xs mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600 text-white">
              <SelectItem value="gemini">Gemini</SelectItem>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="anthropic">Anthropic</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-slate-400 text-xs">API Key Env Var</Label>
          <Input value={form.api_key_env} onChange={e => set('api_key_env', e.target.value)}
            className="bg-slate-700 border-slate-600 text-white text-xs mt-1" placeholder="GEMINI_API_KEY" />
        </div>
      </div>

      {/* Model ID — preset selector (add) or text input (edit / custom) */}
      <div>
        <Label className="text-slate-400 text-xs">Model</Label>
        {!editing ? (
          <Select value={selectValue} onValueChange={handlePresetSelect}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white text-xs mt-1">
              <SelectValue placeholder="Select a model…" />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600 text-white">
              {presets.map((p) => (
                <SelectItem key={p.model_id} value={p.model_id}>
                  <span>{p.name}</span>
                  <span className="ml-2 text-slate-400 text-[10px]">
                    ${p.input_cost_per_1m}/${p.output_cost_per_1m}
                  </span>
                </SelectItem>
              ))}
              <SelectItem value={CUSTOM_VALUE}>
                <span className="text-slate-300 italic">Other (type manually)…</span>
              </SelectItem>
            </SelectContent>
          </Select>
        ) : null}

        {/* Custom model ID input — shown in custom mode or edit mode */}
        {(modelMode === 'custom' || editing) && (
          <Input
            value={form.model_id}
            onChange={e => set('model_id', e.target.value)}
            required
            disabled={!!editing}
            className="bg-slate-700 border-slate-600 text-white text-xs mt-1 font-mono"
            placeholder="e.g. deepseek-r1, mistral-large-latest"
          />
        )}
      </div>

      {/* Display name */}
      <div>
        <Label className="text-slate-400 text-xs">Display Name</Label>
        <Input value={form.name} onChange={e => set('name', e.target.value)} required
          className="bg-slate-700 border-slate-600 text-white text-xs mt-1" placeholder="My Model" />
      </div>

      {/* API key override */}
      <div>
        <Label className="text-slate-400 text-xs">API Key Override <span className="text-slate-500">(optional)</span></Label>
        <Input type="password" value={form.api_key_override} onChange={e => set('api_key_override', e.target.value)}
          className="bg-slate-700 border-slate-600 text-white text-xs mt-1" placeholder="sk-… (leave blank to use env var)" />
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-slate-400 text-xs">Input cost / 1M tokens (USD)</Label>
          <Input type="number" step="0.001" value={form.input_cost_per_1m}
            onChange={e => set('input_cost_per_1m', parseFloat(e.target.value) || 0)}
            className="bg-slate-700 border-slate-600 text-white text-xs mt-1" />
        </div>
        <div>
          <Label className="text-slate-400 text-xs">Output cost / 1M tokens (USD)</Label>
          <Input type="number" step="0.001" value={form.output_cost_per_1m}
            onChange={e => set('output_cost_per_1m', parseFloat(e.target.value) || 0)}
            className="bg-slate-700 border-slate-600 text-white text-xs mt-1" />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={saving} size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs flex-1">
          {saving ? 'Saving…' : editing ? 'Update' : 'Add Model'}
        </Button>
        <Button type="button" onClick={onCancel} size="sm" variant="ghost"
          className="text-slate-400 hover:text-white text-xs">
          Cancel
        </Button>
      </div>
    </form>
  )
}
