/**
 * gemini-scraper.js
 * Interacts with gemini.google.com to generate images and text.
 * Uses Playwright to automate the web UI.
 */
const { getPage } = require('./browser-session');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '..', 'output');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const GEMINI_URL = 'https://gemini.google.com';
const TIMEOUT = 90000; // 90s for generation

/**
 * Navigate to Gemini and wait for chat to be ready
 */
async function ensureGeminiReady(page) {
  const url = page.url();
  if (!url.includes('gemini.google.com')) {
    await page.goto(GEMINI_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  }

  // Wait for the input field
  await page.waitForSelector(
    'rich-textarea p, [data-placeholder], textarea[aria-label], .ql-editor',
    { timeout: 20000 }
  );
}

/**
 * Submit a prompt and wait for response
 */
async function submitPrompt(page, prompt) {
  // Clear any existing input
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Delete');

  // Type prompt
  const inputSelectors = [
    'rich-textarea p',
    '.ql-editor p',
    'textarea[aria-label]',
    '[data-placeholder] p',
    'div[contenteditable="true"]',
  ];

  let inputEl = null;
  for (const sel of inputSelectors) {
    try {
      inputEl = await page.waitForSelector(sel, { timeout: 5000 });
      if (inputEl) break;
    } catch {}
  }

  if (!inputEl) throw new Error('Cannot find Gemini input box');

  await inputEl.click();
  await page.keyboard.type(prompt, { delay: 20 });

  // Submit
  await page.keyboard.press('Enter');

  // Wait for response to complete (stop button disappears)
  await page.waitForFunction(
    () => {
      const stopBtn = document.querySelector('[aria-label="Stop response"], button[data-test-id="stop-button"]');
      return !stopBtn;
    },
    { timeout: TIMEOUT, polling: 1000 }
  );

  // Small buffer for render
  await page.waitForTimeout(2000);
}

/**
 * Extract text response from the latest message
 */
async function extractTextResponse(page) {
  // Try to get the last model response
  const responses = await page.$$eval(
    'model-response .response-container-content, .model-response-text, [data-message-role="model"] .markdown',
    els => els.map(el => el.innerText.trim()).filter(Boolean)
  );

  if (responses.length > 0) return responses[responses.length - 1];

  // Fallback: grab any recent message container
  const fallback = await page.$eval(
    '.conversation-container model-response:last-child, .response-content:last-child',
    el => el.innerText.trim()
  ).catch(() => '');

  return fallback;
}

/**
 * Extract generated image URLs from the page
 */
async function extractGeneratedImages(page) {
  // Wait for images to appear
  await page.waitForFunction(
    () => document.querySelector('model-response img, .generated-image img, [data-testid="image-result"] img'),
    { timeout: 60000, polling: 1000 }
  ).catch(() => {});

  const imgUrls = await page.$$eval(
    'model-response img[src], .generated-image img[src], [data-testid="image-result"] img[src]',
    imgs => imgs.map(img => img.src).filter(src => src && !src.includes('data:') && src.startsWith('http'))
  );

  return imgUrls;
}

/**
 * Download image from URL using page context (handles auth cookies)
 */
async function downloadImage(page, imgUrl, outputPath) {
  const buffer = await page.evaluate(async (url) => {
    const resp = await fetch(url, { credentials: 'include' });
    const arr = await resp.arrayBuffer();
    return Array.from(new Uint8Array(arr));
  }, imgUrl);

  fs.writeFileSync(outputPath, Buffer.from(buffer));
  return outputPath;
}

/**
 * Generate image via Gemini web UI
 * @param {string} prompt - Image description
 * @param {object} options - { outputPath, aspectRatio }
 * @returns {{ success, imagePath, error }}
 */
async function generateImage(prompt, options = {}) {
  const page = await getPage();
  const outputPath = options.outputPath || path.join(OUTPUT_DIR, `${uuidv4()}.png`);

  try {
    await ensureGeminiReady(page);

    // Use Imagen-capable prompt prefix for better image generation
    const fullPrompt = `Create an image: ${prompt}`;
    await submitPrompt(page, fullPrompt);

    // Try to find generated images
    const imgUrls = await extractGeneratedImages(page);

    if (imgUrls.length > 0) {
      await downloadImage(page, imgUrls[0], outputPath);
      return { success: true, imagePath: outputPath, imageUrl: imgUrls[0] };
    }

    // Gemini may have generated but not shown as img tag — try screenshot of response area
    const responseArea = await page.$('model-response:last-child');
    if (responseArea) {
      await responseArea.screenshot({ path: outputPath });
      return { success: true, imagePath: outputPath, note: 'screenshot_fallback' };
    }

    return { success: false, error: 'No image generated — check if Gemini Ultra supports image gen in your region' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Generate text/content via Gemini web UI
 * @param {string} prompt 
 * @returns {{ success, text, error }}
 */
async function generateText(prompt) {
  const page = await getPage();

  try {
    await ensureGeminiReady(page);
    await submitPrompt(page, prompt);
    const text = await extractTextResponse(page);
    return { success: true, text };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Check if session is authenticated
 */
async function checkAuth() {
  const page = await getPage();
  try {
    await page.goto(GEMINI_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForSelector('rich-textarea p, .ql-editor, [data-placeholder]', { timeout: 15000 });
    return { authenticated: true };
  } catch {
    const url = page.url();
    if (url.includes('accounts.google.com')) {
      return { authenticated: false, reason: 'Redirected to Google login' };
    }
    return { authenticated: false, reason: 'Could not load Gemini chat' };
  }
}

module.exports = { generateImage, generateText, checkAuth };
