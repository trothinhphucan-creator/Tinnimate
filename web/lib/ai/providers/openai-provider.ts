// OpenAI provider — native fetch streaming with tool calling + usage tracking
import type { ChatMessage, LLMModel, TokenUsage } from '@/types'
import type { StreamOptions } from '../provider'
import type { FunctionDeclaration } from '../tools'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

function toOpenAITools(decls: FunctionDeclaration[]): unknown[] {
  return decls.map((d) => ({
    type: 'function',
    function: {
      name: d.name,
      description: d.description,
      parameters: d.parameters ?? { type: 'object', properties: {} },
    },
  }))
}

function buildOpenAIMessages(messages: ChatMessage[], system: string): unknown[] {
  return [
    { role: 'system', content: system },
    ...messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    })),
  ]
}

export class OpenAIProvider {
  private model: LLMModel

  constructor(model: LLMModel) {
    this.model = model
  }

  private getApiKey(): string {
    if (this.model.api_key_override) return this.model.api_key_override
    const envKey = this.model.api_key_env ?? 'OPENAI_API_KEY'
    return process.env[envKey] ?? process.env.OPENAI_API_KEY ?? ''
  }

  async streamChat(
    messages: ChatMessage[],
    options: StreamOptions,
    onUsage: (usage: TokenUsage) => void | Promise<void>
  ): Promise<ReadableStream> {
    const encoder = new TextEncoder()
    const initialMessages = buildOpenAIMessages(messages, options.systemInstruction)

    return new ReadableStream({
      start: async (controller) => {
        try {
          await this.runLoop(
            initialMessages, options, this.getApiKey(),
            controller, encoder, onUsage,
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
    apiKey: string,
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder,
    onUsage: (usage: TokenUsage) => void | Promise<void>,
    usage: { inputTokens: number; outputTokens: number }
  ): Promise<void> {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model.model_id,
        messages: oaiMessages,
        stream: true,
        stream_options: { include_usage: true },
        temperature: options.temperature,
        max_tokens: options.maxOutputTokens,
        tools: options.toolDeclarations.length > 0 ? toOpenAITools(options.toolDeclarations) : undefined,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`OpenAI API error ${response.status}: ${err}`)
    }

    if (!response.body) throw new Error('OpenAI API returned no response body')
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    // Accumulate incremental tool call parts indexed by tool_calls[].index
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

        // usage comes in the final chunk when stream_options.include_usage=true
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

    // If model requested tool calls, send results and continue streaming
    if (finishReason === 'tool_calls' && toolAccum.size > 0) {
      const toolCallsForMsg: unknown[] = []
      const toolResultMsgs: unknown[] = []

      for (const [, tc] of toolAccum) {
        let parsedArgs: Record<string, unknown> = {}
        try { parsedArgs = JSON.parse(tc.args) } catch { /* ignore partial json */ }

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
      await this.runLoop(nextMessages, options, apiKey, controller, encoder, onUsage, usage)
      return
    }

    onUsage({ inputTokens: usage.inputTokens, outputTokens: usage.outputTokens })
  }
}
