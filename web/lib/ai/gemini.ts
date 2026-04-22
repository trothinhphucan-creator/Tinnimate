// Server-side only — main AI streaming entry point, delegates to active provider
import { ChatMessage, LLMModel, TokenUsage } from '@/types'
import { getAdminConfig } from './config-loader'
import { assembleSystemPrompt, getTrainingModePrompt } from './prompts'
import { searchKnowledge, embedText } from './rag'
import { ENABLED_TOOLS, TRAINING_TOOL } from './tools'
import { getProvider } from './provider'
import { createServiceClient } from '@/lib/supabase/server'

// Re-export for convenience
export { embedText as generateEmbedding }

// Fallback model row when llm_models table is not yet populated
function buildFallbackModel(modelId: string, maxTokens: number): LLMModel {
  return {
    id: 'fallback',
    name: 'Gemini (fallback)',
    model_id: modelId,
    provider: 'gemini',
    api_key_env: 'GEMINI_API_KEY',
    context_window: 32768,
    max_output_tokens: maxTokens,
    input_cost_per_1m: 0,
    output_cost_per_1m: 0,
    is_active: true,
    sort_order: 0,
    created_at: new Date().toISOString(),
  }
}

// Returns a ReadableStream of newline-delimited JSON event lines
export async function streamChat(
  messages: ChatMessage[],
  options?: {
    training?: boolean
    onUsage?: (usage: TokenUsage) => void | Promise<void>
    lang?: string
    userId?: string
  }
): Promise<ReadableStream> {
  // Fetch personalized user context if userId is available
  let userContext: Parameters<typeof assembleSystemPrompt>[0] = undefined
  if (options?.userId) {
    try {
      const svc = createServiceClient()
      const [profileRes, checkinRes, assessmentRes, streakRes] = await Promise.all([
        svc.from('profiles').select('name, tinnitus_type, tinnitus_frequency, tinnitus_ear')
          .eq('id', options.userId).single(),
        svc.from('daily_checkins').select('mood_score, sleep_score, tinnitus_loudness, created_at')
          .eq('user_id', options.userId).order('created_at', { ascending: false }).limit(1).single(),
        svc.from('assessments').select('quiz_type, total_score, severity, created_at')
          .eq('user_id', options.userId).order('created_at', { ascending: false }).limit(1).single(),
        svc.from('daily_checkins').select('created_at')
          .eq('user_id', options.userId).order('created_at', { ascending: false }).limit(30),
      ])
      // Calculate streak
      let streak = 0
      if (streakRes.data?.length) {
        const today = new Date(); today.setHours(0,0,0,0)
        const dates = new Set(streakRes.data.map((c: { created_at: string }) => {
          const d = new Date(c.created_at); d.setHours(0,0,0,0); return d.toDateString()
        }))
        for (let i = 0; i < 365; i++) {
          const d = new Date(today); d.setDate(d.getDate() - i)
          if (dates.has(d.toDateString())) streak++; else break
        }
      }
      userContext = {
        tinnitusProfile: {
          ...(profileRes.data ?? {}),
          latestAssessment: assessmentRes.data ?? undefined,
          streak,
        },
        recentCheckin: checkinRes.data ?? undefined,
      }
    } catch { /* personalization is non-critical */ }
  }

  const [config, systemPrompt, trainingPrompt] = await Promise.all([
    getAdminConfig(),
    assembleSystemPrompt(userContext, options?.lang ?? 'vi'),
    options?.training ? getTrainingModePrompt() : Promise.resolve(''),
  ])

  // Inject RAG context for the last user message (Supabase + AgentSee MCP combined)
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
  let ragContext = ''
  if (lastUserMsg) {
    const docs = await searchKnowledge(lastUserMsg.content, 6)
    if (docs.length > 0) {
      const docBlocks = docs.map((d, i) => {
        // AgentSee docs carry _score and _source metadata
        const meta = (d as typeof d & { _score?: number; _source?: string })
        const scoreLine = meta._score != null ? ` (relevance: ${(meta._score * 100).toFixed(0)}%)` : ''
        const sourceLine = meta._source ? ` — nguồn: ${meta._source}` : ''
        return `### [${i + 1}] ${d.title}${scoreLine}${sourceLine}\n${d.content}`
      })
      ragContext =
        '\n\n## Kiến thức tham khảo (dùng để trả lời chi tiết, chính xác hơn)\n' +
        'Khi trả lời, hãy đề cập nguồn nếu thông tin đến từ tài liệu y tế cụ thể.\n\n' +
        docBlocks.join('\n\n')
    }
  }

  // Resolve active model from llm_models table; fall back to hardcoded gemini
  const supabase = createServiceClient()
  const { data: modelRow } = await supabase
    .from('llm_models')
    .select('*')
    .eq('model_id', config.ai_model)
    .eq('is_active', true)
    .maybeSingle()

  const activeModel: LLMModel = (modelRow as LLMModel | null) ?? buildFallbackModel(config.ai_model, config.max_tokens)

  // Auto-route through LiteLLM gateway when LITELLM_API_URL env is set
  // This overrides the provider to 'litellm' for all models, enabling:
  // - Automatic fallback (Gemini → OpenRouter → Ollama)
  // - Cost tracking via LiteLLM dashboard
  // - Redis caching for repeated queries
  if (process.env.LITELLM_API_URL) {
    activeModel.provider = 'litellm' as LLMModel['provider']
  }

  const provider = getProvider(activeModel)

  return provider.streamChat(
    messages,
    {
      systemInstruction: systemPrompt + ragContext + trainingPrompt,
      toolDeclarations: options?.training
        ? [...ENABLED_TOOLS(config.tool_config), TRAINING_TOOL]
        : ENABLED_TOOLS(config.tool_config),
      temperature: config.temperature,
      maxOutputTokens: config.max_tokens,
      training: options?.training,
    },
    options?.onUsage ?? (() => {})
  )
}
