import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/require-admin'
import type { SystemPrompt } from '@/types'

const VALID_PROMPT_NAMES = ['main', 'empathy', 'diagnosis', 'therapy', 'safety'] as const

// GET /api/admin/prompts — list all, grouped by name
export async function GET() {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const serviceClient = createServiceClient()
    const { data, error: dbError } = await serviceClient
      .from('system_prompts')
      .select('*')
      .order('name', { ascending: true })
      .order('version', { ascending: false })

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 })

    // Group by name
    const grouped = (data as SystemPrompt[]).reduce<Record<string, SystemPrompt[]>>((acc, prompt) => {
      if (!acc[prompt.name]) acc[prompt.name] = []
      acc[prompt.name].push(prompt)
      return acc
    }, {})

    return Response.json(grouped)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}

// POST /api/admin/prompts — create new prompt, auto-increment version for same name
export async function POST(request: Request) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const body = await request.json() as { name: string; content: string; notes?: string }
    const { name, content, notes } = body

    if (!name || !content) {
      return Response.json({ error: 'name and content are required' }, { status: 400 })
    }
    if (!VALID_PROMPT_NAMES.includes(name as typeof VALID_PROMPT_NAMES[number])) {
      return Response.json({ error: `name must be one of: ${VALID_PROMPT_NAMES.join(', ')}` }, { status: 400 })
    }
    if (typeof content !== 'string' || content.length > 100000) {
      return Response.json({ error: 'content must be a string under 100,000 characters' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // Find current max version for this name
    const { data: existing } = await serviceClient
      .from('system_prompts')
      .select('version')
      .eq('name', name)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    const nextVersion = existing ? existing.version + 1 : 1

    const { data, error: dbError } = await serviceClient
      .from('system_prompts')
      .insert({ name, content, version: nextVersion, is_active: false, notes: notes ?? null })
      .select()
      .single()

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 })

    return Response.json(data as SystemPrompt, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}

// PUT /api/admin/prompts — activate a version by id
export async function PUT(request: Request) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const body = await request.json() as { id: string }
    if (!body.id) return Response.json({ error: 'id is required' }, { status: 400 })

    const serviceClient = createServiceClient()

    // Get the prompt to find its name
    const { data: target, error: fetchError } = await serviceClient
      .from('system_prompts')
      .select('id, name')
      .eq('id', body.id)
      .single()

    if (fetchError || !target) return Response.json({ error: 'Prompt not found' }, { status: 404 })

    // Deactivate all with same name, then activate target
    await serviceClient
      .from('system_prompts')
      .update({ is_active: false })
      .eq('name', target.name)

    const { data, error: activateError } = await serviceClient
      .from('system_prompts')
      .update({ is_active: true })
      .eq('id', body.id)
      .select()
      .single()

    if (activateError) return Response.json({ error: activateError.message }, { status: 500 })

    return Response.json(data as SystemPrompt)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/admin/prompts?id=X
export async function DELETE(request: Request) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

    const serviceClient = createServiceClient()
    const { error: dbError } = await serviceClient
      .from('system_prompts')
      .delete()
      .eq('id', id)

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 })

    return Response.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
