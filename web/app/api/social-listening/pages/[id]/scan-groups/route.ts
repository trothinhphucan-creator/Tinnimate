import { NextResponse } from 'next/server'
import { workerClient } from '@/lib/social-listening/worker-client'

// GET /api/social-listening/pages/[id]/scan-groups
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  try {
    const result = await workerClient.scanGroups(id)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 })
  }
}
