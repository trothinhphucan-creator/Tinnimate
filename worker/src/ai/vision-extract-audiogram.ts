/**
 * Vision: extract audiogram / hearing report info từ ảnh.
 * Dùng Gemini multimodal (inline base64 image).
 *
 * Chỉ gọi khi:
 *   - post.image_urls.length > 0
 *   - classification.topic liên quan thính lực
 *   - Ảnh đầu tiên < 5MB (avoid huge token spend)
 */

import https from 'https'
import http from 'http'
import { getGeminiModel, GEMINI_FLASH, geminiUsage } from './gemini-client.js'
import { VISION_AUDIOGRAM_PROMPT } from '../pipeline/prompts/ai-prompts.js'
import { logger } from '../lib/pino-structured-logger.js'

export type AudiogramExtraction = {
  is_audiogram: boolean
  extracted_text: string
  hearing_levels: Record<string, string> | null
  severity: 'normal' | 'mild' | 'moderate' | 'severe' | 'profound' | 'unknown'
  notes: string
}

const MAX_IMAGE_BYTES = 4 * 1024 * 1024 // 4MB

/**
 * Download image từ URL và trả về Buffer.
 * Throws nếu ảnh > MAX_IMAGE_BYTES.
 */
async function downloadImage(url: string): Promise<{ data: Buffer; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https://') ? https : http
    const req = client.get(url, { timeout: 15_000 }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} fetching image`))
        return
      }

      // Detect MIME type from Content-Type header
      const ct = res.headers['content-type'] ?? 'image/jpeg'
      const mimeType = ct.split(';')[0].trim()

      const chunks: Buffer[] = []
      let totalBytes = 0

      res.on('data', (chunk: Buffer) => {
        totalBytes += chunk.length
        if (totalBytes > MAX_IMAGE_BYTES) {
          req.destroy()
          reject(new Error(`Image too large: ${totalBytes} bytes`))
          return
        }
        chunks.push(chunk)
      })

      res.on('end', () => resolve({ data: Buffer.concat(chunks), mimeType }))
      res.on('error', reject)
    })

    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('Image download timeout')) })
  })
}

/**
 * Analyze first image URL for audiogram data.
 * Returns null if not an audiogram or download fails.
 */
export async function visionExtractAudiogram(
  imageUrls: string[],
): Promise<AudiogramExtraction | null> {
  if (imageUrls.length === 0) return null

  // Try up to first 2 images
  for (const url of imageUrls.slice(0, 2)) {
    try {
      const { data, mimeType } = await downloadImage(url)
      const base64 = data.toString('base64')

      const model = getGeminiModel(GEMINI_FLASH)
      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              { text: VISION_AUDIOGRAM_PROMPT },
              { inlineData: { mimeType, data: base64 } },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 512,
        },
      })

      const raw = result.response.text()
      const usage = result.response.usageMetadata
      geminiUsage.track(
        usage?.promptTokenCount ?? 0,
        usage?.candidatesTokenCount ?? 0,
        'vision-audiogram',
      )

      const parsed = JSON.parse(raw) as AudiogramExtraction
      logger.debug({ is_audiogram: parsed.is_audiogram, severity: parsed.severity }, 'Vision extraction done')

      if (parsed.is_audiogram) return parsed
      // If not audiogram, try next image
    } catch (err) {
      logger.warn({ url: url.slice(0, 80), err: (err as Error).message }, 'Vision extraction failed')
    }
  }

  return null
}
