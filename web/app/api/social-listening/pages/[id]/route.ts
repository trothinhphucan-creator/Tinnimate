import { requireAdmin } from '@/lib/social-listening/require-admin'
import { isValidUUID, invalidId } from '@/lib/social-listening/validate-id'
import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase/admin-client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => getAdminSupabase() as any

// PATCH /api/social-listening/pages/[id]
// Body: { label?, fb_page_url? }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin(); if (guard) return guard

  const { id } = await params
  if (!isValidUUID(id)) return invalidId()
  const body = await req.json() as { label?: string; fb_page_url?: string }

  const updates: Record<string, string> = {}
  if (body.label?.trim()) updates.label = body.label.trim()
  if (body.fb_page_url !== undefined) updates.fb_page_url = body.fb_page_url.trim()

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data, error } = await db()
    .from('fb_pages')
    .update(updates)
    .eq('id', id)
    .select('id, label, fb_user_id, status, last_active_at, last_error, fb_page_url')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ page: data })
}

// DELETE /api/social-listening/pages/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin(); if (guard) return guard

  const { id } = await params
  if (!isValidUUID(id)) return invalidId()

  const { error } = await db()
    .from('fb_pages')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
