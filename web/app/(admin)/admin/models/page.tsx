export const dynamic = "force-dynamic"
import { ModelManager } from '@/components/admin/ModelManager'
import { createServiceClient } from '@/lib/supabase/server'
import type { LLMModel, AdminConfig } from '@/types'

async function getModels(): Promise<LLMModel[]> {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('llm_models')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

async function getActiveModelId(): Promise<string> {
  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('admin_config')
      .select('ai_model')
      .limit(1)
      .single()
    return data?.ai_model ?? 'gemini-2.5-flash'
  } catch {
    return 'gemini-2.5-flash'
  }
}

export default async function ModelsPage() {
  const [models, activeModelId] = await Promise.all([getModels(), getActiveModelId()])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-1">LLM Models</h1>
      <p className="text-slate-400 text-sm mb-6">
        Manage available AI models, API providers, and per-token pricing. The active model is used for all chat sessions.
      </p>
      <ModelManager initialModels={models} activeModelId={activeModelId} />
    </div>
  )
}
