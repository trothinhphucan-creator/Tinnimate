import { isValidUUID, invalidId } from '@/lib/social-listening/validate-id'
import { NextResponse } from 'next/server'
import { workerClient } from '@/lib/social-listening/worker-client'

// POST /api/social-listening/pages/[id]/logout
// Đánh dấu fanpage LOGGED_OUT (không xóa session cookie — admin có thể relogin lại).
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!isValidUUID(id)) return invalidId()
  try {
    const result = await workerClient.pageLogout(id)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 })
  }
}
