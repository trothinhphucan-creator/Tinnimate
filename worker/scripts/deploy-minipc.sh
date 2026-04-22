#!/usr/bin/env bash
# deploy-minipc.sh — rsync worker build → MiniPC, restart systemd service
# Usage: ./scripts/deploy-minipc.sh [minipc-host]
#
# Prerequisites (on MiniPC):
#   - npm, Node 20, Chromium, Xvfb, Redis installed
#   - /etc/systemd/system/tinnimate-fb-worker.service copied
#   - /home/haichu/tinnimate/worker/.env exists (chmod 600)

set -euo pipefail

MINIPC_HOST="${1:-myserver}"
REMOTE_DIR="/home/haichu/tinnimate/worker"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🚀 Deploying FB Worker → ${MINIPC_HOST}:${REMOTE_DIR}"

# ── 1. Build locally ───────────────────────────────────────────────────────────
echo "📦 Building TypeScript..."
cd "$LOCAL_DIR"
npm run build

# ── 2. Rsync dist/ and package files (exclude node_modules, .env) ─────────────
echo "🔄 Syncing files to MiniPC..."
rsync -avz --progress \
  --exclude 'node_modules/' \
  --exclude '.env' \
  --exclude '.env.*' \
  --exclude '*.log' \
  "$LOCAL_DIR/" \
  "${MINIPC_HOST}:${REMOTE_DIR}/"

# ── 3. Remote: npm ci + restart service ────────────────────────────────────────
echo "🔧 Running npm ci on MiniPC..."
ssh "$MINIPC_HOST" bash <<'REMOTE'
  set -euo pipefail
  cd /home/haichu/tinnimate/worker
  npm ci --omit=dev
  echo "✅ npm ci done"

  # Install Playwright browser deps if not already done
  if ! command -v chromium-browser &>/dev/null && ! command -v chromium &>/dev/null; then
    echo "🌐 Installing Playwright Chromium deps..."
    sudo npx playwright install-deps chromium
    npx playwright install chromium
  fi

  # Restart service
  echo "🔄 Restarting tinnimate-fb-worker service..."
  sudo systemctl restart tinnimate-fb-worker
  sleep 3
  sudo systemctl status tinnimate-fb-worker --no-pager | head -20
REMOTE

echo "✅ Deploy complete!"
echo "📊 Check logs: ssh ${MINIPC_HOST} 'journalctl -u tinnimate-fb-worker -f'"
