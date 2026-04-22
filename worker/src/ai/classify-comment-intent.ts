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
import { logger } from '../lib/pino-structured-logger.js'

export type CommentClassification = {
  needs_reply: boolean
  intent: 'seeking_info' | 'asking_question' | 'sharing_experience' | 'complaining' | 'spam' | 'other'
  urgency: 'high' | 'medium' | 'low'
  confidence: number       // 0.0–1.0
  suggested_angle: string  // 1-sentence hint for reply generation
  lang: 'vi' | 'en' | 'mixed' | 'other'
}

const COMMENT_CLASSIFY_SYSTEM = `Bạn là chuyên gia phân tích bình luận mạng xã hội về sức khỏe thính giác (ù tai, mất thính lực).

Nhiệm vụ: Phân tích bình luận và xác định xem Fanpage chuyên về ù tai có cần reply không.

Trả về JSON với schema:
{
  "needs_reply": boolean,        // true nếu comment đang hỏi / cần thông tin / tìm giải pháp
  "intent": string,              // "seeking_info" | "asking_question" | "sharing_experience" | "complaining" | "spam" | "other"
  "urgency": string,             // "high" | "medium" | "low"
  "confidence": number,          // 0.0–1.0
  "suggested_angle": string,     // 1 câu gợi ý hướng trả lời (tiếng Việt)
  "lang": string                 // "vi" | "en" | "mixed" | "other"
}

NEEDS_REPLY = TRUE khi comment:
- Đang hỏi về triệu chứng ù tai, nguyên nhân
- Tìm kiếm phương pháp điều trị, sản phẩm, bác sĩ
- Hỏi về máy trợ thính, liệu pháp âm thanh
- Chia sẻ vấn đề và cần tư vấn
- Hỏi giá cả, địa chỉ, thời gian khám

NEEDS_REPLY = FALSE khi:
- Chỉ chia sẻ kinh nghiệm cá nhân (không đặt câu hỏi)
- Chúc mừng, emoji, cảm ơn chung
- Spam, quảng cáo không liên quan
- Chủ đề hoàn toàn không liên quan đến ù tai / thính giác

Chỉ trả về JSON, không giải thích thêm.`

export async function classifyCommentIntent(
  content: string,
  postContent?: string,
): Promise<CommentClassification> {
  const model = getGeminiModel()

  const userMsg = [
    postContent ? `Bài viết gốc (context): "${postContent.slice(0, 500)}"` : '',
    '',
    `Bình luận cần phân tích: "${content.slice(0, 1000)}"`,
  ].filter(Boolean).join('\n')

  let result
  try {
    result = await model.generateContent({
      systemInstruction: COMMENT_CLASSIFY_SYSTEM,
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
