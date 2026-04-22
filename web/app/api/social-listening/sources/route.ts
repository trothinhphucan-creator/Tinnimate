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

// GET /api/social-listening/sources
export async function GET() {
  const db = await getAdminDb()
  const { data, error } = await db
    .from('fb_target_sources')
    .select('id, type, label, fb_url, keywords, enabled, last_scraped_at, page_id')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sources: data })
}

// POST /api/social-listening/sources
export async function POST(req: Request) {
  const body = (await req.json()) as {
    label?: string
    type?: string
    fb_url?: string
    keywords?: string[]
    page_id?: string
  }

  if (!body.label || !body.type) {
    return NextResponse.json({ error: 'label and type required' }, { status: 400 })
  }

  const db = await getAdminDb()
  const { data, error } = await db
    .from('fb_target_sources')
    .insert({
      label: body.label,
      type: body.type,
      fb_url: body.fb_url ?? null,
      keywords: body.keywords ?? [],
      page_id: body.page_id ?? null,
      enabled: true,
    })
    .select('id, label, type, enabled')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ source: data }, { status: 201 })
}

// PATCH /api/social-listening/sources  Body: { id, ...updates }
export async function PATCH(req: Request) {
  const { id, ...updates } = (await req.json()) as { id?: string; [k: string]: unknown }
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const db = await getAdminDb()
  const allowed = ['label', 'fb_url', 'keywords', 'enabled', 'page_id']
  const safeUpdates = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowed.includes(k)),
  )

  const { error } = await db.from('fb_target_sources').update(safeUpdates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE /api/social-listening/sources?id=xxx
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const db = await getAdminDb()
  const { error } = await db.from('fb_target_sources').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
