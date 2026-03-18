// LiteLLM provider — routes all models through the local LiteLLM gateway
// Uses OpenAI-compatible API format (LiteLLM exposes /v1/chat/completions)
import type { ChatMessage, LLMModel, TokenUsage } from '@/types'
import type { StreamOptions } from '../provider'
import type { FunctionDeclaration } from '../tools'

function toLiteLLMTools(decls: FunctionDeclaration[]): unknown[] {
  return decls.map((d) => ({
    type: 'function',
    function: {
      name: d.name,
      description: d.description,
      parameters: d.parameters ?? { type: 'object', properties: {} },
    },
  }))
}

function buildMessages(messages: ChatMessage[], system: string): unknown[] {
  return [
    { role: 'system', content: system },
    ...messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    })),
  ]
}

export class LiteLLMProvider {
  private model: LLMModel

  constructor(model: LLMModel) {
    this.model = model
  }

  private getApiKey(): string {
    return process.env.LITELLM_API_KEY ?? process.env.LITELLM_MASTER_KEY ?? 'sk-1234'
  }

  private getBaseUrl(): string {
    return process.env.LITELLM_API_URL ?? 'http://localhost:4000'
  }

  async streamChat(
    messages: ChatMessage[],
    options: StreamOptions,
    onUsage: (usage: TokenUsage) => void | Promise<void>
  ): Promise<ReadableStream> {
    const encoder = new TextEncoder()
    const initialMessages = buildMessages(messages, options.systemInstruction)

    return new ReadableStream({
      start: async (controller) => {
        try {
          await this.runLoop(
            initialMessages, options, controller, encoder, onUsage,
            { inputTokens: 0, outputTokens: 0 }
          )
        } finally {
          controller.close()
        }
      },
    })
  }

  private async runLoop(
    oaiMessages: unknown[],
    options: StreamOptions,
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder,
    onUsage: (usage: TokenUsage) => void | Promise<void>,
    usage: { inputTokens: number; outputTokens: number }
  ): Promise<void> {
    const apiUrl = `${this.getBaseUrl()}/v1/chat/completions`
    const apiKey = this.getApiKey()

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model.model_id,
        messages: oaiMessages,
        stream: true,
        stream_options: { include_usage: true },
        temperature: options.temperature,
        max_tokens: options.maxOutputTokens,
        tools: options.toolDeclarations.length > 0 ? toLiteLLMTools(options.toolDeclarations) : undefined,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error(`[LiteLLM] API error ${response.status}: ${err}`)
      throw new Error(`LiteLLM API error ${response.status}: ${err}`)
    }

    if (!response.body) throw new Error('LiteLLM returned no response body')
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    const toolAccum = new Map<number, { id: string; name: string; args: string }>()
    let finishReason: string | null = null

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      for (const line of decoder.decode(value).split('\n')) {
        const data = line.trim()
        if (!data.startsWith('data: ') || data.slice(6) === '[DONE]') continue
        let chunk: Record<string, unknown>
        try { chunk = JSON.parse(data.slice(6)) } catch { continue }

        // Usage from final chunk
        if (chunk.usage) {
          const u = chunk.usage as { prompt_tokens?: number; completion_tokens?: number }
          usage.inputTokens += u.prompt_tokens ?? 0
          usage.outputTokens += u.completion_tokens ?? 0
        }

        const choice = (chunk.choices as unknown[])?.[0] as Record<string, unknown>
        if (!choice) continue
        finishReason = (choice.finish_reason as string) ?? finishReason
        const delta = choice.delta as Record<string, unknown>
        if (!delta) continue

        if (delta.content) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'text', content: delta.content })}\n`)
          )
        }

        if (delta.tool_calls) {
          for (const tc of delta.tool_calls as Array<{
            index?: number; id?: string
            function?: { name?: string; arguments?: string }
          }>) {
            const idx = tc.index ?? 0
            if (!toolAccum.has(idx)) toolAccum.set(idx, { id: '', name: '', args: '' })
            const acc = toolAccum.get(idx)!
            if (tc.id) acc.id = tc.id
            if (tc.function?.name) acc.name += tc.function.name
            if (tc.function?.arguments) acc.args += tc.function.arguments
          }
        }
      }
    }

    // Multi-turn: if model requested tool calls, send results and continue
    if (finishReason === 'tool_calls' && toolAccum.size > 0) {
      const toolCallsForMsg: unknown[] = []
      const toolResultMsgs: unknown[] = []

      for (const [, tc] of toolAccum) {
        let parsedArgs: Record<string, unknown> = {}
        try { parsedArgs = JSON.parse(tc.args) } catch { /* ignore */ }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'tool_call', name: tc.name, args: parsedArgs })}\n`)
        )
        toolCallsForMsg.push({
          id: tc.id, type: 'function',
          function: { name: tc.name, arguments: tc.args },
        })
        toolResultMsgs.push({
          role: 'tool', tool_call_id: tc.id,
          content: JSON.stringify({ success: true }),
        })
      }

      const nextMessages = [
        ...oaiMessages,
        { role: 'assistant', content: null, tool_calls: toolCallsForMsg },
        ...toolResultMsgs,
      ]
      await this.runLoop(nextMessages, options, controller, encoder, onUsage, usage)
      return
    }

    onUsage({ inputTokens: usage.inputTokens, outputTokens: usage.outputTokens })
  }
}
