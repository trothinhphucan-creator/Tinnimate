import { requireAdmin } from '@/lib/supabase/require-admin'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'nodejs'

// POST /api/admin/video-bg-prompt
// Body: { scenes, animationStyle, mood, generateImage?: boolean }
// Returns: { prompt: string, imageUrl?: string (base64 data URL) }
export async function POST(request: Request) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const { scenes, animationStyle, mood, generateImage } = await request.json()

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return Response.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 })

    const genai = new GoogleGenerativeAI(apiKey)

    // ── Step 1: Generate text prompt ──────────────────────────────────────
    const textModel = genai.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })

    const sceneContext = (scenes as Array<{ emoji: string; title: string; subtitle: string }>)
      .map((s, i) => `Scene ${i + 1}: ${s.emoji} "${s.title}" — ${s.subtitle.replace(/\n/g, ' ')}`)
      .join('\n')

    const textPrompt = `You are a visual design expert for health/wellness social media videos about tinnitus therapy.

Video context:
${sceneContext}

Animation style: ${animationStyle}
Mood: ${mood}

Create ONE detailed English image generation prompt for a video background. Requirements:
- Style: dark, cinematic, abstract, therapeutic, atmospheric
- Colors that match the mood and video content
- NO text, NO people, NO faces in the image
- Abstract patterns, light effects, nature elements, depth
- Portrait format 9:16, quality: ultra-detailed, 8K
- Add at the end: --ar 9:16 --v 6.1 --style raw

Output ONLY the prompt, no explanation.`

    const textResult = await textModel.generateContent(textPrompt)
    const imagePrompt = textResult.response.text().trim()

    // ── Step 2: Generate actual image if requested ────────────────────────
    let imageDataUrl: string | null = null

    if (generateImage) {
      try {
        // Use Gemini's image generation model
        const imageModel = genai.getGenerativeModel({ model: 'imagen-3.0-generate-002' })

        const imageResult = await (imageModel as unknown as { generateImages: (p: Record<string, unknown>) => Promise<{ images?: Array<{ imageBytes?: string }> }> }).generateImages({
          prompt: imagePrompt,
          number_of_images: 1,
          aspect_ratio: '9:16',
          safety_filter_level: 'block_only_high',
          person_generation: 'dont_allow',
        })

        const b64 = imageResult.images?.[0]?.imageBytes
        if (b64) {
          imageDataUrl = `data:image/png;base64,${b64}`
        }
      } catch (imgErr) {
        console.error('Image generation failed, returning prompt only:', imgErr)
        // Fall through — still return the text prompt
      }
    }

    return Response.json({ prompt: imagePrompt, imageDataUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
