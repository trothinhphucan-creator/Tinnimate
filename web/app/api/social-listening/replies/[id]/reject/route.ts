import { requireAdmin } from '@/lib/social-listening/require-admin'
import { isValidUUID, invalidId } from '@/lib/social-listening/validate-id'
import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase/admin-client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adminDb = () => getAdminSupabase() as any

// POST /api/social-listening/replies/[id]/reject
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin(); if (guard) return guard

  const { id } = await params
  if (!isValidUUID(id)) return invalidId()
  const db = adminDb()
  const { error } = await db
    .from('fb_replies')
    .update({ status: 'REJECTED' })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// PATCH /api/social-listening/replies/[id]/edit  Body: { draft_text, page_id? }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin(); if (guard) return guard

  const { id } = await params
  if (!isValidUUID(id)) return invalidId()
  const { draft_text, page_id } = (await req.json()) as {
    draft_text?: string
    page_id?: string
  }

  if (!draft_text?.trim()) {
    return NextResponse.json({ error: 'draft_text required' }, { status: 400 })
  }

  const db = adminDb()
  const updates: Record<string, unknown> = {
    draft_text: draft_text.trim(),
    status: 'DRAFT', // reset to DRAFT after edit
  }
  if (page_id) updates.page_id = page_id

  const { error } = await db.from('fb_replies').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
