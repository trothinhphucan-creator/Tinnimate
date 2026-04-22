import { NextResponse } from 'next/server'
import { workerClient } from '@/lib/social-listening/worker-client'

// GET /api/social-listening/pages/[id]/login-screenshot?loginId=xxx
// Proxy PNG bytes từ worker — admin UI dùng cache-busting param ?ts=
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
    const buf = await workerClient.fetchLoginScreenshot(loginId)
    if (!buf) {
      return new NextResponse('No screenshot yet', { status: 404 })
    }
    // NextResponse expects Uint8Array/string; convert Buffer.
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 })
  }
}
