'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  Settings, Save, Loader2, CheckCircle2, RotateCcw,
  ChevronDown, Info, Zap, Brain, MessageSquare
} from 'lucide-react'

const MODEL_OPTIONS = [
  { value: 'gemini-2.5-flash-preview-04-17', label: 'Gemini 2.5 Flash (mặc định)', provider: 'gemini', speed: 'Nhanh', cost: '$' },
  { value: 'gemini-2.5-pro-preview-03-25',   label: 'Gemini 2.5 Pro',             provider: 'gemini', speed: 'Chậm hơn', cost: '$$$' },
  { value: 'gemini-2.0-flash',               label: 'Gemini 2.0 Flash',           provider: 'gemini', speed: 'Nhanh nhất', cost: '$' },
]

type Settings = {
  llm_provider: string
  model_id: string
  temperature: number
  max_tokens: number
  reply_system_prompt: string
  classify_system_prompt: string
  comment_classify_prompt: string
}

function PromptEditor({
  id, label, icon: Icon, description, value, onChange,
}: {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  value: string
  onChange: (v: string) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const wordCount = value.split(/\s+/).filter(Boolean).length

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Icon className="h-4 w-4" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm text-white">{label}</p>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-600">{wordCount} từ</span>
          <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
        </div>
      </button>

      {!collapsed && (
        <div className="px-5 pb-4">
          <textarea
            id={id}
            value={value}
            onChange={e => onChange(e.target.value)}
            rows={14}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 px-4 py-3 font-mono leading-relaxed resize-y focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      )}
    </div>
  )
}

export default function SocialListeningSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [original, setOriginal] = useState<Settings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('sl_settings')
        .select('*')
        .eq('id', 'default')
        .single()
      if (data) {
        setSettings(data as Settings)
        setOriginal(data as Settings)
      }
    }
    void load()
  }, [supabase])

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    setError(null)
    try {
      const { error: err } = await supabase
        .from('sl_settings')
        .upsert({ ...settings, id: 'default', updated_at: new Date().toISOString() })
      if (err) throw new Error(err.message)
      setOriginal(settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (original) setSettings({ ...original })
  }

  const isDirty = settings && original && JSON.stringify(settings) !== JSON.stringify(original)

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur border-b border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">AI Settings</h1>
              <p className="text-xs text-slate-500">Cấu hình LLM + System Prompts cho Social Listening pipeline</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDirty && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-sm font-medium transition-colors"
            >
              {saving
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : saved
                  ? <CheckCircle2 className="h-4 w-4 text-green-400" />
                  : <Save className="h-4 w-4" />}
              {saved ? 'Đã lưu!' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
        {error && (
          <p className="mt-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded px-3 py-1.5">{error}</p>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* LLM Config */}
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Zap className="h-3.5 w-3.5" /> Model & Generation
          </h2>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-5">
            {/* Model selector */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Model</label>
              <div className="grid gap-2">
                {MODEL_OPTIONS.map(m => (
                  <label
                    key={m.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      settings.model_id === m.value
                        ? 'border-blue-500/50 bg-blue-500/10'
                        : 'border-slate-700 hover:border-slate-600 bg-slate-800/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="model"
                      value={m.value}
                      checked={settings.model_id === m.value}
                      onChange={() => setSettings(s => s ? { ...s, model_id: m.value, llm_provider: m.provider } : s)}
                      className="accent-blue-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{m.label}</p>
                      <p className="text-xs text-slate-500 font-mono">{m.value}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300">{m.speed}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-700 text-yellow-400">{m.cost}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Temperature + Max tokens */}
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Temperature
                  <span className="ml-2 text-xs text-blue-400 font-mono">{settings.temperature}</span>
                </label>
                <input
                  type="range" min={0} max={1.5} step={0.1}
                  value={settings.temperature}
                  onChange={e => setSettings(s => s ? { ...s, temperature: parseFloat(e.target.value) } : s)}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>0 — chính xác</span><span>1.5 — sáng tạo</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Max Tokens
                  <span className="ml-2 text-xs text-blue-400 font-mono">{settings.max_tokens}</span>
                </label>
                <input
                  type="range" min={100} max={600} step={50}
                  value={settings.max_tokens}
                  onChange={e => setSettings(s => s ? { ...s, max_tokens: parseInt(e.target.value) } : s)}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>100</span><span>600 token</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-800/50 rounded-lg px-3 py-2.5">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>Settings được cache 5 phút tại worker. Sau khi lưu, thay đổi có hiệu lực sau tối đa 5 phút mà không cần restart.</span>
            </div>
          </div>
        </section>

        {/* System Prompts */}
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Brain className="h-3.5 w-3.5" /> System Prompts
          </h2>
          <div className="space-y-3">
            <PromptEditor
              id="reply_prompt"
              label="Reply Prompt (Tinni Voice)"
              icon={MessageSquare}
              description="Prompt để generate reply cho post và comment — giọng điệu Tinni"
              value={settings.reply_system_prompt}
              onChange={v => setSettings(s => s ? { ...s, reply_system_prompt: v } : s)}
            />
            <PromptEditor
              id="comment_classify_prompt"
              label="Comment Classify Prompt"
              icon={Brain}
              description="Phân loại comment: needs_reply, intent, urgency, suggested_angle"
              value={settings.comment_classify_prompt}
              onChange={v => setSettings(s => s ? { ...s, comment_classify_prompt: v } : s)}
            />
            <PromptEditor
              id="classify_prompt"
              label="Post Classify Prompt"
              icon={Zap}
              description="Phân loại bài viết: relevance, topic, urgency, intent, crisis_flag"
              value={settings.classify_system_prompt}
              onChange={v => setSettings(s => s ? { ...s, classify_system_prompt: v } : s)}
            />
          </div>
        </section>

        {/* Dirty indicator bar */}
        {isDirty && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-full bg-blue-600 shadow-2xl shadow-blue-900/50 text-sm font-medium">
            <span>Có thay đổi chưa lưu</span>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-blue-700 hover:bg-blue-50 transition-colors text-xs font-semibold">
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Lưu ngay
            </button>
            <button onClick={handleReset} className="text-blue-200 hover:text-white text-xs">Reset</button>
          </div>
        )}
      </div>
    </div>
  )
}
