#!/usr/bin/env bash
# start-proxy.sh — Gemini Web Proxy manager
#
# Usage:
#   bash start-proxy.sh                    → start proxy server
#   bash start-proxy.sh --login            → login via xvfb (virtual display)
#   bash start-proxy.sh --import-cookies   → login by pasting cookies JSON
#   bash start-proxy.sh --verify           → verify session is valid
#   bash start-proxy.sh --port 8080        → use custom port

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${GEMINI_PROXY_PORT:-7860}"
CMD="start"

for arg in "$@"; do
  case $arg in
    --login)          CMD="login" ;;
    --import-cookies) CMD="import-cookies" ;;
    --paste-cookies)  CMD="paste-cookies" ;;
    --verify)         CMD="verify" ;;
    --port)           PORT="$2"; shift ;;
  esac
done

echo "🚀 Gemini Web Proxy"
echo "   Port: $PORT"
echo ""

case $CMD in

  login)
    echo "🖥️  Login strategy: xvfb (virtual display)"
    echo "   Running Chromium via Xvfb — browser is hidden but functional"
    echo ""
    echo "   After this starts, monitor with:"
    echo "     node $SCRIPT_DIR/login.js --verify"
    echo ""
    if ! command -v xvfb-run &>/dev/null; then
      echo "❌ xvfb-run not found. Falling back to cookie import strategy."
      CMD="import-cookies"
    else
      exec xvfb-run --auto-servernum --server-args="-screen 0 1280x900x24" \
        node "$SCRIPT_DIR/login.js" --xvfb
    fi
    ;;&

  import-cookies)
    echo "📥 Login via Cookie Import (recommended for SSH servers)"
    echo ""
    echo "Steps to get your Gemini cookies:"
    echo ""
    echo "  1. On your LOCAL computer — open Chrome/Edge"
    echo "  2. Go to https://gemini.google.com (logged in with Gemini Ultra)"
    echo "  3. Install Cookie-Editor extension:"
    echo "     Chrome: https://chromewebstore.google.com/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm"
    echo "  4. Click Cookie-Editor icon → Export → 'Export as JSON'"
    echo "  5. Save to a file, e.g. ~/Downloads/gemini-cookies.json"
    echo "  6. Upload to server:"
    echo "     scp ~/Downloads/gemini-cookies.json $(whoami)@$(hostname):~/gemini-cookies.json"
    echo ""
    echo "  Then run:"
    echo "    node $SCRIPT_DIR/login.js --import-cookies ~/gemini-cookies.json"
    echo ""
    echo "  Or paste directly:"
    echo "    node $SCRIPT_DIR/login.js --paste-cookies"
    ;;

  paste-cookies)
    echo "📋 Paste Cookie Import Mode"
    node "$SCRIPT_DIR/login.js" --paste-cookies
    ;;

  verify)
    echo "🔍 Verifying session..."
    node "$SCRIPT_DIR/login.js" --verify
    ;;

  start)
    # Check if proxy already running
    if curl -sf "http://localhost:$PORT/health" > /dev/null 2>&1; then
      echo "✅ Proxy already running at http://localhost:$PORT"
      echo "   Health: $(curl -s http://localhost:$PORT/health | python3 -c 'import sys,json; d=json.load(sys.stdin); print(f\"session={'authenticated' if d.get('session',{}).get('authenticated') else 'NOT logged in'}\")')"
      exit 0
    fi

    # Verify session before starting (warn but don't block)
    AUTH_STATUS=$(node "$SCRIPT_DIR/login.js" --verify 2>&1)
    if echo "$AUTH_STATUS" | grep -q "Session expired\|No session"; then
      echo "⚠️  Warning: No valid session found."
      echo "   Login first: bash $0 --login"
      echo "             or: bash $0 --import-cookies"
      echo ""
      echo "   Starting proxy anyway (you can login later via /auth/login endpoint)..."
      echo ""
    fi

    echo "▶️  Starting proxy server on port $PORT..."
    export PROXY_PORT=$PORT
    exec node "$SCRIPT_DIR/cli.js" start
    ;;
esac
