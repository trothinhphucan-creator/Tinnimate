import { TrainingChat } from "@/components/admin/TrainingChat"
import { createServiceClient } from "@/lib/supabase/server"
import { TRAINING_MODE_FALLBACK } from "@/lib/ai/prompts"
import type { TrainingSession, SystemPrompt } from "@/types"

async function getSessions(): Promise<TrainingSession[]> {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from("training_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)
    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

async function getTrainingPrompt(): Promise<SystemPrompt | null> {
  try {
    const supabase = createServiceClient()
    // Prefer active version, fall back to latest
    const { data: active } = await supabase
      .from("system_prompts")
      .select("*")
      .eq("name", "training_mode")
      .eq("is_active", true)
      .maybeSingle()
    if (active) return active as SystemPrompt
    const { data: latest } = await supabase
      .from("system_prompts")
      .select("*")
      .eq("name", "training_mode")
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle()
    return (latest as SystemPrompt) ?? null
  } catch {
    return null
  }
}

export default async function TrainingPage() {
  const [sessions, trainingPrompt] = await Promise.all([getSessions(), getTrainingPrompt()])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-1">Training Chat</h1>
      <p className="text-slate-400 text-sm mb-6">
        Chat with Tinni in training mode. Rate responses and save sessions to improve prompts.
      </p>
      <TrainingChat
        sessions={sessions}
        trainingPrompt={trainingPrompt}
        trainingPromptFallback={TRAINING_MODE_FALLBACK}
      />
    </div>
  )
}
