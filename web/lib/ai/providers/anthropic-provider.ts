// Anthropic provider — native fetch streaming with tool use + usage tracking
import type { ChatMessage, LLMModel, TokenUsage } from '@/types'
import type { StreamOptions } from '../provider'
import type { FunctionDeclaration } from '../tools'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

function toAnthropicTools(decls: FunctionDeclaration[]): unknown[] {
  return decls.map((d) => ({
    name: d.name,
    description: d.description,
    input_schema: d.parameters ?? { type: 'object', properties: {} },
  }))
}

function toAnthropicMessages(messages: ChatMessage[]): unknown[] {
  return messages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content,
  }))
}

type TextBlock = { type: 'text'; text: string }
type ToolUseBlock = { type: 'tool_use'; id: string; name: string; inputJson: string }
type ContentBlock = TextBlock | ToolUseBlock

export class AnthropicProvider {
  private model: LLMModel

  constructor(model: LLMModel) {
    this.model = model
  }

  private getApiKey(): string {
    if (this.model.api_key_override) return this.model.api_key_override
    const envKey = this.model.api_key_env ?? 'ANTHROPIC_API_KEY'
    return process.env[envKey] ?? process.env.ANTHROPIC_API_KEY ?? ''
  }

  async streamChat(
    messages: ChatMessage[],
    options: StreamOptions,
    onUsage: (usage: TokenUsage) => void | Promise<void>
  ): Promise<ReadableStream> {
    const encoder = new TextEncoder()

    return new ReadableStream({
      start: async (controller) => {
        try {
          await this.runLoop(
            toAnthropicMessages(messages), options, this.getApiKey(),
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
    anthropicMessages: unknown[],
    options: StreamOptions,
    apiKey: string,
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder,
    onUsage: (usage: TokenUsage) => void | Promise<void>,
    usage: { inputTokens: number; outputTokens: number }
  ): Promise<void> {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model.model_id,
        system: options.systemInstruction,
        messages: anthropicMessages,
        stream: true,
        max_tokens: options.maxOutputTokens,
        temperature: options.temperature,
        tools: options.toolDeclarations.length > 0 ? toAnthropicTools(options.toolDeclarations) : undefined,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Anthropic API error ${response.status}: ${err}`)
    }

    if (!response.body) throw new Error('Anthropic API returned no response body')
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    const blocks = new Map<number, ContentBlock>()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      for (const line of decoder.decode(value).split('\n')) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data: ')) continue
        let event: Record<string, unknown>
        try { event = JSON.parse(trimmed.slice(6)) } catch { continue }

        const type = event.type as string

        if (type === 'message_start') {
          const msg = event.message as { usage?: { input_tokens?: number } }
          usage.inputTokens += msg?.usage?.input_tokens ?? 0
        }

        if (type === 'content_block_start') {
          const idx = event.index as number
          const cb = event.content_block as { type: string; id?: string; name?: string }
          if (cb.type === 'text') {
            blocks.set(idx, { type: 'text', text: '' })
          } else if (cb.type === 'tool_use') {
            blocks.set(idx, { type: 'tool_use', id: cb.id ?? '', name: cb.name ?? '', inputJson: '' })
          }
        }

        if (type === 'content_block_delta') {
          const idx = event.index as number
          const delta = event.delta as { type: string; text?: string; partial_json?: string }
          const block = blocks.get(idx)
          if (block?.type === 'text' && delta.text) {
            block.text += delta.text
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'text', content: delta.text })}\n`)
            )
          } else if (block?.type === 'tool_use' && delta.partial_json) {
            block.inputJson += delta.partial_json
          }
        }

        if (type === 'message_delta') {
          const usageDelta = event.usage as { output_tokens?: number }
          usage.outputTokens += usageDelta?.output_tokens ?? 0
        }
      }
    }

    // Collect tool_use blocks for multi-turn continuation
    const toolUseBlocks: ToolUseBlock[] = []
    for (const [, block] of blocks) {
      if (block.type === 'tool_use') toolUseBlocks.push(block)
    }

    if (toolUseBlocks.length > 0) {
      const toolResults: unknown[] = []
      for (const tu of toolUseBlocks) {
        let parsedInput: Record<string, unknown> = {}
        try { parsedInput = JSON.parse(tu.inputJson) } catch { /* partial json */ }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'tool_call', name: tu.name, args: parsedInput })}\n`)
        )
        toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content: JSON.stringify({ success: true }) })
      }

      // Build assistant message content array from streamed blocks
      const assistantContent: unknown[] = []
      for (const [, block] of blocks) {
        if (block.type === 'text' && block.text) {
          assistantContent.push({ type: 'text', text: block.text })
        } else if (block.type === 'tool_use') {
          let parsedInput: Record<string, unknown> = {}
          try { parsedInput = JSON.parse(block.inputJson) } catch { /* partial */ }
          assistantContent.push({ type: 'tool_use', id: block.id, name: block.name, input: parsedInput })
        }
      }

      const nextMessages = [
        ...anthropicMessages,
        { role: 'assistant', content: assistantContent },
        { role: 'user', content: toolResults },
      ]
      await this.runLoop(nextMessages, options, apiKey, controller, encoder, onUsage, usage)
      return
    }

    onUsage({ inputTokens: usage.inputTokens, outputTokens: usage.outputTokens })
  }
}
