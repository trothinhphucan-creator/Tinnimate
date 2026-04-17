/**
 * AgentTeam Orchestrator
 * Reads .claude/agents/*.md, extracts system prompts, chains them via Gemini Proxy.
 * Mimics ClaudeKit CLI subagent orchestration — pure Node.js, no CLI required.
 */

const fs   = require('fs');
const path = require('path');
const http = require('http');

// ── Paths ────────────────────────────────────────────────────────────────────
const AGENTS_DIR = path.resolve(__dirname, '../../../../agents');
const PROXY_URL  = process.env.GEMINI_PROXY_URL || 'http://localhost:7860';

// ── Agent cache ───────────────────────────────────────────────────────────────
const agentCache = new Map();

/**
 * Parse a .md agent file.
 * Extracts YAML frontmatter (name, description, model) and markdown body (system prompt).
 */
function parseAgentFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');

  // Split on `---` delimiters
  const parts = raw.split(/^---\s*$/m);
  let meta = {};
  let systemPrompt = raw;

  if (parts.length >= 3) {
    // parts[0] = '' | parts[1] = frontmatter | parts[2..] = body
    const frontmatter = parts[1];
    systemPrompt = parts.slice(2).join('---').trim();

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

/**
 * Load agent definition (cached).
 */
function loadAgent(agentName) {
  if (agentCache.has(agentName)) return agentCache.get(agentName);

  const filePath = path.join(AGENTS_DIR, `${agentName}.md`);
  if (!fs.existsSync(filePath)) {
    return { name: agentName, description: '', model: 'gemini', systemPrompt: `You are an expert ${agentName}.` };
  }

  const agent = parseAgentFile(filePath);
  agentCache.set(agentName, agent);
  return agent;
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────
function proxyPost(endpoint, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const url  = new URL(PROXY_URL + endpoint);
    const opts = {
      hostname: url.hostname,
      port:     url.port || 80,
      path:     url.pathname,
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    };
    const req = http.request(opts, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try { resolve(JSON.parse(buf)); } catch { resolve({ raw: { text: buf } }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(120_000, () => { req.destroy(); reject(new Error('Agent call timeout')); });
    req.write(data);
    req.end();
  });
}

/**
 * Call an agent with a specific task using its system prompt injected into the Gemini call.
 * @param {string} agentName  - name matching .claude/agents/<name>.md
 * @param {string} userPrompt - the concrete task for this agent
 * @param {string} [context]  - output from previous agent (injected as context)
 */
async function callAgent(agentName, userPrompt, context = '') {
  const agent = loadAgent(agentName);

  // Build the full prompt: system prompt + context + task
  let fullPrompt = agent.systemPrompt
    ? `${agent.systemPrompt}\n\n---\n`
    : '';

  if (context) {
    fullPrompt += `## Context from previous step:\n${context}\n\n`;
  }

  fullPrompt += `## Your task:\n${userPrompt}`;

  const result = await proxyPost('/v1/generate/text', { prompt: fullPrompt });

  // Extract text from various response shapes
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text
    || result?.raw?.text
    || result?.text
    || String(result);

  return { agent, text };
}

// ── Pipeline Runner ───────────────────────────────────────────────────────────
/**
 * Run a sequential agent pipeline, emitting SSE-style events via the `emit` callback.
 *
 * @param {Array}    pipeline - [{ agent, buildPrompt(inputs, prevOutput) }, ...]
 * @param {object}   inputs   - user form data
 * @param {Function} emit     - emit(event, data) — sends SSE to client
 * @returns {string}          - final output text
 */
async function runPipeline(pipeline, inputs, emit) {
  let prevOutput = '';
  let finalResult = '';

  for (let i = 0; i < pipeline.length; i++) {
    const step = pipeline[i];

    emit('agent_start', {
      agent:  step.agent,
      label:  step.label || step.agent,
      step:   i + 1,
      total:  pipeline.length,
    });

    try {
      const userPrompt = typeof step.buildPrompt === 'function'
        ? step.buildPrompt(inputs, prevOutput)
        : step.prompt || 'Complete your task.';

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

// ── Job store (in-memory) ─────────────────────────────────────────────────────
const jobs = new Map();     // jobId → { events: [], subscribers: [], done: false, error: null }

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
  // Replay buffered events
  job.events.forEach(e => cb(e));
  if (!job.done) job.subscribers.push(cb);
}

function finishJob(jobId, finalResult, error = null) {
  const job = jobs.get(jobId);
  if (!job) return;
  job.done  = true;
  job.error = error;
  const event = error
    ? { event: 'error',         data: { message: error } }
    : { event: 'pipeline_done', data: { finalResult } };
  job.events.push(event);
  job.subscribers.forEach(cb => cb(event));
  job.subscribers = [];
  // Cleanup after 5 min
  setTimeout(() => jobs.delete(jobId), 5 * 60_000);
}

// ── Main export ───────────────────────────────────────────────────────────────
module.exports = {
  loadAgent,
  callAgent,
  runPipeline,
  proxyPost,
  // Job management
  createJob,
  getJob,
  pushEvent,
  subscribeJob,
  finishJob,
};
