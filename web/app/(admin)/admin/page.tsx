import Link from "next/link"
import { Settings, FileText, Database, MessageSquare, Bot, Cpu } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CostDashboard } from "@/components/admin/CostDashboard"
import type { AdminConfig, SystemPrompt } from "@/types"

async function getConfig(): Promise<AdminConfig | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/admin/config`, {
      cache: "no-store",
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function getPrompts(): Promise<SystemPrompt[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/admin/prompts`, {
      cache: "no-store",
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

const quickLinks = [
  { href: "/admin/config", label: "AI Config", icon: Settings, desc: "Model, temperature, rate limits" },
  { href: "/admin/models", label: "LLM Models", icon: Cpu, desc: "Providers, pricing, API keys" },
  { href: "/admin/prompts", label: "System Prompts", icon: FileText, desc: "Edit and version prompts" },
  { href: "/admin/knowledge", label: "Knowledge Base", icon: Database, desc: "RAG documents" },
  { href: "/admin/examples", label: "Few-shot Examples", icon: MessageSquare, desc: "Response style guides" },
  { href: "/admin/training", label: "Training Chat", icon: Bot, desc: "Rate and save sessions" },
]

export default async function AdminDashboard() {
  const [config, prompts] = await Promise.all([getConfig(), getPrompts()])

  // Group prompts by name and count versions
  const promptGroups = prompts.reduce<Record<string, number>>((acc, p) => {
    acc[p.name] = (acc[p.name] ?? 0) + 1
    return acc
  }, {})

  const activePromptCount = prompts.filter(p => p.is_active).length

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
      <p className="text-slate-400 text-sm mb-8">Admin overview for TinniMate AI system.</p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-400 font-medium">Active Model</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white font-semibold text-sm truncate">{config?.ai_model ?? "—"}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-400 font-medium">Temperature</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white font-semibold text-sm">{config?.temperature ?? "—"}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-400 font-medium">Max Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white font-semibold text-sm">{config?.max_tokens ?? "—"}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-400 font-medium">Active Prompt Layers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white font-semibold text-sm">{activePromptCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Cost dashboard */}
      <div className="mb-8">
        <CostDashboard />
      </div>

      {/* Quick links */}
      <h2 className="text-sm font-semibold text-slate-300 mb-3">Quick Access</h2>
      <div className="grid grid-cols-2 gap-3 mb-8 lg:grid-cols-3">
        {quickLinks.map(({ href, label, icon: Icon, desc }) => (
          <Link key={href} href={href}>
            <Card className="bg-slate-800 border-slate-700 hover:border-blue-500 transition-colors cursor-pointer">
              <CardContent className="pt-4 pb-4 flex items-start gap-3">
                <Icon className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">{label}</p>
                  <p className="text-slate-400 text-xs">{desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Prompt versions table */}
      {Object.keys(promptGroups).length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-slate-300 mb-3">System Prompt Versions</h2>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Prompt Name</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Versions</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(promptGroups).map(([name, count]) => (
                    <tr key={name} className="border-b border-slate-700 last:border-0">
                      <td className="px-4 py-3 text-white">{name}</td>
                      <td className="px-4 py-3 text-slate-300">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
