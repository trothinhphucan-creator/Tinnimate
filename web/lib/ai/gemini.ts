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
  }
): Promise<ReadableStream> {
  const [config, systemPrompt, trainingPrompt] = await Promise.all([
    getAdminConfig(),
    assembleSystemPrompt(undefined, options?.lang ?? 'vi'),
    options?.training ? getTrainingModePrompt() : Promise.resolve(''),
  ])

  // Inject RAG context for the last user message
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
  let ragContext = ''
  if (lastUserMsg) {
    const docs = await searchKnowledge(lastUserMsg.content)
    if (docs.length > 0) {
      ragContext =
        '\n\n## Relevant Knowledge\n' +
        docs.map((d) => `### ${d.title}\n${d.content}`).join('\n\n')
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
