/**
 * Generate reply draft — Tinni voice, grounded in MCP knowledge chunks.
 *
 * Flow:
 *   1. Build prompt with post + MCP chunks
 *   2. Call Gemini Flash → get text reply
 *   3. Validate (word count, no spam words, has meaningful content)
 *   4. Retry once if validation fails
 */

import { getGeminiModel, GEMINI_FLASH, geminiUsage } from './gemini-client.js'
import { REPLY_SYSTEM_PROMPT } from '../pipeline/prompts/ai-prompts.js'
import { getSlSettings } from '../config/sl-settings-loader.js'
import { formatChunksForPrompt, type McpKnowledgeChunk } from '../pipeline/mcp-query-builder.js'
import type { PostClassification } from './classify-post-relevance.js'
import { logger } from '../lib/pino-structured-logger.js'

/** Words bị cấm trong reply */
const BANNED_WORDS = ['mua ngay', 'đăng ký ngay', 'giảm giá', 'khuyến mãi', 'mua', 'order']

/** Word count limits */
const MIN_WORDS = 30
const MAX_WORDS = 140

export type GeneratedReply = {
  text: string
  wordCount: number
  usedChunkIds: string[]
}

/**
 * Generate reply draft cho 1 post.
 * Retry once if validation fails.
 */
export async function generateReplyDraft(
  postContent: string,
  classification: PostClassification,
  mcpChunks: McpKnowledgeChunk[],
): Promise<GeneratedReply> {
  const attempt1 = await _generateOnce(postContent, classification, mcpChunks)
  const validation1 = validateReply(attempt1)

  if (validation1.valid) {
    return {
      text: attempt1,
      wordCount: countWords(attempt1),
      usedChunkIds: mcpChunks.map((c) => c.id),
    }
  }

  logger.warn({ reason: validation1.reason }, 'Reply failed validation — retrying')

  // Retry với hint
  const retryHint = `[Lưu ý: ${validation1.reason}. Viết lại ngắn gọn hơn, bỏ từ ngữ bán hàng.]`
  const attempt2 = await _generateOnce(postContent, classification, mcpChunks, retryHint)
  const validation2 = validateReply(attempt2)

  if (!validation2.valid) {
    logger.warn({ reason: validation2.reason }, 'Retry also failed validation — using anyway with flag')
  }

  return {
    text: attempt2,
    wordCount: countWords(attempt2),
    usedChunkIds: mcpChunks.map((c) => c.id),
  }
}

async function _generateOnce(
  postContent: string,
  classification: PostClassification,
  mcpChunks: McpKnowledgeChunk[],
  hint?: string,
): Promise<string> {
  const settings = await getSlSettings()
  const model = getGeminiModel(settings.model_id !== 'gemini-2.5-flash-preview-04-17' ? settings.model_id : GEMINI_FLASH)
  const systemPrompt = settings.reply_system_prompt || REPLY_SYSTEM_PROMPT

  const userMessage = [
    `Topic: ${classification.topic} | Urgency: ${classification.urgency} | Lang: ${classification.lang}`,
    '',
    '=== KNOWLEDGE BASE ===',
    formatChunksForPrompt(mcpChunks),
    '',
    '=== POST CẦN REPLY ===',
    postContent.slice(0, 2000),
    hint ? `\n${hint}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const result = await model.generateContent({
    systemInstruction: systemPrompt,
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    generationConfig: {
      temperature: settings.temperature ?? 0.7,
      maxOutputTokens: settings.max_tokens ?? 300,
      topP: 0.9,
    },
  })

  const text = result.response.text().trim()

  const usage = result.response.usageMetadata
  geminiUsage.track(
    usage?.promptTokenCount ?? 0,
    usage?.candidatesTokenCount ?? 0,
    'generate-reply',
  )

  return text
}

function validateReply(text: string): { valid: boolean; reason?: string } {
  const words = countWords(text)

  if (words < MIN_WORDS) {
    return { valid: false, reason: `Quá ngắn (${words} từ, cần ≥ ${MIN_WORDS})` }
  }
  if (words > MAX_WORDS) {
    return { valid: false, reason: `Quá dài (${words} từ, max ${MAX_WORDS})` }
  }

  const lower = text.toLowerCase()
  for (const bw of BANNED_WORDS) {
    if (lower.includes(bw)) {
      return { valid: false, reason: `Chứa từ cấm: "${bw}"` }
    }
  }

  if (text.length < 50) {
    return { valid: false, reason: 'Reply quá ngắn' }
  }

  return { valid: true }
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}
