/**
 * Smoke test: AES-256-GCM encrypt → decrypt round-trip cho session cookie blob.
 * Run: npm run smoke:crypto
 */

import {
  decryptStorageState,
  encryptStorageState,
} from '../src/lib/session-cookie-encryption.js'
import { logger } from '../src/lib/pino-structured-logger.js'

type FakeStorageState = {
  cookies: Array<{ name: string; value: string; domain: string; path: string }>
  origins: Array<{ origin: string; localStorage: Array<{ name: string; value: string }> }>
}

async function main() {
  const fake: FakeStorageState = {
    cookies: [
      { name: 'c_user', value: '123456789012345', domain: '.facebook.com', path: '/' },
      { name: 'xs', value: 'abc|def|ghi|jkl', domain: '.facebook.com', path: '/' },
    ],
    origins: [
      {
        origin: 'https://www.facebook.com',
        localStorage: [{ name: 'LastUpdated', value: String(Date.now()) }],
      },
    ],
  }

  const blob = encryptStorageState(fake)
  logger.info({ bytes: blob.length }, 'Encrypted')

  const back = decryptStorageState<FakeStorageState>(blob)
  const ok =
    back.cookies.length === fake.cookies.length &&
    back.cookies[0].value === fake.cookies[0].value &&
    back.origins[0].localStorage[0].name === fake.origins[0].localStorage[0].name

  if (!ok) {
    logger.error({ back }, 'Round-trip mismatch')
    process.exit(1)
  }

  // Tamper test: đổi 1 byte → decrypt phải throw.
  const tampered = Buffer.from(blob)
  tampered[30] ^= 0xff
  try {
    decryptStorageState(tampered)
    logger.error('Tamper not detected — auth tag check failed!')
    process.exit(1)
  } catch {
    logger.info('Tamper correctly rejected by GCM auth tag')
  }

  logger.info('Crypto round-trip smoke test OK')
}

main().catch((err) => {
  logger.error({ err: err instanceof Error ? err.message : err }, 'Crypto smoke test FAILED')
  process.exit(1)
})
