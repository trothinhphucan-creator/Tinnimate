import { NextResponse } from 'next/server'
import { workerClient } from '@/lib/social-listening/worker-client'
import { getAdminSupabase } from '@/lib/supabase/admin-client'

// POST /api/social-listening/pages/[id]/login-start
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  // Fetch page label from DB (admin client bypasses RLS)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = getAdminSupabase() as any
  const { data: page } = await db
    .from('fb_pages')
    .select('id, label')
    .eq('id', id)
    .single()

  if (!page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 })
  }

  try {
    const result = await workerClient.startLogin(id, (page as { label: string }).label)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 })
  }
}
