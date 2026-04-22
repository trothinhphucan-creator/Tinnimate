import { NextResponse } from 'next/server'
import { workerClient } from '@/lib/social-listening/worker-client'

// GET /api/social-listening/pages/[id]/login-status?loginId=xxx
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await params // consume
  const { searchParams } = new URL(req.url)
  const loginId = searchParams.get('loginId')

  if (!loginId) {
    return NextResponse.json({ error: 'loginId required' }, { status: 400 })
  }

  try {
    const status = await workerClient.getLoginStatus(loginId)
    return NextResponse.json(status)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 })
  }
}
