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

const NOT_RELEVANT: PostClassification = {
  relevance: 0, topic: 'unrelated', urgency: 'low',
  intent: 'other', lang: 'vi', crisis_flag: false,
}

/** Strip markdown code block wrapper or prose preamble if model ignores responseMimeType */
function extractJson(raw: string): string {
  const stripped = raw.trim()
  // Handle ```json ... ``` or ``` ... ```
  const fenceMatch = stripped.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) return fenceMatch[1].trim()
  // Handle prose + JSON: extract from first { to last }
  const start = stripped.indexOf('{')
  const end = stripped.lastIndexOf('}')
  if (start !== -1 && end > start) return stripped.slice(start, end + 1)
  return stripped
}

/**
 * Classify 1 post. Returns NOT_RELEVANT for very short/empty content.
 */
export async function classifyPostRelevance(
  content: string,
  imageUrls: string[] = [],
  sourceLabel?: string,
): Promise<PostClassification> {
  // Skip Gemini call for trivially short content
  if (content.trim().length < 20) {
    logger.debug({ contentLen: content.length }, 'Content too short — skipping classify')
    return NOT_RELEVANT
  }

  const model = getGeminiModel(GEMINI_FLASH)

  const userMessage = [
    `Nguồn: ${sourceLabel ?? 'Không rõ'}`,
    '',
    `Nội dung post:`,
    content.slice(0, 3000),
  ].join('\n')

  let result
  try {
    result = await model.generateContent({
      systemInstruction: CLASSIFY_SYSTEM_PROMPT,
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
        maxOutputTokens: 512,
      },
    })
  } catch (err) {
    throw new Error(`Gemini classify API error: ${(err as Error).message}`)
  }

  const raw = result.response.text()

  const usage = result.response.usageMetadata
  geminiUsage.track(usage?.promptTokenCount ?? 0, usage?.candidatesTokenCount ?? 0, 'classify')

  // Handle empty response (model declined to classify)
  if (!raw.trim()) {
    logger.warn({ contentLen: content.length }, 'Gemini classify: empty response — treating as not relevant')
    return NOT_RELEVANT
  }

  // Parse JSON — strip markdown wrapper if present
  let parsed: PostClassification
  try {
    parsed = JSON.parse(extractJson(raw)) as PostClassification
  } catch {
    logger.warn({ raw: raw.slice(0, 200) }, 'Gemini classify: failed to parse JSON')
    throw new Error(`Classify JSON parse error: ${raw.slice(0, 100)}`)
  }

  if (typeof parsed.relevance !== 'number') {
    throw new Error(`Classify response missing relevance: ${raw.slice(0, 100)}`)
  }

  logger.debug(
    { relevance: parsed.relevance, topic: parsed.topic, urgency: parsed.urgency, crisis: parsed.crisis_flag },
    'Post classified',
  )

  return parsed
}
