import { requireAdmin } from '@/lib/social-listening/require-admin'
import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase/admin-client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adminDb = () => getAdminSupabase() as any

// GET /api/social-listening/pages
export async function GET() {
  const guard = await requireAdmin(); if (guard) return guard

  try {
    const db = getAdminSupabase()
    const { data, error } = await db
      .from('fb_pages')
      .select('id, label, fb_user_id, status, last_active_at, last_error, fb_page_url')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ pages: data })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/social-listening/pages  Body: { label: string }
export async function POST(req: Request) {
  const guard = await requireAdmin(); if (guard) return guard

  try {
    const { label } = (await req.json()) as { label?: string }
    if (!label?.trim()) {
      return NextResponse.json({ error: 'label required' }, { status: 400 })
    }

    const db = adminDb()
    const { data, error } = await db
      .from('fb_pages')
      .insert({ label: label.trim(), status: 'IDLE' })
      .select('id, label, status')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ page: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
