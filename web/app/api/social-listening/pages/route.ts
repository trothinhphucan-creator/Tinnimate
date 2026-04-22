import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Helper: admin-only Supabase server client
async function getAdminDb() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
}

// GET /api/social-listening/pages
export async function GET() {
  try {
    const db = await getAdminDb()
    const { data, error } = await db
      .from('fb_pages')
      .select('id, label, fb_user_id, status, last_active_at, last_error')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ pages: data })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/social-listening/pages  Body: { label: string }
export async function POST(req: Request) {
  try {
    const { label } = (await req.json()) as { label?: string }
    if (!label?.trim()) {
      return NextResponse.json({ error: 'label required' }, { status: 400 })
    }

    const db = await getAdminDb()
    const { data, error } = await db
      .from('fb_pages')
      .insert({ label: label.trim(), status: 'OFFLINE' })
      .select('id, label, status')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ page: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
