// Server-side only — loads AdminConfig from Supabase with 60s module-level cache
import { AdminConfig } from '@/types'
import { createServiceClient } from '@/lib/supabase/server'

let cachedConfig: AdminConfig | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 60_000

export async function getAdminConfig(): Promise<AdminConfig> {
  const now = Date.now()

  // Return cached value if still fresh
  if (cachedConfig && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedConfig
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('admin_config')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    // Return cached stale value or throw
    if (cachedConfig) return cachedConfig
    throw new Error(`Failed to load AdminConfig: ${error?.message ?? 'no data'}`)
  }

  cachedConfig = data as AdminConfig
  cacheTimestamp = now
  return cachedConfig
}
