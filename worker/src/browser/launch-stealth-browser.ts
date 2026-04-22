/**
 * Launch a stealth Chromium browser using playwright-extra + stealth plugin.
 * Hides WebDriver flags, navigator.webdriver, etc. mà Facebook dùng để detect bot.
 *
 * Usage:
 *   headful  = true  → dùng cho login lần đầu (cần GUI)
 *   headful  = false → dùng cho scrape định kỳ (headless)
 */

import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import type { Browser, BrowserContext, BrowserContextOptions } from 'playwright'
import { env } from '../config/environment-schema.js'
import { logger } from '../lib/pino-structured-logger.js'

// Apply stealth plugin once
chromium.use(StealthPlugin())

export type LaunchOptions = {
  headful?: boolean
  storageState?: BrowserContextOptions['storageState']
  userDataDir?: string // nếu dùng persistent context
}

/**
 * Launch browser + context với stealth settings.
 * Returns {browser, context} — caller chịu trách nhiệm close khi xong.
 */
export async function launchStealthBrowser(opts: LaunchOptions = {}): Promise<{
  browser: Browser
  context: BrowserContext
}> {
  const isHeadful = opts.headful ?? false

  logger.debug({ headful: isHeadful }, 'Launching stealth browser')

  const launchArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-blink-features=AutomationControlled',
    '--disable-infobars',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
    '--lang=vi-VN,vi,en-US,en',
    '--window-size=1280,720',
  ]

  // Thêm virtual display args khi headless trên server không có GUI
  if (isHeadful && process.env.DISPLAY) {
    logger.debug({ display: process.env.DISPLAY }, 'Using Xvfb display')
  }

  const browser = await chromium.launch({
    headless: !isHeadful,
    args: launchArgs,
    timeout: 60_000,
  })

  const contextOptions: Parameters<Browser['newContext']>[0] = {
    viewport: { width: 1280, height: 720 },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    geolocation: { latitude: 10.8231, longitude: 106.6297 }, // Hồ Chí Minh
    permissions: ['geolocation'],
    extraHTTPHeaders: {
      'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  }

  if (opts.storageState) {
    contextOptions.storageState = opts.storageState
  }

  const context = await browser.newContext(contextOptions)

  // Ẩn webdriver flag thông qua page script
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).chrome = { runtime: {} }
  })

  logger.debug('Stealth browser ready')
  return { browser, context }
}

/**
 * Random delay between min-max ms. Dùng giữa các action để tránh bot detection.
 */
export async function randomDelay(minMs?: number, maxMs?: number): Promise<void> {
  const min = minMs ?? env.SCRAPE_DELAY_MIN_MS
  const max = maxMs ?? env.SCRAPE_DELAY_MAX_MS
  const delay = Math.floor(Math.random() * (max - min + 1)) + min
  await new Promise((r) => setTimeout(r, delay))
}
