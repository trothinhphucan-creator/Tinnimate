import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getAdminDb() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
}

// POST /api/social-listening/replies/[id]/reject
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const db = await getAdminDb()
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
  const { id } = await params
  const { draft_text, page_id } = (await req.json()) as {
    draft_text?: string
    page_id?: string
  }

  if (!draft_text?.trim()) {
    return NextResponse.json({ error: 'draft_text required' }, { status: 400 })
  }

  const db = await getAdminDb()
  const updates: Record<string, unknown> = {
    draft_text: draft_text.trim(),
    status: 'DRAFT', // reset to DRAFT after edit
  }
  if (page_id) updates.page_id = page_id

  const { error } = await db.from('fb_replies').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
