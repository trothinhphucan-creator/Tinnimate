import { createClient, createServiceClient } from '@/lib/supabase/server'
import { streamChat } from '@/lib/ai/gemini'
import { getAdminConfig } from '@/lib/ai/config-loader'
import type { ChatMessage, SubscriptionTier, TokenUsage } from '@/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isTrainingMode = request.headers.get('X-Training-Mode') === 'true'
      && user.app_metadata?.is_admin === true

    // 2. Rate limit check (skip in training mode)
    if (!isTrainingMode) {
      const adminConfig = await getAdminConfig()

      // Get user's subscription tier from profile
      const serviceClient = createServiceClient()
      const { data: profile } = await serviceClient
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single()

      const tier = (profile?.subscription_tier ?? 'free') as SubscriptionTier
      const tierLimits = adminConfig.rate_limits[tier]

      if (tierLimits.chat !== -1) {
        // Count today's user messages via conversations
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        const { data: userConvIds } = await serviceClient
          .from('conversations')
          .select('id')
          .eq('user_id', user.id)

        const convIds = (userConvIds ?? []).map((c: { id: string }) => c.id)

        let count = 0
        if (convIds.length > 0) {
          const { count: msgCount } = await serviceClient
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .in('conversation_id', convIds)
            .eq('role', 'user')
            .gte('created_at', todayStart.toISOString())
          count = msgCount ?? 0
        }

        if (count >= tierLimits.chat) {
          return Response.json(
            { error: 'Rate limit reached', limit: tierLimits.chat },
            { status: 429 }
          )
        }
      }
    }

    // 3. Parse request body
    const body = await request.json() as { messages: ChatMessage[]; conversationId?: string; lang?: string }
    const { messages, lang } = body
    let { conversationId } = body

    const serviceClient = createServiceClient()

    // 4. Create conversation if none provided
    if (!conversationId) {
      const { data: conv, error: convError } = await serviceClient
        .from('conversations')
        .insert({ user_id: user.id })
        .select('id')
        .single()

      if (convError || !conv) {
        return Response.json({ error: 'Failed to create conversation' }, { status: 500 })
      }
      conversationId = conv.id
    }

    // 5. Save user message to DB
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'user') {
      await serviceClient.from('messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: lastMessage.content,
      })
    }

    // 6. Build usage-logging callback (fire-and-forget, non-critical)
    const capturedUserId = user.id
    const capturedConvId = conversationId
    const onUsage = async (usage: TokenUsage) => {
      try {
        const cfg = await getAdminConfig()
        const { data: modelRow } = await serviceClient
          .from('llm_models')
          .select('input_cost_per_1m, output_cost_per_1m, provider')
          .eq('model_id', cfg.ai_model)
          .maybeSingle()
        await serviceClient.from('usage_logs').insert({
          user_id: capturedUserId,
          conversation_id: capturedConvId,
          model_id: cfg.ai_model,
          provider: modelRow?.provider ?? 'gemini',
          input_tokens: usage.inputTokens,
          output_tokens: usage.outputTokens,
          input_cost_usd: (usage.inputTokens / 1_000_000) * (modelRow?.input_cost_per_1m ?? 0),
          output_cost_usd: (usage.outputTokens / 1_000_000) * (modelRow?.output_cost_per_1m ?? 0),
          is_training: isTrainingMode,
        })
      } catch { /* usage logging is non-critical */ }
    }

    // 7. Stream AI response
    const stream = await streamChat(messages, { training: isTrainingMode, onUsage, lang: lang ?? 'vi' })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        // Send conversationId first
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ conversationId })}\n\n`)
        )

        let fullContent = ''
        const reader = stream.getReader()
        const decoder = new TextDecoder()

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            // Forward raw SSE bytes to client
            controller.enqueue(value)

            // Parse for DB side-effects
            const text = decoder.decode(value)
            for (const line of text.split('\n').filter(l => l.startsWith('data: '))) {
              try {
                const chunk = JSON.parse(line.slice(6))
                if (chunk.type === 'text' && chunk.content) fullContent += chunk.content
                if (chunk.type === 'tool_call') {
                  await serviceClient.from('messages').insert({
                    conversation_id: conversationId,
                    role: 'tool',
                    content: JSON.stringify(chunk),
                  })

                  // Persist training notes when AI calls save_training_note in training mode
                  if (isTrainingMode && chunk.name === 'save_training_note') {
                    const { title, content: noteContent, category } = chunk.args as {
                      title: string; content: string; category: string
                    }
                    const { data: note } = await serviceClient
                      .from('training_notes')
                      .insert({ title, content: noteContent, category: category ?? 'general' })
                      .select()
                      .single()
                    if (note) {
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: 'training_note_saved', note })}\n\n`)
                      )
                    }
                  }
                }
              } catch { /* skip malformed lines */ }
            }
          }

          // Save assistant message
          if (fullContent) {
            await serviceClient.from('messages').insert({
              conversation_id: conversationId,
              role: 'assistant',
              content: fullContent,
            })
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : 'Stream error'
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`)
          )
        } finally {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
