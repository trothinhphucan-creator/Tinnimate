import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/require-admin'
import type { AdminConfig } from '@/types'

// GET /api/admin/config
export async function GET() {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const serviceClient = createServiceClient()
    const { data, error: dbError } = await serviceClient
      .from('admin_config')
      .select('*')
      .limit(1)
      .single()

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 })

    return Response.json(data as AdminConfig)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}

// PUT /api/admin/config
export async function PUT(request: Request) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const body = await request.json() as Partial<AdminConfig>

    // Get current config id
    const serviceClient = createServiceClient()
    const { data: current, error: fetchError } = await serviceClient
      .from('admin_config')
      .select('id')
      .limit(1)
      .single()

    if (fetchError || !current) {
      return Response.json({ error: 'Config not found' }, { status: 404 })
    }

    // Partial update — only provided fields
    const updates: Partial<AdminConfig> & { updated_at: string } = {
      ...body,
      updated_at: new Date().toISOString(),
    }
    delete (updates as Partial<AdminConfig>).id

    const { data, error: updateError } = await serviceClient
      .from('admin_config')
      .update(updates)
      .eq('id', current.id)
      .select()
      .single()

    if (updateError) return Response.json({ error: updateError.message }, { status: 500 })

    return Response.json(data as AdminConfig)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
