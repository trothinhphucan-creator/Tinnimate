import { requireAdmin } from '@/lib/social-listening/require-admin'
import { isValidUUID, invalidId } from '@/lib/social-listening/validate-id'
import { NextResponse } from 'next/server'
import { workerClient } from '@/lib/social-listening/worker-client'

// GET /api/social-listening/pages/[id]/scan-groups
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin(); if (guard) return guard

  const { id } = await params
  if (!isValidUUID(id)) return invalidId()
  try {
    const result = await workerClient.scanGroups(id)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 })
  }
}
