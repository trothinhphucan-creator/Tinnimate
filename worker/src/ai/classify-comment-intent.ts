/**
 * Classify comment intent using Gemini.
 *
 * Determines:
 * - needs_reply: true/false
 * - intent: seeking_info | asking_question | sharing_experience | complaining | other
 * - urgency: high | medium | low
 * - suggested_angle: 1-sentence reply direction hint
 */

import { getGeminiModel, geminiUsage } from './gemini-client.js'
import { COMMENT_CLASSIFY_SYSTEM_PROMPT } from '../pipeline/prompts/ai-prompts.js'
import { getSlSettings } from '../config/sl-settings-loader.js'
import { logger } from '../lib/pino-structured-logger.js'

export type CommentClassification = {
  needs_reply: boolean
  intent: 'seeking_info' | 'asking_question' | 'sharing_experience' | 'complaining' | 'spam' | 'other'
  urgency: 'high' | 'medium' | 'low'
  confidence: number       // 0.0–1.0
  suggested_angle: string  // 1-sentence hint for reply generation
  lang: 'vi' | 'en' | 'mixed' | 'other'
}


export async function classifyCommentIntent(
  content: string,
  postContent?: string,
): Promise<CommentClassification> {
  const settings = await getSlSettings()
  const model = getGeminiModel()
  const systemPrompt = settings.comment_classify_prompt || COMMENT_CLASSIFY_SYSTEM_PROMPT

  const userMsg = [
    postContent ? `Bài viết gốc (context): "${postContent.slice(0, 500)}"` : '',
    '',
    `Bình luận cần phân tích: "${content.slice(0, 1000)}"`,
  ].filter(Boolean).join('\n')

  let result
  try {
    result = await model.generateContent({
      systemInstruction: systemPrompt,
      contents: [{ role: 'user', parts: [{ text: userMsg }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
        maxOutputTokens: 256,
      },
    })
  } catch (err) {
    throw new Error(`Gemini comment classify error: ${(err as Error).message}`)
  }

  const raw = result.response.text()
  const usage = result.response.usageMetadata
  geminiUsage.track(usage?.promptTokenCount ?? 0, usage?.candidatesTokenCount ?? 0, 'comment-classify')

  try {
    const parsed = JSON.parse(raw) as CommentClassification
    // Validate required fields
    if (typeof parsed.needs_reply !== 'boolean') throw new Error('Missing needs_reply')
    return parsed
  } catch {
    logger.warn({ raw }, 'Failed to parse comment classification JSON')
    return {
      needs_reply: false,
      intent: 'other',
      urgency: 'low',
      confidence: 0,
      suggested_angle: '',
      lang: 'other',
    }
  }
}
