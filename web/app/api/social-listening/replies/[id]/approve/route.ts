import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { workerClient } from '@/lib/social-listening/worker-client'

async function getAdminDb() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
}

// POST /api/social-listening/replies/[id]/approve
// Sends the reply to Facebook via worker, then marks as POSTED
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const db = await getAdminDb()

  // Optimistically mark as APPROVED
  await db.from('fb_replies').update({ status: 'APPROVED' }).eq('id', id)

  try {
    await workerClient.postReply(id)
    await db
      .from('fb_replies')
      .update({ status: 'POSTED', posted_at: new Date().toISOString() })
      .eq('id', id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    // Rollback to DRAFT on worker failure
    await db
      .from('fb_replies')
      .update({ status: 'DRAFT', last_error: (err as Error).message })
      .eq('id', id)
    return NextResponse.json({ error: (err as Error).message }, { status: 502 })
  }
}
