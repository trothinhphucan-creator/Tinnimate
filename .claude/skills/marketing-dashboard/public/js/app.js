/* app.js — Marketing Dashboard Frontend Logic */

// ── Helpers ───────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

function toast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span> ${msg}`;
  $('toasts').appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard!', 'success'));
}

function selectChip(groupId, el, value) {
  document.querySelectorAll(`#${groupId} .chip`).forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  const inputId = groupId.replace('-chips', '');
  if ($(inputId)) $(inputId).value = value;
}

function setTab(page, tab, el) {
  el.closest('.tabs').querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll(`[id^="${page}-tab-"]`).forEach(p => p.style.display = 'none');
  $(`${page}-tab-${tab}`).style.display = '';
}

// ── Navigation ────────────────────────────────────────────────────────────────
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const page = $(`page-${name}`);
  const nav  = $(`nav-${name}`);
  if (page) page.classList.add('active');
  if (nav)  nav.classList.add('active');

  if (name === 'home')   refreshHome();
  if (name === 'assets') loadAssets();
}

// ── Proxy Status ──────────────────────────────────────────────────────────────
let proxyOnline = false;

async function checkProxy() {
  const dot  = $('statusDot');
  const text = $('statusText');
  const btn  = $('proxyBtn');
  dot.className = 'status-dot loading';
  text.textContent = 'Checking...';

  try {
    const r = await fetch('/api/proxy/status');
    const d = await r.json();
    proxyOnline = d.running && d.authenticated;

    if (d.running && d.authenticated) {
      dot.className    = 'status-dot online';
      text.textContent = 'Gemini Ultra ✓';
      btn.textContent  = 'Running';
      btn.className    = 'btn-proxy stop';
    } else if (d.running) {
      dot.className    = 'status-dot loading';
      text.textContent = 'Not authenticated';
      btn.textContent  = 'Stop';
      btn.className    = 'btn-proxy stop';
    } else {
      dot.className    = 'status-dot offline';
      text.textContent = 'Proxy offline';
      btn.textContent  = 'Start Proxy';
      btn.className    = 'btn-proxy start';
    }
    updateStats(d);
  } catch {
    dot.className    = 'status-dot offline';
    text.textContent = 'Dashboard error';
  }
}

async function toggleProxy() {
  if (proxyOnline) {
    await fetch('/api/proxy/stop', { method: 'POST' });
    toast('Proxy stopping...', 'info');
  } else {
    $('statusDot').className = 'status-dot loading';
    $('statusText').textContent = 'Starting...';
    await fetch('/api/proxy/start', { method: 'POST' });
    toast('Proxy starting...', 'info');
  }
  setTimeout(checkProxy, 2000);
}

// ── Stats ─────────────────────────────────────────────────────────────────────
let allAssets = [];

async function refreshHome() {
  const r = await fetch('/api/assets');
  allAssets = await r.json();

  $('stat-total').textContent = allAssets.length;
  $('stat-text').textContent  = allAssets.filter(a => a.type === 'text').length;
  $('stat-image').textContent = allAssets.filter(a => a.type === 'image').length;

  const recent    = allAssets.slice(0, 6);
  const container = $('home-recent');
  if (!recent.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">✨</div><div class="empty-text">No assets yet — create your first!</div></div>`;
    return;
  }
  container.innerHTML = `<div class="gallery">${recent.map(assetCard).join('')}</div>`;
}

function updateStats(d) {
  $('stat-status').textContent = d.running ? (d.authenticated ? 'Online' : 'Unauth') : 'Offline';
}

// ── Assets ────────────────────────────────────────────────────────────────────
function assetCard(a) {
  if (a.type === 'image' && a.result && a.result.url) {
    return `
      <div class="gallery-item">
        <img class="gallery-thumb" src="${a.result.url}" alt="Generated" onerror="this.style.display='none'">
        <div class="gallery-body">
          <div class="gallery-title">${a.result.tool || 'Image'}</div>
          <div class="gallery-meta">${new Date(a.createdAt).toLocaleDateString()}</div>
        </div>
      </div>`;
  }
  const preview = (a.result && a.result.text ? a.result.text : '').slice(0, 100);
  return `
    <div class="text-asset-card">
      <div class="gallery-meta" style="margin-bottom:6px">
        <span class="badge badge-purple">${(a.result && a.result.tool) || 'text'}</span>
        <span>${new Date(a.createdAt).toLocaleDateString()}</span>
      </div>
      <div class="text-asset-preview">${preview}${preview.length >= 100 ? '...' : ''}</div>
      <div class="result-actions">
        <button class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText(this.dataset.t).then(()=>toast('Copied!','success'))" data-t="${((a.result && a.result.text) || '').replace(/"/g, '&quot;')}">📋 Copy</button>
      </div>
    </div>`;
}

