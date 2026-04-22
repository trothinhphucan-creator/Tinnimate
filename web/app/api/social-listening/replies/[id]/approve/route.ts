import { requireAdmin } from '@/lib/social-listening/require-admin'
import { NextResponse } from 'next/server'
import { workerClient } from '@/lib/social-listening/worker-client'
import { getAdminSupabase } from '@/lib/supabase/admin-client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adminDb = () => getAdminSupabase() as any

// POST /api/social-listening/replies/[id]/approve
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin(); if (guard) return guard

  const { id } = await params

  // UUID validation
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  const db = adminDb()

  // Atomic optimistic lock: only update if still DRAFT → prevents double-approve
  const { data: locked } = await db
    .from('fb_replies')
    .update({ status: 'APPROVED' })
    .eq('id', id)
    .eq('status', 'DRAFT')   // ← guard: only DRAFT can be approved
    .select('id')
    .single()

  if (!locked) {
    return NextResponse.json({ error: 'Already processing or not in DRAFT state' }, { status: 409 })
  }

  try {
    await workerClient.postReply(id)
    // Worker owns the POSTED state — don't overwrite it here
    return NextResponse.json({ ok: true })
  } catch (err) {
    // Only rollback if worker didn't already set POSTED (guards against network timeout after successful post)
    const { data: current } = await db.from('fb_replies').select('status').eq('id', id).single()
    if (current?.status === 'APPROVED') {
      await db
        .from('fb_replies')
        .update({ status: 'DRAFT', last_error: (err as Error).message })
        .eq('id', id)
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 502 })
  }
}
