/**
 * Structured logger dùng chung cho worker.
 * Production: JSON (journald/Loki friendly).
 * Dev: pretty print để đọc bằng mắt.
 */

import pino from 'pino'
import { env, isProduction } from '../config/environment-schema.js'

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'fb-worker' },
  transport: isProduction
    ? undefined
    : {
        target: 'pino/file',
        options: { destination: 1 }, // stdout
      },
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
})

export function childLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings)
}
