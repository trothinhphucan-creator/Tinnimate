const express = require('express');
const cors = require('cors');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

// ── AgentTeam Engine ─────────────────────────────────────────────────────────
const orchestrator = require('./server/agent-orchestrator.cjs');
const { getPipeline, listTools } = require('./server/agent-teams.cjs');

const app = express();
const PORT = process.env.DASHBOARD_PORT || 8080;
const PROXY_URL = process.env.GEMINI_PROXY_URL || 'http://localhost:7860';
const PROXY_DIR = path.join(__dirname, '..', 'gemini-proxy');
const ASSETS_DIR = path.join(__dirname, 'public', 'assets', 'generated');
fs.mkdirSync(ASSETS_DIR, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '10mb' }));
// NOTE: static AFTER API routes to avoid shadowing /api/*


let proxyProcess = null;

// ── Helpers ───────────────────────────────────────────────────────────────────
async function callProxy(endpoint, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const url = new URL(PROXY_URL + endpoint);
    const opts = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    };
    const req = http.request(opts, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch { resolve({ error: body }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(data);
    req.end();
  });
}

async function proxyGet(endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(PROXY_URL + endpoint);
    http.get({ hostname: url.hostname, port: url.port || 80, path: url.pathname }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
    }).on('error', reject);
  });
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Save asset metadata
function saveAsset(type, prompt, result) {
  const id = generateId();
  const meta = { id, type, prompt, result, createdAt: new Date().toISOString() };
  const metaFile = path.join(ASSETS_DIR, `${id}.json`);
  fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));
  return meta;
}

// Load all assets
function loadAssets() {
  const files = fs.readdirSync(ASSETS_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => {
    try { return JSON.parse(fs.readFileSync(path.join(ASSETS_DIR, f))); }
    catch { return null; }
  }).filter(Boolean).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// ── API: Proxy Control ────────────────────────────────────────────────────────
app.get('/api/proxy/status', async (req, res) => {
  try {
    const health = await proxyGet('/health');
    res.json({ running: true, authenticated: health?.session?.authenticated, ...health });
  } catch {
    res.json({ running: false, authenticated: false });
  }
});

app.post('/api/proxy/start', (req, res) => {
  if (proxyProcess) {
    return res.json({ ok: true, message: 'Already started' });
  }
  proxyProcess = spawn('node', [path.join(PROXY_DIR, 'cli.js'), 'start'], {
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PROXY_PORT: '7860' },
  });
  proxyProcess.on('exit', () => { proxyProcess = null; });

  // Wait a moment then confirm
  setTimeout(async () => {
    try {
      await proxyGet('/health');
      res.json({ ok: true, message: 'Proxy started' });
    } catch {
      res.json({ ok: false, message: 'Proxy starting, retry in 3s' });
    }
  }, 2000);
});

app.post('/api/proxy/stop', (req, res) => {
  if (proxyProcess) {
    proxyProcess.kill('SIGTERM');
    proxyProcess = null;
  }
  exec('pkill -f "cli.js start" 2>/dev/null; pkill -f "gemini-proxy/src/server" 2>/dev/null');
  res.json({ ok: true, message: 'Proxy stopped' });
});

