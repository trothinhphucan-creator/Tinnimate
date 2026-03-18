// CRUD API for llm_models — GET/POST/PUT/DELETE, admin only
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/require-admin'
import type { LLMModel } from '@/types'

const VALID_PROVIDERS = ['gemini', 'openai', 'anthropic'] as const

// GET /api/admin/models — list all models ordered by sort_order
export async function GET() {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const serviceClient = createServiceClient()
    const { data, error: dbError } = await serviceClient
      .from('llm_models')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 })
    return Response.json(data ?? [])
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

// POST /api/admin/models — create new model
export async function POST(request: Request) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const body = await request.json() as Partial<LLMModel>
    const { name, model_id, provider, api_key_env, api_key_override, context_window,
      max_output_tokens, input_cost_per_1m, output_cost_per_1m, notes, sort_order } = body

    if (!name || !model_id || !provider) {
      return Response.json({ error: 'name, model_id, provider are required' }, { status: 400 })
    }
    if (typeof name !== 'string' || name.length > 100) {
      return Response.json({ error: 'name must be a string under 100 characters' }, { status: 400 })
    }
    if (typeof model_id !== 'string' || model_id.length > 100) {
      return Response.json({ error: 'model_id must be a string under 100 characters' }, { status: 400 })
    }
    if (!VALID_PROVIDERS.includes(provider as typeof VALID_PROVIDERS[number])) {
      return Response.json({ error: `provider must be one of: ${VALID_PROVIDERS.join(', ')}` }, { status: 400 })
    }

    const serviceClient = createServiceClient()
    const { data, error: dbError } = await serviceClient
      .from('llm_models')
      .insert({
        name, model_id, provider,
        api_key_env: api_key_env ?? null,
        api_key_override: api_key_override ?? null,
        context_window: context_window ?? 32768,
        max_output_tokens: max_output_tokens ?? 8192,
        input_cost_per_1m: input_cost_per_1m ?? 0,
        output_cost_per_1m: output_cost_per_1m ?? 0,
        notes: notes ?? null,
        sort_order: sort_order ?? 99,
        is_active: true,
      })
      .select()
      .single()

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 })
    return Response.json(data as LLMModel, { status: 201 })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

// PUT /api/admin/models — update model fields (id required in body)
export async function PUT(request: Request) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const body = await request.json() as Partial<LLMModel> & { id: string }
    const { id, ...updates } = body
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

    // Prevent changing provider or model_id after creation (would break usage_logs linkage)
    delete (updates as Partial<LLMModel>).created_at

    const serviceClient = createServiceClient()
    const { data, error: dbError } = await serviceClient
      .from('llm_models')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 })
    return Response.json(data as LLMModel)
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

// DELETE /api/admin/models — delete model; blocked if it is the currently active model
export async function DELETE(request: Request) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const { id } = await request.json() as { id: string }
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

    const serviceClient = createServiceClient()

    // Guard: refuse if this model is currently active in admin_config
    const [{ data: config }, { data: model }] = await Promise.all([
      serviceClient.from('admin_config').select('ai_model').limit(1).single(),
      serviceClient.from('llm_models').select('model_id').eq('id', id).single(),
    ])
    if (config?.ai_model && model?.model_id && config.ai_model === model.model_id) {
      return Response.json({ error: 'Cannot delete the currently active model. Switch to another model first.' }, { status: 400 })
    }

    const { error: dbError } = await serviceClient.from('llm_models').delete().eq('id', id)
    if (dbError) return Response.json({ error: dbError.message }, { status: 500 })
    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
