import { requireAdmin } from '@/lib/social-listening/require-admin'
import { workerClient } from '@/lib/social-listening/worker-client'
import { NextResponse } from 'next/server'

// POST /api/social-listening/scrape-now
export async function POST() {
  const guard = await requireAdmin(); if (guard) return guard
  try {
    const result = await workerClient.triggerScrapeNow()
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 })
  }
}
