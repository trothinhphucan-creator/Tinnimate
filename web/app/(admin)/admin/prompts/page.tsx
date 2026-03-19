export const dynamic = "force-dynamic"
import { PromptEditor } from "@/components/admin/PromptEditor"
import { createServiceClient } from "@/lib/supabase/server"
import type { SystemPrompt } from "@/types"

async function getPrompts(): Promise<SystemPrompt[]> {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from("system_prompts")
      .select("*")
      .order("name")
      .order("version", { ascending: false })
    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

export default async function PromptsPage() {
  const prompts = await getPrompts()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-1">System Prompts</h1>
      <p className="text-slate-400 text-sm mb-6">
        Edit and version-control the AI&apos;s behavior. Activate a version to make it live.
      </p>
      <PromptEditor prompts={prompts} />
    </div>
  )
}
