/**
 * Environment variables schema cho worker.
 * Load một lần, validate bằng zod, expose typed `env` object.
 */

import 'dotenv/config'
import { z } from 'zod'

const EnvSchema = z.object({
  // Node runtime
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // HTTP server (worker API — admin web gọi vào)
  WORKER_HTTP_PORT: z.coerce.number().int().positive().default(4100),
  WORKER_SHARED_SECRET: z.string().min(16, 'WORKER_SHARED_SECRET must be at least 16 chars'),

  // Supabase (service_role, bypass RLS)
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),

  // Redis for BullMQ
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Gemini
  GEMINI_API_KEY: z.string().min(20),
  GEMINI_MODEL_CLASSIFY: z.string().default('gemini-2.5-flash'),
  GEMINI_MODEL_REPLY: z.string().default('gemini-2.5-flash'),
  GEMINI_MODEL_VISION: z.string().default('gemini-2.5-flash'),

  // AgentSee MCP
  AGENTSEE_MCP_URL: z.string().url(),
  AGENTSEE_INTERNAL_KEY: z.string().min(16),

  // Session cookie encryption (AES-256-GCM)
  FB_SESSION_ENC_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, 'FB_SESSION_ENC_KEY must be 64 hex chars (32 bytes)'),

  // Scrape behavior
  SCRAPE_CRON: z.string().default('0 8,14,20 * * *'), // 8am, 2pm, 8pm VN time
  SCRAPE_MAX_POSTS_PER_SOURCE: z.coerce.number().int().positive().default(30),
  SCRAPE_DELAY_MIN_MS: z.coerce.number().int().positive().default(3000),
  SCRAPE_DELAY_MAX_MS: z.coerce.number().int().positive().default(8000),

  // Reply auto-post threshold (Phase 3 future — default disabled)
  REPLY_AUTO_POST_ENABLED: z.coerce.boolean().default(false),
  REPLY_AUTO_POST_MIN_CONFIDENCE: z.coerce.number().min(0).max(1).default(0.9),

  // Monitoring
  ALERT_TELEGRAM_BOT_TOKEN: z.string().optional(),
  ALERT_TELEGRAM_CHAT_ID: z.string().optional(),
})

export type WorkerEnv = z.infer<typeof EnvSchema>

function parseEnv(): WorkerEnv {
  const result = EnvSchema.safeParse(process.env)
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    throw new Error(`Invalid worker environment:\n${issues}`)
  }
  return result.data
}

export const env: WorkerEnv = parseEnv()

export const isProduction = env.NODE_ENV === 'production'