async function loadAssets(filter) {
  filter = filter || 'all';
  const r = await fetch('/api/assets');
  allAssets = await r.json();
  const filtered = filter === 'all' ? allAssets : allAssets.filter(a => a.type === filter);
  const container = $('assets-grid');
  if (!filtered.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🗂️</div><div class="empty-text">No ${filter} assets yet</div></div>`;
    return;
  }
  const imgs  = filtered.filter(a => a.type === 'image');
  const texts = filtered.filter(a => a.type === 'text');
  let html = '';
  if (imgs.length)  html += `<div class="gallery" style="margin-bottom:20px">${imgs.map(assetCard).join('')}</div>`;
  if (texts.length) html += `<div class="grid-2">${texts.map(assetCard).join('')}</div>`;
  container.innerHTML = html;
}

function filterAssets(filter, el) {
  el.closest('.tabs').querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  loadAssets(filter);
}

// ── Legacy Tool Runners ───────────────────────────────────────────────────────
async function runTool(toolName, data, resultId) {
  const values = Object.values(data).filter(Boolean);
  if (!values.length) { toast('Please fill in required fields', 'error'); return; }

  const box = $(resultId);
  box.classList.add('show');
  box.innerHTML = `<div style="text-align:center;padding:20px"><div class="spinner"></div><div style="margin-top:12px;color:var(--text-muted);font-size:13px">✨ Generating...</div></div>`;

  try {
    const r = await fetch('/api/tools/' + toolName, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const d = await r.json();
    if (!r.ok || d.error) {
      box.innerHTML = `<div style="color:var(--red);padding:8px">${d.error || 'Error'}</div>`;
      toast(d.error || 'Generation failed', 'error');
      return;
    }
    box.innerHTML = `<div class="result-text">${d.text}</div>`;
    toast('Done!', 'success');
    refreshHome();
  } catch (err) {
    box.innerHTML = `<div style="color:var(--red);padding:8px">Error: ${err.message}</div>`;
    toast(err.message, 'error');
  }
}

async function runImageTool(toolName, data, resultId) {
  const values = Object.values(data).filter(Boolean);
  if (!values.length) { toast('Please fill in required fields', 'error'); return; }
  const box = $(resultId);
  box.classList.add('show');
  box.innerHTML = `<div style="text-align:center;padding:40px"><div class="spinner"></div></div>`;
  try {
    const r = await fetch('/api/tools/' + toolName, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const d = await r.json();
    if (!r.ok || d.error) { box.innerHTML = `<div style="color:var(--red)">${d.error}</div>`; return; }
    box.innerHTML = `<img class="result-image" src="${d.url}" alt="Generated">`;
    toast('Image ready!', 'success');
    refreshHome();
  } catch (err) {
    box.innerHTML = `<div style="color:var(--red)">Error: ${err.message}</div>`;
  }
}

function downloadText(text, filename) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Agent Console Controller ──────────────────────────────────────────────────
let currentResultId    = null;
let currentFinalResult = null;
let activeSSE          = null;
let stepStartTimes     = {};
let pipelineSteps      = [];

const AGENT_ICONS = {
  'researcher':           '🔍',
  'copywriter':           '✍️',
  'content-reviewer':     '✅',
  'campaign-manager':     '🚀',
  'planner':              '📋',
  'content-creator':      '📝',
  'seo-specialist':       '🔍',
  'social-media-manager': '📱',
  'email-wizard':         '📧',
  'image-generator':      '🖼️',
};

function openConsole(toolName, pipeline) {
  pipelineSteps = pipeline || [];

  $('consoleSteps').innerHTML = pipelineSteps.map((s, i) => `
    <div class="agent-step waiting" id="step-${i}">
      <div class="step-icon">${AGENT_ICONS[s.agent] || '🤖'}</div>
      <div class="step-info">
        <div class="step-name">${s.label || s.agent}</div>
        <div class="step-status"><span>Waiting...</span></div>
      </div>
      <div class="step-duration" id="dur-${i}">—</div>
    </div>`).join('');

  $('consoleOutput').innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-dim);font-size:13px">🤖 Agents about to start...</div>';
  $('consoleFinal').classList.remove('show');
  $('consoleRunning').style.display = 'block';
  $('progressFill').style.width = '0%';
  $('consoleTitle').textContent = '🤖 ' + toolName + ' — Agent Team';

  $('agentOverlay').classList.add('visible');
  $('agentConsole').classList.add('open');
}

function closeConsole() {
  $('agentOverlay').classList.remove('visible');
  $('agentConsole').classList.remove('open');
  if (activeSSE) { activeSSE.close(); activeSSE = null; }
}

function setStepState(idx, state) {
  const el = $('step-' + idx);
  if (!el) return;
  el.className = 'agent-step ' + state;
  const span = el.querySelector('.step-status span');
  if (!span) return;
  if (state === 'running') span.textContent = 'Working...';
  else if (state === 'done') span.textContent = 'Completed';
  else if (state === 'error') span.textContent = 'Error';
}

function addOutputBlock(agent, label) {
  const output = $('consoleOutput');
  if (output.querySelector('div[style]')) output.innerHTML = '';
  const blockId = 'block-' + agent + '-' + Date.now();
  const div = document.createElement('div');
  div.className = 'output-block';
  div.id = blockId;
  div.innerHTML = `
    <div class="output-block-header">${AGENT_ICONS[agent] || '🤖'} ${label || agent}</div>
    <div class="output-block-body stream-cursor" id="body-${blockId}"></div>`;
  output.appendChild(div);
  output.scrollTop = output.scrollHeight;
  return blockId;
}

function updateOutputBlock(blockId, text) {
  const body = $('body-' + blockId);
  if (!body) return;
  body.textContent = text.length > 800 ? text.slice(0, 800) + '...' : text;
  body.closest('.console-output').scrollTop = 99999;
}

function finalizeOutputBlock(blockId) {
  const body = $('body-' + blockId);
  if (body) body.classList.remove('stream-cursor');
}

function showFinalResult(result) {
  $('consoleRunning').style.display = 'none';
  $('consoleFinal').classList.add('show');
  $('progressFill').style.width = '100%';

  try {
    const parsed = (typeof result === 'string') ? JSON.parse(result) : result;
    currentFinalResult = parsed;

    if (parsed.type === 'image' && parsed.url) {
      $('consoleFinalText').textContent = '';
      $('consoleFinalImage').src = parsed.url;
      $('consoleFinalImage').style.display = 'block';
      if (currentResultId) {
        const box = $(currentResultId);
        box.classList.add('show');
        box.innerHTML = `<img class="result-image" src="${parsed.url}" alt="Generated"><div class="result-actions"><a class="btn btn-secondary btn-sm" href="${parsed.url}" download>⬇️ Download</a></div>`;
      }
    } else {
      const text = parsed.text || String(result);
      currentFinalResult = text;
      $('consoleFinalText').textContent = text;
      $('consoleFinalImage').style.display = 'none';
      if (currentResultId) {
        const box = $(currentResultId);
        box.classList.add('show');
        box.innerHTML = `<div class="result-text">${text}</div><div class="result-actions"><button class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText(this.dataset.t);toast('Copied!','success')" data-t="${text.replace(/"/g,'&quot;')}">📋 Copy</button></div>`;
      }
    }
  } catch {
    const text = String(result);
    currentFinalResult = text;
    $('consoleFinalText').textContent = text;
    $('consoleFinalImage').style.display = 'none';
  }

  toast('✅ Agent pipeline complete!', 'success');
  refreshHome();
}

function copyFinalResult() {
  const text = (typeof currentFinalResult === 'string')
    ? currentFinalResult
    : JSON.stringify(currentFinalResult, null, 2);
  navigator.clipboard.writeText(text).then(() => toast('Copied!', 'success'));
}

// ── runAgentTool — Main entry point ──────────────────────────────────────────
async function runAgentTool(toolName, inputs, resultId) {
  const values = Object.values(inputs).filter(function(v) { return v && v.toString().trim(); });
  if (!values.length) { toast('Please fill in required fields', 'error'); return; }

  currentResultId    = resultId;
  currentFinalResult = null;
  stepStartTimes     = {};

  // Fetch pipeline preview
  let pipeline = [];
  try {
    const tr = await fetch('/api/agent/teams');
    const td = await tr.json();
    const tool = (td.tools || []).find(function(t) { return t.tool === toolName; });
    if (tool) pipeline = tool.agents.map(function(a) { return { agent: a, label: a }; });
  } catch (e) { /* ignore */ }

  openConsole(toolName, pipeline);

  // Start job
  let jobId;
  try {
    const r = await fetch('/api/agent/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: toolName, inputs: inputs }),
    });
    const d = await r.json();
    if (!d.ok || !d.jobId) throw new Error(d.error || 'Failed to start');
    jobId = d.jobId;
  } catch (err) {
    toast('Error: ' + err.message, 'error');
    closeConsole();
    return;
  }

  // SSE stream
  const sse = new EventSource('/api/agent/progress/' + jobId);
  activeSSE = sse;
  const outputBlocks = {};
  let totalSteps = pipeline.length || 1;

  sse.addEventListener('agent_start', function(e) {
    const d = JSON.parse(e.data);
    totalSteps = d.total || totalSteps;
    const pct = Math.round(((d.step - 1) / totalSteps) * 100);
    $('progressFill').style.width = pct + '%';

    const idx = pipelineSteps.findIndex(function(s) { return s.agent === d.agent; });
    if (idx >= 0) { setStepState(idx, 'running'); }
    else {
      const stepsEl = $('consoleSteps');
      const ni = stepsEl.children.length;
      const el = document.createElement('div');
      el.className = 'agent-step running';
      el.id = 'step-' + ni;
      el.innerHTML = `<div class="step-icon">${AGENT_ICONS[d.agent] || '🤖'}</div><div class="step-info"><div class="step-name">${d.label || d.agent}</div><div class="step-status"><span>Working...</span></div></div><div class="step-duration" id="dur-${ni}">—</div>`;
      stepsEl.appendChild(el);
      pipelineSteps.push({ agent: d.agent, label: d.label });
    }
    stepStartTimes[d.agent] = Date.now();
    outputBlocks[d.agent] = addOutputBlock(d.agent, d.label);
  });

  sse.addEventListener('agent_done', function(e) {
    const d = JSON.parse(e.data);
    const idx = pipelineSteps.findIndex(function(s) { return s.agent === d.agent; });
    if (idx >= 0) {
      setStepState(idx, 'done');
      const elapsed = stepStartTimes[d.agent] ? ((Date.now() - stepStartTimes[d.agent]) / 1000).toFixed(1) + 's' : '';
      const dur = $('dur-' + idx);
      if (dur) dur.textContent = elapsed;
    }
    if (outputBlocks[d.agent]) {
      updateOutputBlock(outputBlocks[d.agent], d.result || '');
      finalizeOutputBlock(outputBlocks[d.agent]);
    }
    const pct = Math.round((d.step / (d.total || totalSteps)) * 100);
    $('progressFill').style.width = Math.min(pct, 95) + '%';
  });

  sse.addEventListener('agent_error', function(e) {
    const d = JSON.parse(e.data);
    const idx = pipelineSteps.findIndex(function(s) { return s.agent === d.agent; });
    if (idx >= 0) setStepState(idx, 'error');
    toast('Agent error: ' + d.error, 'error');
  });

  sse.addEventListener('pipeline_done', function(e) {
    const d = JSON.parse(e.data);
    sse.close(); activeSSE = null;
    showFinalResult(d.finalResult);
  });

  sse.addEventListener('error', function(e) {
    if (e.data) { try { toast('Error: ' + JSON.parse(e.data).message, 'error'); } catch (ex) {} }
    sse.close(); activeSSE = null;
    $('consoleRunning').textContent = '❌ Pipeline failed. Check proxy.';
  });

  sse.onerror = function() {
    if (sse.readyState === EventSource.CLOSED) { activeSSE = null; }
  };
}

// ── Init ──────────────────────────────────────────────────────────────────────
checkProxy();
refreshHome();
setInterval(checkProxy, 15000);
