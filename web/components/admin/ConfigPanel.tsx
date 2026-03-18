'use client'

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { AdminConfig, LLMModel } from "@/types"

const TOOLS = ["diagnosis", "quiz", "therapy", "hearing_test", "relaxation", "progress", "checkin"]
const TIERS = ["free", "premium", "pro"] as const
const LIMITS = ["chat", "quiz", "hearing_test"] as const

interface Props { config: AdminConfig }

export function ConfigPanel({ config }: Props) {
  const { toast } = useToast()
  const [form, setForm] = useState<AdminConfig>({ ...config })
  const [saving, setSaving] = useState(false)
  const [models, setModels] = useState<LLMModel[]>([])

  useEffect(() => {
    fetch('/api/admin/models')
      .then(r => r.ok ? r.json() : [])
      .then((data: LLMModel[]) => setModels(data.filter(m => m.is_active)))
      .catch(() => {})
  }, [])

  const updateRateLimit = (tier: typeof TIERS[number], key: typeof LIMITS[number], val: string) => {
    const num = val === "" ? 0 : parseInt(val, 10)
    setForm(prev => ({
      ...prev,
      rate_limits: {
        ...prev.rate_limits,
        [tier]: { ...prev.rate_limits[tier], [key]: num },
      },
    }))
  }

  const toggleTool = (tool: string) => {
    setForm(prev => ({
      ...prev,
      tool_config: { ...prev.tool_config, [tool]: !prev.tool_config[tool] },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast("Configuration saved successfully", "success")
    } catch {
      toast("Failed to save configuration", "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* AI Model */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-sm">
            AI Model
            <span className="ml-2 text-slate-500 font-normal text-xs">
              — manage models & pricing at{' '}
              <a href="/admin/models" className="text-blue-400 hover:underline">/admin/models</a>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={form.ai_model} onValueChange={v => setForm(prev => ({ ...prev, ai_model: v }))}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600 text-white">
              {models.length > 0
                ? models.map(m => (
                    <SelectItem key={m.model_id} value={m.model_id}>
                      {m.name}
                    </SelectItem>
                  ))
                : ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'].map(id => (
                    <SelectItem key={id} value={id}>{id}</SelectItem>
                  ))
              }
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Temperature + Max Tokens */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white text-sm">Model Parameters</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-slate-300 text-xs mb-2 block">
              Temperature: <span className="text-white font-semibold">{form.temperature}</span>
            </Label>
            <input
              type="range" min={0} max={1} step={0.1}
              value={form.temperature}
              onChange={e => setForm(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1"><span>0.0</span><span>1.0</span></div>
          </div>
          <div>
            <Label className="text-slate-300 text-xs mb-2 block">Max Tokens</Label>
            <Input
              type="number" min={256} max={4096}
              value={form.max_tokens}
              onChange={e => setForm(prev => ({ ...prev, max_tokens: parseInt(e.target.value, 10) }))}
              className="bg-slate-700 border-slate-600 text-white w-40"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tools */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white text-sm">Tools Toggle</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {TOOLS.map(tool => (
              <label key={tool} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!form.tool_config[tool]}
                  onChange={() => toggleTool(tool)}
                  className="accent-blue-500 w-4 h-4"
                />
                <span className="text-slate-300 text-sm capitalize">{tool.replace(/_/g, " ")}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rate Limits */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white text-sm">Rate Limits <span className="text-slate-500 font-normal text-xs">(-1 = unlimited)</span></CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left text-slate-400 font-medium pb-2 pr-4">Limit</th>
                  {TIERS.map(t => (
                    <th key={t} className="text-center text-slate-400 font-medium pb-2 px-2 capitalize">{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="space-y-2">
                {LIMITS.map(key => (
                  <tr key={key}>
                    <td className="text-slate-300 py-2 pr-4 capitalize">{key.replace(/_/g, " ")}</td>
                    {TIERS.map(tier => {
                      const val = form.rate_limits[tier][key]
                      return (
                        <td key={tier} className="py-2 px-2 text-center">
                          <Input
                            type="number"
                            value={val}
                            onChange={e => updateRateLimit(tier, key, e.target.value)}
                            className="bg-slate-700 border-slate-600 text-white w-20 text-center mx-auto"
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        {saving ? "Saving…" : "Save Configuration"}
      </Button>
    </div>
  )
}
