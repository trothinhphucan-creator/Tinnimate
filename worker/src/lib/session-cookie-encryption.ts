/**
 * AES-256-GCM encryption cho Facebook session cookie.
 *
 * Format ciphertext: [iv 12 bytes][authTag 16 bytes][encrypted bytes]
 * Key: 32 bytes (hex từ env FB_SESSION_ENC_KEY).
 *
 * Playwright `BrowserContext.storageState()` trả về object JSON.
 * Flow: stringify -> encrypt -> lưu bytea vào fb_pages.session_cookie_enc.
 * Load: read bytea -> decrypt -> parse JSON -> pass vào `storageState` option.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { env } from '../config/environment-schema.js'

const ALG = 'aes-256-gcm'
const IV_LEN = 12
const TAG_LEN = 16

function getKey(): Buffer {
  return Buffer.from(env.FB_SESSION_ENC_KEY, 'hex')
}

export function encryptSessionState(stateJson: string): Buffer {
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv(ALG, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(stateJson, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted])
}

export function decryptSessionState(blob: Buffer): string {
  if (blob.length < IV_LEN + TAG_LEN + 1) {
    throw new Error('Encrypted session blob is too short / malformed')
  }
  const iv = blob.subarray(0, IV_LEN)
  const tag = blob.subarray(IV_LEN, IV_LEN + TAG_LEN)
  const data = blob.subarray(IV_LEN + TAG_LEN)
  const decipher = createDecipheriv(ALG, getKey(), iv)
  decipher.setAuthTag(tag)
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()])
  return decrypted.toString('utf8')
}

// Typed convenience wrapper: encrypt a Playwright storageState object.
export function encryptStorageState(state: unknown): Buffer {
  return encryptSessionState(JSON.stringify(state))
}

export function decryptStorageState<T = unknown>(blob: Buffer): T {
  return JSON.parse(decryptSessionState(blob)) as T
}
