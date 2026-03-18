import { createServiceClient } from '@/lib/supabase/server'

// GET /api/pricing-config — public endpoint (no auth required) to fetch plan data
export async function GET() {
  try {
    const sc = createServiceClient()
    const { data, error } = await sc
      .from('admin_config')
      .select('pricing_config')
      .limit(1)
      .single()

    if (error || !data) {
      return Response.json({ pricing_config: null })
    }

    // Strip sensitive gateway credentials before sending to client
    const config = (data as { pricing_config: Record<string, unknown> }).pricing_config
    if (config && typeof config === 'object' && 'gateways' in config) {
      const gateways = config.gateways as Record<string, Record<string, unknown>>
      const safeGateways: Record<string, { enabled: boolean }> = {}
      for (const [key, value] of Object.entries(gateways)) {
        safeGateways[key] = { enabled: Boolean(value.enabled) }
      }
      return Response.json({
        pricing_config: {
          ...config,
          gateways: safeGateways,
        },
      })
    }

    return Response.json({ pricing_config: config })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
