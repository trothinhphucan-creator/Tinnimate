---
name: ck:gemini-proxy
description: Local API proxy that uses Gemini Ultra web session (browser automation) instead of API keys. No billing required. Supports image generation, text generation, and image analysis. Start the proxy, login once, then use GEMINI_PROXY_URL env var to route all AI calls through your Gemini Ultra account.
version: 1.0.0
license: MIT
argument-hint: "[login|start|check|image|text]"
---

# Gemini Web Proxy

Local proxy server that bridges ClaudeKit skills to **Gemini Ultra** via browser automation — no API key required.

## Architecture

```
ClaudeKit Skills
       │
       ▼
http://localhost:7860  (gemini-proxy)
       │
       ▼ Playwright (Chromium, headless)
gemini.google.com  ← your Gemini Ultra session
```

## Quick Start (3 steps)

### Step 1: Login (only once)
```bash
bash .claude/skills/gemini-proxy/start-proxy.sh --login
```
→ Browser opens, sign in with your **Gemini Ultra Google account**
→ Session saved to disk, never needed again

### Step 2: Start proxy
```bash
bash .claude/skills/gemini-proxy/start-proxy.sh
# Running at http://localhost:7860
```

### Step 3: Use via GEMINI_PROXY_URL
```bash
export GEMINI_PROXY_URL=http://localhost:7860

# Generate image (no API key!)
python .claude/skills/ai-multimodal/scripts/gemini_proxy_adapter.py

# Or use CLI directly:
node .claude/skills/gemini-proxy/cli.js image "A sunset over mountains, cinematic"
node .claude/skills/gemini-proxy/cli.js text  "Write a marketing tagline for..."
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Server + session status |
| GET | `/auth/check` | Check Gemini login |
| GET | `/auth/login` | Open browser to login |
| POST | `/v1/generate/image` | Generate image |
| POST | `/v1/generate/text` | Generate text |
| GET | `/v1/models` | List available models |

## Request Format

### Generate Image
```bash
curl -X POST http://localhost:7860/v1/generate/image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Professional marketing banner, dark purple gradient",
    "aspectRatio": "16:9",
    "outputPath": "/tmp/banner.png"
  }'
```

### Generate Text
```bash
curl -X POST http://localhost:7860/v1/generate/text \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Write a catchy headline for a meditation app"}'
```

## Integration with ClaudeKit Skills

Set `GEMINI_PROXY_URL` and skills automatically use the proxy:

```bash
# Add to .claude/.env
GEMINI_PROXY_URL=http://localhost:7860
```

The `gemini_proxy_adapter.py` handles routing — when `GEMINI_PROXY_URL` is set,
calls go to proxy instead of Google API.

## Session Storage

Session saved at: `.claude/skills/gemini-proxy/session/chromium-profile/`

- Login once, works forever (until Gemini session expires ~7 days)
- Re-login: `node cli.js login`
- `.gitignore` excludes session directory automatically

## Files

| File | Purpose |
|------|---------|
| `cli.js` | Main CLI: login, check, image, text, start |
| `src/server.js` | Express proxy server |
| `src/gemini-scraper.js` | Browser automation logic |
| `src/browser-session.js` | Persistent Chromium session manager |
| `start-proxy.sh` | Convenience startup script |
