/**
 * server.js
 * Local API proxy server — translates Gemini API format to browser automation
 * 
 * Endpoints:
 *   GET  /health              → check server + session status
 *   GET  /auth/check          → check if logged in to Gemini
 *   GET  /auth/login          → open browser to login (headed mode)
 *   POST /v1/generate/text    → generate text
 *   POST /v1/generate/image   → generate image
 *   GET  /v1/models           → list available models (mocked compatible list)
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const { generateImage, generateText, checkAuth } = require('./gemini-scraper');
const { getPageHeaded, close } = require('./browser-session');

const app = express();
const PORT = process.env.PROXY_PORT || 7860;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Output dir for generated files
const OUTPUT_DIR = path.join(__dirname, '..', 'output');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Serve generated files statically
app.use('/output', express.static(OUTPUT_DIR));

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  const auth = await checkAuth().catch(e => ({ authenticated: false, error: e.message }));
  res.json({
    status: 'ok',
    proxy: 'gemini-web-proxy',
    version: '1.0.0',
    port: PORT,
    session: auth,
    timestamp: new Date().toISOString(),
  });
});

// ─── Auth: Check Login ────────────────────────────────────────────────────────
app.get('/auth/check', async (req, res) => {
  try {
    const result = await checkAuth();
    res.json(result);
  } catch (err) {
    res.status(500).json({ authenticated: false, error: err.message });
  }
});

// ─── Auth: Open Browser to Login ─────────────────────────────────────────────
app.get('/auth/login', async (req, res) => {
  try {
    res.json({ message: 'Opening browser for login... Please sign in, then call /auth/check to verify.' });

    // Open headed browser for user to sign in
    const page = await getPageHeaded();
    await page.goto('https://gemini.google.com', { waitUntil: 'domcontentloaded' });

    // Keep it open for 3 minutes for user to sign in
    setTimeout(async () => {
      console.log('[auth] Login window timer expired (3 min) — session saved to disk');
    }, 180000);
  } catch (err) {
    console.error('[auth/login] Error:', err.message);
  }
});

// ─── Models (compatibility endpoint) ─────────────────────────────────────────
app.get('/v1/models', (req, res) => {
  res.json({
    models: [
      { name: 'gemini-ultra-web', displayName: 'Gemini Ultra (Web Proxy)', inputTokenLimit: 32000 },
      { name: 'gemini-ultra-image', displayName: 'Gemini Ultra Image Gen (Web Proxy)' },
    ],
  });
});

// ─── Generate Text ────────────────────────────────────────────────────────────
app.post('/v1/generate/text', async (req, res) => {
  try {
    const { prompt, contents } = req.body;

    // Support both simple {prompt} and Gemini API format {contents: [{parts:[{text}]}]}
    const text = prompt || contents?.[0]?.parts?.[0]?.text;
    if (!text) return res.status(400).json({ error: 'Missing prompt or contents' });

    console.log(`[text] Generating: "${text.slice(0, 80)}..."`);
    const result = await generateText(text);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // Return in Gemini API-compatible format
    res.json({
      candidates: [{ content: { parts: [{ text: result.text }], role: 'model' } }],
      raw: result,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Generate Image ───────────────────────────────────────────────────────────
app.post('/v1/generate/image', async (req, res) => {
  try {
    const { prompt, aspectRatio, outputPath, numberOfImages } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    const filename = `img-${Date.now()}.png`;
    const filePath = outputPath || path.join(OUTPUT_DIR, filename);

    console.log(`[image] Generating: "${prompt.slice(0, 80)}..." → ${filename}`);

    const result = await generateImage(prompt, {
      outputPath: filePath,
      aspectRatio: aspectRatio || '16:9',
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error, hint: result.hint });
    }

    const relativePath = path.relative(OUTPUT_DIR, result.imagePath);
    const imageUrl = `http://localhost:${PORT}/output/${relativePath}`;

    res.json({
      success: true,
      imagePath: result.imagePath,
      imageUrl,
      note: result.note,
      // Gemini API-compatible format
      images: [{ url: imageUrl, localPath: result.imagePath }],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Analyze Image (multimodal) ───────────────────────────────────────────────
app.post('/v1/analyze/image', async (req, res) => {
  try {
    const { imageUrl, prompt } = req.body;
    if (!imageUrl || !prompt) return res.status(400).json({ error: 'Missing imageUrl or prompt' });

    // For now, analyze via text prompt with image URL
    const fullPrompt = `Analyze this image: ${imageUrl}\n\nTask: ${prompt}`;
    const result = await generateText(fullPrompt);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ success: true, analysis: result.text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Cleanup on exit ─────────────────────────────────────────────────────────
process.on('SIGINT', async () => {
  console.log('\n[proxy] Shutting down...');
  await close();
  process.exit(0);
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║         Gemini Web Proxy Server                       ║
║                                                       ║
║  URL:     http://localhost:${PORT}                      ║
║                                                       ║
║  Endpoints:                                           ║
║    GET  /health              → server status          ║
║    GET  /auth/login          → open browser to login  ║
║    GET  /auth/check          → check login status     ║
║    POST /v1/generate/text    → generate text          ║
║    POST /v1/generate/image   → generate image         ║
║                                                       ║
║  First time? Open browser to login:                   ║
║    curl http://localhost:${PORT}/auth/login              ║
╚═══════════════════════════════════════════════════════╝
  `);
});
