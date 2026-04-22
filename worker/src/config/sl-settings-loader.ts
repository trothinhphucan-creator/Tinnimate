/**
 * sl-settings-loader.ts
 *
 * Load social listening LLM config from DB (sl_settings table).
 * Caches for 5 minutes to avoid repeated DB calls per job.
 * Falls back to hardcoded defaults if DB unavailable.
 */

import { getSupabaseServiceClient } from '../db/supabase-service-role-client.js'
import { REPLY_SYSTEM_PROMPT, CLASSIFY_SYSTEM_PROMPT, COMMENT_CLASSIFY_SYSTEM_PROMPT } from '../pipeline/prompts/ai-prompts.js'
import { logger } from '../lib/pino-structured-logger.js'

export type SlSettings = {
  llm_provider: 'gemini' | 'openai' | 'anthropic'
  model_id: string
  temperature: number
  max_tokens: number
  reply_system_prompt: string
  classify_system_prompt: string
  comment_classify_prompt: string
}

const DEFAULT_SETTINGS: SlSettings = {
  llm_provider: 'gemini',
  model_id: 'gemini-2.5-flash-preview-04-17',
  temperature: 0.7,
  max_tokens: 300,
  reply_system_prompt: REPLY_SYSTEM_PROMPT,
  classify_system_prompt: CLASSIFY_SYSTEM_PROMPT,
  comment_classify_prompt: COMMENT_CLASSIFY_SYSTEM_PROMPT,
}

// ── 5-minute in-memory cache ────────────────────────────────────────────────
let _cache: SlSettings | null = null
let _cacheExpiry = 0
const CACHE_TTL_MS = 5 * 60 * 1000  // 5 minutes

export async function getSlSettings(): Promise<SlSettings> {
  const now = Date.now()
  if (_cache && now < _cacheExpiry) return _cache

  try {
    const db = getSupabaseServiceClient()
    const { data, error } = await db
      .from('sl_settings')
      .select('llm_provider, model_id, temperature, max_tokens, reply_system_prompt, classify_system_prompt, comment_classify_prompt')
      .eq('id', 'default')
      .single()

    if (error || !data) {
      logger.warn({ err: error?.message }, 'sl_settings not found — using defaults')
      return DEFAULT_SETTINGS
    }

    const settings = data as unknown as SlSettings
    _cache = settings
    _cacheExpiry = now + CACHE_TTL_MS
    return settings
  } catch (err) {
    logger.warn({ err: (err as Error).message }, 'Failed to load sl_settings — using defaults')
    return DEFAULT_SETTINGS
  }
}

/** Force-invalidate cache (call after admin saves settings) */
export function invalidateSlSettingsCache() {
  _cache = null
  _cacheExpiry = 0
}
