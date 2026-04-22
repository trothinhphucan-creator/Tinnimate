/**
 * Shared Gemini SDK instance — Gemini 2.5 Flash.
 * Token usage được log để tracking cost ($0.075/1M input).
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from '../config/environment-schema.js'
import { logger } from '../lib/pino-structured-logger.js'

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)

/** Model IDs — read from env, fallback to stable release names */
export const GEMINI_FLASH = env.GEMINI_MODEL_CLASSIFY ?? 'gemini-2.5-flash'
export const GEMINI_PRO   = 'gemini-2.5-pro'

/**
 * Get a model instance. Mỗi call tạo model mới (stateless).
 */
export function getGeminiModel(modelId: string = GEMINI_FLASH) {
  return genAI.getGenerativeModel({ model: modelId })
}

/**
 * Structured counters để estimate cost.
 * Không cần persistence — chỉ dùng trong 1 process lifetime.
 */
export const geminiUsage = {
  inputTokens: 0,
  outputTokens: 0,
  calls: 0,

  track(inputTokens: number, outputTokens: number, tag: string) {
    this.inputTokens  += inputTokens
    this.outputTokens += outputTokens
    this.calls++

    // $0.075/1M input, $0.30/1M output (Flash)
    const costUsd =
      (this.inputTokens / 1_000_000) * 0.075 +
      (this.outputTokens / 1_000_000) * 0.30

    logger.debug(
      { tag, inputTokens, outputTokens, totalCostUsd: costUsd.toFixed(5) },
      'Gemini token usage',
    )
  },

  summary() {
    const costUsd =
      (this.inputTokens / 1_000_000) * 0.075 +
      (this.outputTokens / 1_000_000) * 0.30
    return {
      calls: this.calls,
      inputTokens: this.inputTokens,
      outputTokens: this.outputTokens,
      estimatedCostUsd: Number(costUsd.toFixed(4)),
    }
  },
}
