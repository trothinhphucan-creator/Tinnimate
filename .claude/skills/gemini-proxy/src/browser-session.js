/**
 * browser-session.js
 * Manages a persistent Chromium browser session for gemini.google.com
 * Session is saved to disk so login is only needed once.
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SESSION_DIR = path.join(__dirname, '..', 'session');
const USER_DATA_DIR = path.join(SESSION_DIR, 'chromium-profile');

let browser = null;
let context = null;

async function launchBrowser({ headless = true } = {}) {
  if (browser && browser.isConnected()) return { browser, context };

  fs.mkdirSync(USER_DATA_DIR, { recursive: true });

  // Use persistent context so cookies/login are saved across restarts
  context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: true,  // always headless on server — use login.js --xvfb for initial login
    viewport: { width: 1280, height: 900 },
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  browser = context.browser();
  return { browser, context };
}

async function getPage() {
  const { context } = await launchBrowser({ headless: true });
  const pages = context.pages();
  if (pages.length > 0) return pages[0];
  return context.newPage();
}

async function getPageHeaded() {
  const { context } = await launchBrowser({ headless: false });
  const pages = context.pages();
  if (pages.length > 0) return pages[0];
  return context.newPage();
}

async function isLoggedIn() {
  try {
    const page = await getPage();
    await page.goto('https://gemini.google.com', { waitUntil: 'domcontentloaded', timeout: 20000 });
    // Check for login indicators
    const url = page.url();
    const isOnGemini = url.includes('gemini.google.com') && !url.includes('accounts.google.com');
    return isOnGemini;
  } catch {
    return false;
  }
}

async function close() {
  if (context) await context.close();
  browser = null;
  context = null;
}

module.exports = { launchBrowser, getPage, getPageHeaded, isLoggedIn, close };