// ── API: Generate Text ────────────────────────────────────────────────────────
app.post('/api/generate/text', async (req, res) => {
  try {
    const { prompt, tool } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    const result = await callProxy('/v1/generate/text', { prompt });
    if (result.error) return res.status(500).json({ error: result.error });

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || result.raw?.text || '';
    const asset = saveAsset('text', prompt, { text, tool });
    res.json({ ok: true, text, assetId: asset.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── API: Generate Image ───────────────────────────────────────────────────────
app.post('/api/generate/image', async (req, res) => {
  try {
    const { prompt, aspectRatio } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    const outputPath = path.join(ASSETS_DIR, `img-${generateId()}.png`);
    const result = await callProxy('/v1/generate/image', {
      prompt,
      aspectRatio: aspectRatio || '16:9',
      outputPath,
    });

    if (!result.success) return res.status(500).json({ error: result.error });

    const filename = path.basename(result.imagePath);
    const url = `/assets/generated/${filename}`;
    const asset = saveAsset('image', prompt, { url, imagePath: result.imagePath, aspectRatio });
    res.json({ ok: true, url, assetId: asset.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── API: Marketing Tools (templated prompts) ──────────────────────────────────
const MARKETING_PROMPTS = {
  tagline:      (d) => `Tạo 5 tagline marketing ngắn gọn, hấp dẫn cho: ${d.product}. Ngành: ${d.industry || 'general'}. Tone: ${d.tone || 'professional'}. Trả lời bằng danh sách đánh số.`,
  adcopy:       (d) => `Viết quảng cáo ${d.platform || 'Facebook'} cho: ${d.product}. USP: ${d.usp || 'chất lượng cao'}. CTA: ${d.cta || 'Mua ngay'}. Độ dài: ${d.length || 'ngắn (50-100 chữ)'}. Tone: ${d.tone || 'thuyết phục'}.`,
  emailSubject: (d) => `Tạo 10 email subject line hấp dẫn cho chiến dịch: ${d.campaign}. Mục tiêu: ${d.goal || 'tăng open rate'}. Audience: ${d.audience || 'general'}. Gồm biến thể: tò mò, urgent, benefit-driven.`,
  socialCaption:(d) => `Viết caption ${d.platform || 'Instagram'} cho bài đăng về: ${d.topic}. Brand voice: ${d.tone || 'friendly'}. Có hashtag phù hợp. Dài: ${d.length || '100-150 chữ'}.`,
  blogOutline:  (d) => `Tạo outline chi tiết cho bài blog: "${d.title}". Keyword chính: ${d.keyword || d.title}. Audience: ${d.audience || 'general'}. Format: H2/H3 với mô tả ngắn mỗi phần.`,
  productDesc:  (d) => `Viết mô tả sản phẩm hấp dẫn cho: ${d.product}. Tính năng chính: ${d.features || 'xem thêm'}. Lợi ích: ${d.benefits || 'tối ưu'}. Tone: ${d.tone || 'professional'}. 150-200 chữ.`,
  metaDesc:     (d) => `Viết meta description SEO cho trang: "${d.pageTitle}". Keyword: ${d.keyword}. URL: ${d.url || ''}. Đúng 150-160 ký tự. Hấp dẫn, có keyword tự nhiên.`,
  cta:          (d) => `Tạo 8 CTA button text và micro-copy cho: ${d.action}. Context: ${d.context || 'landing page'}. Tone: ${d.tone || 'action-oriented'}. Ngắn (2-5 từ) và mô tả.`,
  campaign:     (d) => `Lên kế hoạch campaign marketing cho: ${d.product}. Budget: ${d.budget || 'vừa'}. Duration: ${d.duration || '1 tháng'}. Mục tiêu: ${d.goal || 'tăng nhận diện'}. Bao gồm: channels, content mix, KPIs.`,
  banner:       (d) => `Create a professional marketing banner image, 16:9 format. Product/Brand: ${d.product}. Style: ${d.style || 'modern, dark background, vibrant colors'}. Key message: ${d.message || d.product}. Include: eye-catching typography, brand colors. Ultra high quality, photorealistic, award-winning design.`,
  thumbnail:    (d) => `Create a YouTube/social media thumbnail. Topic: ${d.topic}. Style: ${d.style || 'bold, high contrast, clickbait-worthy'}. Include: dramatic lighting, large text area space, professional quality. Eye-catching composition.`,
  socialImage:  (d) => `Create a social media image (${d.format || '1:1 square'}). Brand: ${d.brand || 'modern tech'}. Theme: ${d.theme || 'professional'}. Colors: ${d.colors || 'purple and blue gradient'}. Clean, modern design for ${d.platform || 'Instagram/LinkedIn'}.`,
};

app.post('/api/tools/:tool', async (req, res) => {
  try {
    const { tool } = req.params;
    if (!MARKETING_PROMPTS[tool]) return res.status(404).json({ error: 'Unknown tool' });

    const prompt = MARKETING_PROMPTS[tool](req.body);
    const isImage = ['banner', 'thumbnail', 'socialImage'].includes(tool);

    if (isImage) {
      const outputPath = path.join(ASSETS_DIR, `${tool}-${generateId()}.png`);
      const ar = tool === 'thumbnail' ? '16:9' : (req.body.format === '9:16' ? '9:16' : '1:1');
      const result = await callProxy('/v1/generate/image', { prompt, aspectRatio: ar, outputPath });
      if (!result.success) return res.status(500).json({ error: result.error });
      const filename = path.basename(result.imagePath);
      const url = `/assets/generated/${filename}`;
      const asset = saveAsset('image', prompt, { url, tool });
      return res.json({ ok: true, type: 'image', url, assetId: asset.id });
    } else {
      const result = await callProxy('/v1/generate/text', { prompt });
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || result.raw?.text || '';
      const asset = saveAsset('text', prompt, { text, tool });
      return res.json({ ok: true, type: 'text', text, assetId: asset.id });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── API: AgentTeam ───────────────────────────────────────────────────────────

// List available pipelines
app.get('/api/agent/teams', (req, res) => {
  res.json({ tools: listTools() });
});

// Launch a pipeline job → returns jobId immediately
app.post('/api/agent/run', async (req, res) => {
  const { tool, inputs } = req.body;
  if (!tool || !inputs) return res.status(400).json({ error: 'Missing tool or inputs' });

  const pipeline = getPipeline(tool);
  if (!pipeline) return res.status(404).json({ error: `No agent pipeline for tool: ${tool}` });

  const jobId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  orchestrator.createJob(jobId);

  const isImageTool = ['banner', 'thumbnail', 'socialImage'].includes(tool);

  // Run asynchronously
  (async () => {
    try {
      const emit = (event, data) => orchestrator.pushEvent(jobId, event, data);

      // Run the text pipeline (even for image tools — it builds the prompt)
      const finalPrompt = await orchestrator.runPipeline(pipeline, inputs, emit);

      if (isImageTool) {
        // Use refined prompt from copywriter agent to generate real image
        emit('agent_start', { agent: 'image-generator', label: '🖼️ Generating Image', step: pipeline.length + 1, total: pipeline.length + 1 });
        const aspectRatio = tool === 'thumbnail' ? '16:9' : (inputs.format === '9:16' ? '9:16' : '1:1');
        const outputPath  = path.join(ASSETS_DIR, `${tool}-${jobId}.png`);
        const imgResult   = await orchestrator.proxyPost('/v1/generate/image', {
          prompt: finalPrompt,
          aspectRatio,
          outputPath,
        });

        if (imgResult.success && imgResult.imagePath) {
          const url   = `/assets/generated/${path.basename(imgResult.imagePath)}`;
          const asset = saveAsset('image', finalPrompt, { url, tool });
          emit('agent_done', { agent: 'image-generator', label: '🖼️ Image Ready', step: pipeline.length + 1, result: url });
          orchestrator.finishJob(jobId, JSON.stringify({ type: 'image', url, assetId: asset.id }));
        } else {
          throw new Error(imgResult.error || 'Image generation failed');
        }
      } else {
        const asset = saveAsset('text', inputs.product || inputs.campaign || tool, { text: finalPrompt, tool });
        orchestrator.finishJob(jobId, JSON.stringify({ type: 'text', text: finalPrompt, assetId: asset.id }));
      }
    } catch (err) {
      orchestrator.finishJob(jobId, null, err.message);
    }
  })();

  res.json({ ok: true, jobId });
});

// SSE stream for job progress
app.get('/api/agent/progress/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = orchestrator.getJob(jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.flushHeaders();

  const send = ({ event, data }) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  orchestrator.subscribeJob(jobId, send);

  req.on('close', () => {
    // Client disconnected — no cleanup needed (job still runs)
  });
});

// ── API: Assets ───────────────────────────────────────────────────────────────
app.get('/api/assets', (req, res) => {
  res.json(loadAssets().slice(0, 50));
});

app.delete('/api/assets/:id', (req, res) => {
  const file = path.join(ASSETS_DIR, `${req.params.id}.json`);
  if (fs.existsSync(file)) fs.unlinkSync(file);
  res.json({ ok: true });
});

// ── Serve Static (MUST be after all API routes) ──────────────────────────────
app.use('/assets/generated', express.static(ASSETS_DIR));
app.use(express.static(path.join(__dirname, 'public')));

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎯 Marketing Dashboard: http://localhost:${PORT}\n`);
});
