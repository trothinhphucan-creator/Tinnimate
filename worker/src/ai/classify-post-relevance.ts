/**
 * Classify post relevance using Gemini structured output.
 * Returns JSON schema: { relevance, topic, urgency, intent, lang, crisis_flag }
 */

import { getGeminiModel, GEMINI_FLASH, geminiUsage } from './gemini-client.js'
import { CLASSIFY_SYSTEM_PROMPT } from '../pipeline/prompts/ai-prompts.js'
import { logger } from '../lib/pino-structured-logger.js'

export type PostClassification = {
  relevance: number     // 0.0–1.0
  topic: 'tinnitus_symptom' | 'tinnitus_treatment' | 'hearing_loss' | 'mental_health' | 'unrelated' | 'other'
  urgency: 'low' | 'medium' | 'high'
  intent: 'asking_help' | 'sharing_experience' | 'selling' | 'spam' | 'other'
  lang: 'vi' | 'en' | 'mixed'
  crisis_flag: boolean
}

/** Minimum relevance để tiếp tục draft reply */
export const MIN_RELEVANCE_THRESHOLD = 0.55

/**
 * Classify 1 post. Ném lỗi nếu Gemini response không parse được.
 */
export async function classifyPostRelevance(
  content: string,
  imageUrls: string[] = [],
  sourceLabel?: string,
): Promise<PostClassification> {
  const model = getGeminiModel(GEMINI_FLASH)

  const userMessage = [
    `Nguồn: ${sourceLabel ?? 'Không rõ'}`,
    '',
    `Nội dung post:`,
    content.slice(0, 3000), // cap to avoid huge token bills
  ].join('\n')

  let result
  try {
    result = await model.generateContent({
      systemInstruction: CLASSIFY_SYSTEM_PROMPT,
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,  // low temp for structured output
        maxOutputTokens: 256,
      },
    })
  } catch (err) {
    throw new Error(`Gemini classify API error: ${(err as Error).message}`)
  }

  const raw = result.response.text()

  // Track token usage
  const usage = result.response.usageMetadata
  geminiUsage.track(
    usage?.promptTokenCount ?? 0,
    usage?.candidatesTokenCount ?? 0,
    'classify',
  )

  // Parse JSON
  let parsed: PostClassification
  try {
    parsed = JSON.parse(raw) as PostClassification
  } catch {
    logger.warn({ raw: raw.slice(0, 200) }, 'Gemini classify: failed to parse JSON')
    throw new Error(`Classify JSON parse error: ${raw.slice(0, 100)}`)
  }

  // Validate required fields
  if (typeof parsed.relevance !== 'number') {
    throw new Error(`Classify response missing relevance: ${raw.slice(0, 100)}`)
  }

  logger.debug(
    { relevance: parsed.relevance, topic: parsed.topic, urgency: parsed.urgency, crisis: parsed.crisis_flag },
    'Post classified',
  )

  return parsed
}
