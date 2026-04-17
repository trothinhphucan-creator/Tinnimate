#!/usr/bin/env node
/**
 * login.js
 * Multiple login strategies for headless servers:
 *
 * 1. xvfb (virtual display)  → xvfb-run node login.js --xvfb
 * 2. cookie import            → node login.js --import-cookies <file.json>
 * 3. cookie paste (stdin)     → node login.js --paste-cookies
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SESSION_DIR = path.join(__dirname, 'session');
const PROFILE_DIR = path.join(SESSION_DIR, 'chromium-profile');
const COOKIES_FILE = path.join(SESSION_DIR, 'cookies.json');

fs.mkdirSync(PROFILE_DIR, { recursive: true });

const args = process.argv.slice(2);
const strategy = args[0] || '--help';

// ─── Strategy 1: xvfb (virtual framebuffer) ──────────────────────────────────
async function loginWithXvfb() {
  console.log('🖥️  Launching browser with virtual display (xvfb)...');

  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  const page = context.pages()[0] || await context.newPage();
  await page.goto('https://accounts.google.com/signin/v2/identifier?service=gemini', {
    waitUntil: 'domcontentloaded',
  });

  console.log('\n📌 Browser opened on virtual display.');
  console.log('   To see it, use VNC or X forwarding.');
  console.log('   Waiting up to 5 minutes for login to complete...\n');
  console.log('   Alternatively, use --paste-cookies or --import-cookies instead.\n');

  // Wait until user reaches Gemini chat (login complete)
  try {
    await page.waitForURL('**/gemini.google.com/**', { timeout: 300000 });
    console.log('✅ Login detected! Saving session...');
  } catch {
    console.log('⏱️  Timeout — saving whatever session state exists.');
  }

  const cookies = await context.cookies();
  fs.writeFileSync(COOKIES_FILE, JSON.stringify(cookies, null, 2));
  await context.close();
  console.log(`✅ Session saved to: ${COOKIES_FILE}`);
}

// ─── Strategy 2: Import cookies from JSON file (exported from browser) ───────
async function importCookies(cookieFile) {
  if (!cookieFile || !fs.existsSync(cookieFile)) {
    console.error(`❌ File not found: ${cookieFile}`);
    console.log('\nExport cookies from Chrome:');
    console.log('  1. Install "Cookie-Editor" extension: https://chrome.google.com/webstore/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm');
    console.log('  2. Go to https://gemini.google.com (while logged in)');
    console.log('  3. Open Cookie-Editor → Export → "Export as JSON"');
    console.log('  4. Save file and transfer to this server');
    console.log(`  5. Run: node login.js --import-cookies /path/to/cookies.json`);
    process.exit(1);
  }

  console.log(`📥 Importing cookies from: ${cookieFile}`);

  let cookies;
  try {
    const raw = JSON.parse(fs.readFileSync(cookieFile, 'utf-8'));

    // Normalize: Cookie-Editor exports slightly different format than Playwright
    // sameSite must be one of: "Strict" | "Lax" | "None"
    const normalizeSameSite = (val) => {
      if (!val) return 'Lax';
      const v = val.toLowerCase();
      if (v === 'strict') return 'Strict';
      if (v === 'lax') return 'Lax';
      if (v === 'none' || v === 'no_restriction') return 'None';
      return 'Lax'; // safe fallback
    };

    cookies = raw.map(c => ({
      name: c.name,
      value: c.value,
      domain: c.domain || '.google.com',
      path: c.path || '/',
      expires: c.expirationDate || c.expires || -1,
      httpOnly: c.httpOnly || false,
      secure: c.secure !== undefined ? c.secure : true,
      sameSite: normalizeSameSite(c.sameSite),
    }));
  } catch (e) {
    console.error(`❌ Cannot parse cookie file: ${e.message}`);
    process.exit(1);
  }

  // Launch headless context and inject cookies
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  await context.addCookies(cookies);

  // Verify by navigating to Gemini
  const page = context.pages()[0] || await context.newPage();
  await page.goto('https://gemini.google.com', { waitUntil: 'domcontentloaded', timeout: 20000 });

  const url = page.url();
  if (url.includes('accounts.google.com')) {
    console.error('❌ Cookies are expired or invalid — login page appeared.');
    await context.close();
    process.exit(1);
  }

  console.log('✅ Cookies valid! Session saved.');
  await context.close();
}

// ─── Strategy 3: Paste cookies JSON via stdin ─────────────────────────────────
async function pasteCookies() {
  console.log('📋 Paste your cookies JSON below, then press Enter + Ctrl+D:\n');
  console.log('(Export from Chrome → Cookie-Editor extension)\n');

  let data = '';
  process.stdin.on('data', chunk => { data += chunk; });
  await new Promise(resolve => process.stdin.on('end', resolve));

  const tmpFile = '/tmp/gemini-cookies-paste.json';
  fs.writeFileSync(tmpFile, data.trim());
  await importCookies(tmpFile);
  fs.unlinkSync(tmpFile);
}

// ─── Verify session ───────────────────────────────────────────────────────────
async function verifySession() {
  if (!fs.existsSync(PROFILE_DIR) && !fs.existsSync(COOKIES_FILE)) {
    console.log('❌ No session found. Login first.');
    process.exit(1);
  }

  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  const page = context.pages()[0] || await context.newPage();

  try {
    await page.goto('https://gemini.google.com', { waitUntil: 'domcontentloaded', timeout: 20000 });
    const url = page.url();
    if (url.includes('accounts.google.com')) {
      console.log('❌ Session expired — please re-login.');
    } else {
      console.log('✅ Session valid! Logged in to Gemini Ultra.');
    }
  } catch (e) {
    console.log(`⚠️ Could not verify: ${e.message}`);
  }

  await context.close();
}

// ─── Help ─────────────────────────────────────────────────────────────────────
function printHelp() {
  console.log(`
Gemini Web Proxy — Login Tool
==============================

Strategies (choose one based on your setup):

1. Virtual display (xvfb) — server has xvfb installed:
   xvfb-run node login.js --xvfb

2. Import cookies from file (recommended for SSH servers):
   node login.js --import-cookies /path/to/cookies.json

   How to get cookies:
   a) On your LOCAL machine: go to https://gemini.google.com (logged in)
   b) Install Cookie-Editor Chrome extension
   c) Export → "Export as JSON" → save file
   d) Transfer to server: scp cookies.json user@server:/path/
   e) Run: node login.js --import-cookies cookies.json

3. Paste cookies (if you can't scp):
   node login.js --paste-cookies
   (Paste JSON, then Ctrl+D)

4. Verify current session:
   node login.js --verify
  `);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  switch (strategy) {
    case '--xvfb':
      await loginWithXvfb();
      break;
    case '--import-cookies':
      await importCookies(args[1]);
      break;
    case '--paste-cookies':
      await pasteCookies();
      break;
    case '--verify':
      await verifySession();
      break;
    default:
      printHelp();
  }
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
