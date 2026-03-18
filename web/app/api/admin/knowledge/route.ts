import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/require-admin'
import { embedText } from '@/lib/ai/rag'
import type { KnowledgeDoc } from '@/types'

const VALID_CATEGORIES = ['medical', 'therapy', 'faq', 'general'] as const

// GET /api/admin/knowledge — list all docs (no embedding field)
export async function GET() {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const serviceClient = createServiceClient()
    const { data, error: dbError } = await serviceClient
      .from('knowledge_base')
      .select('id, title, content, category, is_active, created_at')
      .order('created_at', { ascending: false })

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 })

    return Response.json(data as KnowledgeDoc[])
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}

// POST /api/admin/knowledge — create doc with embedding
export async function POST(request: Request) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const body = await request.json() as { title: string; content: string; category: KnowledgeDoc['category'] }
    const { title, content, category } = body

    if (!title || !content || !category) {
      return Response.json({ error: 'title, content and category are required' }, { status: 400 })
    }
    if (typeof title !== 'string' || title.length > 500) {
      return Response.json({ error: 'title must be a string under 500 characters' }, { status: 400 })
    }
    if (typeof content !== 'string' || content.length > 50000) {
      return Response.json({ error: 'content must be a string under 50,000 characters' }, { status: 400 })
    }
    if (!VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
      return Response.json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` }, { status: 400 })
    }

    // Generate embedding
    const embedding = await embedText(content)

    const serviceClient = createServiceClient()
    const { data, error: dbError } = await serviceClient
      .from('knowledge_base')
      .insert({ title, content, category, embedding, is_active: true })
      .select('id, title, content, category, is_active, created_at')
      .single()

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 })

    return Response.json(data as KnowledgeDoc, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}

// PATCH /api/admin/knowledge — toggle is_active for id
export async function PATCH(request: Request) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const body = await request.json() as { id: string }
    if (!body.id) return Response.json({ error: 'id is required' }, { status: 400 })

    const serviceClient = createServiceClient()

    const { data: current, error: fetchError } = await serviceClient
      .from('knowledge_base')
      .select('is_active')
      .eq('id', body.id)
      .single()

    if (fetchError || !current) return Response.json({ error: 'Document not found' }, { status: 404 })

    const { data, error: dbError } = await serviceClient
      .from('knowledge_base')
      .update({ is_active: !current.is_active })
      .eq('id', body.id)
      .select('id, title, content, category, is_active, created_at')
      .single()

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 })

    return Response.json(data as KnowledgeDoc)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/admin/knowledge?id=X — soft delete
export async function DELETE(request: Request) {
  try {
    const { error, status } = await requireAdmin()
    if (error) return Response.json({ error }, { status })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

    const serviceClient = createServiceClient()
    const { error: dbError } = await serviceClient
      .from('knowledge_base')
      .update({ is_active: false })
      .eq('id', id)

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 })

    return Response.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
