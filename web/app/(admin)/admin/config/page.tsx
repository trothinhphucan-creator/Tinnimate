import { ConfigPanel } from "@/components/admin/ConfigPanel"
import type { AdminConfig } from "@/types"

async function getConfig(): Promise<AdminConfig | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/admin/config`,
      { cache: "no-store" }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function ConfigPage() {
  const config = await getConfig()

  const fallback: AdminConfig = {
    id: "",
    ai_model: "gemini-2.5-flash",
    temperature: 0.7,
    max_tokens: 1024,
    tool_config: {
      run_diagnosis: true, start_quiz: true, play_sound_therapy: true,
      start_hearing_test: true, play_relaxation: true, show_progress: true, daily_checkin: true,
    },
    rate_limits: {
      free: { chat: 20, quiz: 3, hearing_test: 1 },
      premium: { chat: 100, quiz: 10, hearing_test: 5 },
      pro: { chat: -1, quiz: -1, hearing_test: -1 },
    },
    updated_at: "",
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-1">AI Configuration</h1>
      <p className="text-slate-400 text-sm mb-8">
        Configure Gemini model parameters, tool availability, and rate limits per subscription tier.
      </p>
      <ConfigPanel config={config ?? fallback} />
    </div>
  )
}
