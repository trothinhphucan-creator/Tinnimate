/**
 * AgentTeam Orchestrator
 * Reads .claude/agents/*.md, chains them via Gemini Web Proxy (localhost:7860).
 * NO API key — proxy handles auth via browser session.
 */

const fs   = require('fs');
const path = require('path');
const http  = require('http');
const https = require('https');

// ── Config ────────────────────────────────────────────────────────────────────
const AGENTS_DIR = path.resolve(__dirname, '../../../../agents');
const PROXY_URL  = process.env.GEMINI_PROXY_URL || 'http://localhost:7860';

// ── Agent cache ────────────────────────────────────────────────────────────────
const agentCache = new Map();

function parseAgentFile(filePath) {
  const raw   = fs.readFileSync(filePath, 'utf8');
  const parts = raw.split(/^---\s*$/m);
  let meta = {};
  let systemPrompt = raw;

  if (parts.length >= 3) {
    const frontmatter = parts[1];
    systemPrompt      = parts.slice(2).join('---').trim();
    frontmatter.split('\n').forEach(line => {
      const m = line.match(/^(\w+):\s*(.+)/);
      if (m) meta[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    });
  }

  return {
    name:         meta.name         || path.basename(filePath, '.md'),
    description:  meta.description  || '',
    model:        meta.model        || 'gemini',
    systemPrompt: systemPrompt,
  };
}

function loadAgent(agentName) {
  if (agentCache.has(agentName)) return agentCache.get(agentName);
  const filePath = path.join(AGENTS_DIR, `${agentName}.md`);
  if (!fs.existsSync(filePath)) {
    return { name: agentName, description: '', model: 'gemini', systemPrompt: `You are an expert ${agentName} AI assistant.` };
  }
  const agent = parseAgentFile(filePath);
  agentCache.set(agentName, agent);
  return agent;
}

// ── HTTP helper ───────────────────────────────────────────────────────────────
function httpPost(urlStr, body, timeoutMs) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const url  = new URL(urlStr);
    const lib  = url.protocol === 'https:' ? https : http;
    const opts = {
      hostname: url.hostname,
      port:     url.port || (url.protocol === 'https:' ? 443 : 80),
      path:     url.pathname + (url.search || ''),
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = lib.request(opts, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try   { resolve({ ok: res.statusCode < 300, status: res.statusCode, body: JSON.parse(buf) }); }
        catch { resolve({ ok: false, status: res.statusCode, body: buf }); }
      });
    });

    req.on('error', reject);
    req.setTimeout(timeoutMs || 120_000, () => {
      req.destroy();
      reject(new Error('Proxy request timeout (120s). Is proxy running?'));
    });
    req.write(data);
    req.end();
  });
}

// ── Proxy health check ────────────────────────────────────────────────────────
function checkProxy() {
  return new Promise(resolve => {
    const url = new URL(PROXY_URL + '/health');
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request(
      { hostname: url.hostname, port: url.port || 80, path: '/health', method: 'GET' },
      res => {
        let buf = '';
        res.on('data', c => buf += c);
        res.on('end', () => {
          try {
            const j = JSON.parse(buf);
            resolve({
              running: res.statusCode < 500,
              authenticated: !!(j.session && j.session.authenticated),
            });
          } catch { resolve({ running: true, authenticated: false }); }
        });
      }
    );
    req.on('error', () => resolve({ running: false, authenticated: false }));
    req.setTimeout(3000, () => { req.destroy(); resolve({ running: false, authenticated: false }); });
    req.end();
  });
}

async function proxyIsAlive() {
  const s = await checkProxy();
  return s.running;
}

// ── Proxy caller ─────────────────────────────────────────────────────────────
async function proxyPost(endpoint, body) {
  const result = await httpPost(PROXY_URL + endpoint, body, 120_000);
  return result.body;
}

