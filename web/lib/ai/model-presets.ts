// Popular LLM model presets with pricing and context window specs
// Prices in USD per 1M tokens (as of 2025-Q1)
import type { ProviderType } from '@/types'

export interface ModelPreset {
  model_id: string
  name: string
  input_cost_per_1m: number
  output_cost_per_1m: number
  context_window: number
  max_output_tokens: number
}

export const MODEL_PRESETS: Record<ProviderType, ModelPreset[]> = {
  gemini: [
    { model_id: 'gemini-2.5-flash',  name: 'Gemini 2.5 Flash',  input_cost_per_1m: 0.075, output_cost_per_1m: 0.30,  context_window: 1048576, max_output_tokens: 8192  },
    { model_id: 'gemini-2.5-pro',    name: 'Gemini 2.5 Pro',    input_cost_per_1m: 1.25,  output_cost_per_1m: 5.00,  context_window: 2097152, max_output_tokens: 8192  },
    { model_id: 'gemini-2.0-flash',  name: 'Gemini 2.0 Flash',  input_cost_per_1m: 0.10,  output_cost_per_1m: 0.40,  context_window: 1048576, max_output_tokens: 8192  },
    { model_id: 'gemini-1.5-flash',  name: 'Gemini 1.5 Flash',  input_cost_per_1m: 0.075, output_cost_per_1m: 0.30,  context_window: 1048576, max_output_tokens: 8192  },
    { model_id: 'gemini-1.5-pro',    name: 'Gemini 1.5 Pro',    input_cost_per_1m: 1.25,  output_cost_per_1m: 5.00,  context_window: 2097152, max_output_tokens: 8192  },
  ],
  openai: [
    { model_id: 'gpt-4o',           name: 'GPT-4o',            input_cost_per_1m: 2.50,  output_cost_per_1m: 10.00, context_window: 128000,  max_output_tokens: 16384 },
    { model_id: 'gpt-4o-mini',      name: 'GPT-4o Mini',       input_cost_per_1m: 0.15,  output_cost_per_1m: 0.60,  context_window: 128000,  max_output_tokens: 16384 },
    { model_id: 'gpt-4-turbo',      name: 'GPT-4 Turbo',       input_cost_per_1m: 10.00, output_cost_per_1m: 30.00, context_window: 128000,  max_output_tokens: 4096  },
    { model_id: 'gpt-3.5-turbo',    name: 'GPT-3.5 Turbo',     input_cost_per_1m: 0.50,  output_cost_per_1m: 1.50,  context_window: 16384,   max_output_tokens: 4096  },
    { model_id: 'o1',               name: 'OpenAI o1',         input_cost_per_1m: 15.00, output_cost_per_1m: 60.00, context_window: 200000,  max_output_tokens: 100000 },
    { model_id: 'o1-mini',          name: 'OpenAI o1 Mini',    input_cost_per_1m: 1.10,  output_cost_per_1m: 4.40,  context_window: 128000,  max_output_tokens: 65536 },
    { model_id: 'o3-mini',          name: 'OpenAI o3 Mini',    input_cost_per_1m: 1.10,  output_cost_per_1m: 4.40,  context_window: 128000,  max_output_tokens: 65536 },
  ],
  anthropic: [
    { model_id: 'claude-opus-4-6',            name: 'Claude Opus 4.6',    input_cost_per_1m: 15.00, output_cost_per_1m: 75.00, context_window: 200000,  max_output_tokens: 32000 },
    { model_id: 'claude-sonnet-4-6',          name: 'Claude Sonnet 4.6',  input_cost_per_1m: 3.00,  output_cost_per_1m: 15.00, context_window: 200000,  max_output_tokens: 64000 },
    { model_id: 'claude-haiku-4-5-20251001',  name: 'Claude Haiku 4.5',   input_cost_per_1m: 0.80,  output_cost_per_1m: 4.00,  context_window: 200000,  max_output_tokens: 8192  },
    { model_id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet',  input_cost_per_1m: 3.00,  output_cost_per_1m: 15.00, context_window: 200000,  max_output_tokens: 8192  },
    { model_id: 'claude-3-5-haiku-20241022',  name: 'Claude 3.5 Haiku',   input_cost_per_1m: 0.80,  output_cost_per_1m: 4.00,  context_window: 200000,  max_output_tokens: 8192  },
    { model_id: 'claude-3-opus-20240229',     name: 'Claude 3 Opus',      input_cost_per_1m: 15.00, output_cost_per_1m: 75.00, context_window: 200000,  max_output_tokens: 4096  },
  ],
  litellm: [
    { model_id: 'gemini-2.0-flash',      name: 'Gemini 2.0 Flash (LiteLLM)',  input_cost_per_1m: 0.10,  output_cost_per_1m: 0.40,  context_window: 1048576, max_output_tokens: 8192  },
    { model_id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite',       input_cost_per_1m: 0.075, output_cost_per_1m: 0.30,  context_window: 1048576, max_output_tokens: 8192  },
    { model_id: 'gpt-4o',               name: 'GPT-4o (LiteLLM)',            input_cost_per_1m: 2.50,  output_cost_per_1m: 10.00, context_window: 128000,  max_output_tokens: 16384 },
    { model_id: 'claude-3-5-sonnet',     name: 'Claude 3.5 Sonnet (LiteLLM)', input_cost_per_1m: 3.00,  output_cost_per_1m: 15.00, context_window: 200000,  max_output_tokens: 8192  },
    { model_id: 'llama3.2',             name: 'Llama 3.2 (Local)',            input_cost_per_1m: 0,     output_cost_per_1m: 0,     context_window: 128000,  max_output_tokens: 4096  },
  ],
}

export function findPreset(provider: ProviderType, modelId: string): ModelPreset | undefined {
  return MODEL_PRESETS[provider]?.find((p) => p.model_id === modelId)
}
