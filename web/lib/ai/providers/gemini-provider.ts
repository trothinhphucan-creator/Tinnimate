// Gemini provider — streaming chat with multi-turn function calling + usage tracking
import { GoogleGenerativeAI, Content, Tool, Part } from '@google/generative-ai'
import type { ChatMessage, LLMModel, TokenUsage } from '@/types'
import type { StreamOptions } from '../provider'

function toGeminiHistory(messages: ChatMessage[]): Content[] {
  return messages.slice(0, -1).map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }))
}

export class GeminiProvider {
  private model: LLMModel

  constructor(model: LLMModel) {
    this.model = model
  }

  private getApiKey(): string {
    if (this.model.api_key_override) return this.model.api_key_override
    const envKey = this.model.api_key_env ?? 'GEMINI_API_KEY'
    return process.env[envKey] ?? process.env.GEMINI_API_KEY ?? ''
  }

  async streamChat(
    messages: ChatMessage[],
    options: StreamOptions,
    onUsage: (usage: TokenUsage) => void | Promise<void>
  ): Promise<ReadableStream> {
    const client = new GoogleGenerativeAI(this.getApiKey())
    const geminiModel = client.getGenerativeModel({
      model: this.model.model_id,
      systemInstruction: options.systemInstruction,
      generationConfig: {
        temperature: options.temperature,
        maxOutputTokens: options.maxOutputTokens,
      },
      tools: [{ functionDeclarations: options.toolDeclarations }] as unknown as Tool[],
    })

    const chat = geminiModel.startChat({ history: toGeminiHistory(messages) })
    const lastMsg = messages[messages.length - 1]
    const result = await chat.sendMessageStream(lastMsg?.content ?? '')
    const encoder = new TextEncoder()

    // Stream all parts; collect save_training_note calls for multi-turn continuation
    async function streamResult(
      stream: AsyncIterable<{ candidates?: Array<{ content?: { parts?: unknown[] } }> }>,
      controller: ReadableStreamDefaultController
    ): Promise<Array<{ name: string; args: Record<string, unknown> }>> {
      const trainingCalls: Array<{ name: string; args: Record<string, unknown> }> = []
      for await (const chunk of stream) {
        const candidate = (chunk.candidates as Array<{ content?: { parts?: unknown[] } }>)?.[0]
        if (!candidate) continue
        for (const part of (candidate.content?.parts ?? []) as Array<Record<string, unknown>>) {
          if ('text' in part && part.text) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'text', content: part.text })}\n`)
            )
          } else if ('functionCall' in part && part.functionCall) {
            const fc = part.functionCall as { name: string; args?: Record<string, unknown> }
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'tool_call', name: fc.name, args: fc.args ?? {} })}\n`)
            )
            if (fc.name === 'save_training_note') {
              trainingCalls.push({ name: fc.name, args: fc.args ?? {} })
            }
          }
        }
      }
      return trainingCalls
    }

    return new ReadableStream({
      async start(controller) {
        try {
          const trainingCalls = await streamResult(result.stream, controller)

          // Multi-turn: send functionResponse so model can generate confirmation text
          if (trainingCalls.length > 0) {
            const responses = trainingCalls.map((fc) => ({
              functionResponse: { name: fc.name, response: { success: true } },
            }))
            const continuation = await chat.sendMessageStream(responses as unknown as Part[])
            await streamResult(continuation.stream, controller)
          }

          // Capture token usage after stream completes
          try {
            const response = await result.response
            const meta = response.usageMetadata
            if (meta) {
              onUsage({
                inputTokens: meta.promptTokenCount ?? 0,
                outputTokens: meta.candidatesTokenCount ?? 0,
              })
            }
          } catch { /* non-critical */ }
        } finally {
          controller.close()
        }
      },
    })
  }
}
