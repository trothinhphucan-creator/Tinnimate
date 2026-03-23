// LLM provider abstraction — interface + factory for Gemini / OpenAI / Anthropic
import type { ChatMessage, LLMModel, TokenUsage } from '@/types'
import type { FunctionDeclaration } from './tools'

export interface StreamOptions {
  systemInstruction: string
  toolDeclarations: FunctionDeclaration[]
  temperature: number
  maxOutputTokens: number
  training?: boolean
}

export interface LLMProvider {
  streamChat(
    messages: ChatMessage[],
    options: StreamOptions,
    onUsage: (usage: TokenUsage) => void | Promise<void>
  ): Promise<ReadableStream>
}

// Factory: select provider implementation based on model.provider field
/* eslint-disable @typescript-eslint/no-require-imports */
export function getProvider(model: LLMModel): LLMProvider {
  switch (model.provider) {
    case 'gemini': {
      const { GeminiProvider } = require('./providers/gemini-provider') as { GeminiProvider: new (m: LLMModel) => LLMProvider }
      return new GeminiProvider(model)
    }
    case 'openai': {
      const { OpenAIProvider } = require('./providers/openai-provider') as { OpenAIProvider: new (m: LLMModel) => LLMProvider }
      return new OpenAIProvider(model)
    }
    case 'anthropic': {
      const { AnthropicProvider } = require('./providers/anthropic-provider') as { AnthropicProvider: new (m: LLMModel) => LLMProvider }
      return new AnthropicProvider(model)
    }
    case 'litellm': {
      const { LiteLLMProvider } = require('./providers/litellm-provider') as { LiteLLMProvider: new (m: LLMModel) => LLMProvider }
      return new LiteLLMProvider(model)
    }
    default:
      throw new Error(`Unsupported provider: ${(model as LLMModel).provider}`)
  }
}
/* eslint-enable @typescript-eslint/no-require-imports */