// ── Generate text via Proxy ───────────────────────────────────────────────────
async function generateText(prompt) {
  const status = await checkProxy();

  if (!status.running) {
    throw new Error(
      'Gemini Proxy offline. Start it first:\n' +
      'bash .claude/skills/gemini-proxy/start-proxy.sh'
    );
  }

  if (!status.authenticated) {
    throw new Error(
      'Proxy chưa login. Mở browser để đăng nhập:\n' +
      'curl http://localhost:7860/auth/login'
    );
  }

  const result = await proxyPost('/v1/generate/text', { prompt });

  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text
    || result?.raw?.text
    || result?.text;

  if (!text) {
    const errMsg = result?.error?.message || result?.error || JSON.stringify(result);
    throw new Error(`Proxy generation error: ${errMsg}`);
  }

  return text;
}

// ── Call Agent ────────────────────────────────────────────────────────────────
async function callAgent(agentName, userPrompt, context) {
  const agent = loadAgent(agentName);
  context = context || '';

  let fullPrompt = '';
  if (agent.systemPrompt) {
    fullPrompt += agent.systemPrompt.slice(0, 3000) + '\n\n---\n';
  }
  if (context) {
    fullPrompt += `## Context from previous agent step:\n${context.slice(0, 2000)}\n\n`;
  }
  fullPrompt += `## Your task:\n${userPrompt}`;

  try {
    const text = await generateText(fullPrompt);
    return { agent, text };
  } catch (err) {
    console.error(`[Agent:${agentName}] Error:`, err.message);
    throw err;
  }
}

// ── Pipeline Runner ───────────────────────────────────────────────────────────
async function runPipeline(pipeline, inputs, emit) {
  let prevOutput  = '';
  let finalResult = '';

  for (let i = 0; i < pipeline.length; i++) {
    const step = pipeline[i];

    emit('agent_start', {
      agent: step.agent,
      label: step.label || step.agent,
      step:  i + 1,
      total: pipeline.length,
    });

    try {
      const userPrompt = typeof step.buildPrompt === 'function'
        ? step.buildPrompt(inputs, prevOutput)
        : (step.prompt || 'Complete your task.');

      const { text } = await callAgent(step.agent, userPrompt, i > 0 ? prevOutput : '');
      prevOutput  = text;
      finalResult = text;

      emit('agent_done', {
        agent:  step.agent,
        label:  step.label || step.agent,
        step:   i + 1,
        result: text,
      });
    } catch (err) {
      emit('agent_error', { agent: step.agent, error: err.message });
      throw err;
    }
  }

  return finalResult;
}

// ── Job Store (in-memory) ─────────────────────────────────────────────────────
const jobs = new Map();

function createJob(jobId) {
  const job = { events: [], subscribers: [], done: false, error: null };
  jobs.set(jobId, job);
  return job;
}

function getJob(jobId) {
  return jobs.get(jobId) || null;
}

function pushEvent(jobId, event, data) {
  const job = jobs.get(jobId);
  if (!job) return;
  const msg = { event, data, ts: Date.now() };
  job.events.push(msg);
  job.subscribers.forEach(cb => cb(msg));
}

function subscribeJob(jobId, cb) {
  const job = jobs.get(jobId);
  if (!job) return;
  job.events.forEach(e => cb(e));
  if (!job.done) job.subscribers.push(cb);
}

function finishJob(jobId, finalResult, error) {
  const job = jobs.get(jobId);
  if (!job) return;
  job.done  = true;
  job.error = error || null;
  const evt = error
    ? { event: 'error',         data: { message: error } }
    : { event: 'pipeline_done', data: { finalResult } };
  job.events.push(evt);
  job.subscribers.forEach(cb => cb(evt));
  job.subscribers = [];
  setTimeout(() => jobs.delete(jobId), 5 * 60_000);
}

// ── Exports ───────────────────────────────────────────────────────────────────
module.exports = {
  loadAgent,
  callAgent,
  runPipeline,
  proxyPost,
  proxyIsAlive,
  createJob,
  getJob,
  pushEvent,
  subscribeJob,
  finishJob,
};
