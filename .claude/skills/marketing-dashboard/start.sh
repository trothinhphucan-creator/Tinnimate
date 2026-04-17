#!/usr/bin/env bash
# Start Marketing Dashboard + Gemini Proxy
# Usage: bash start.sh [port]
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${1:-3210}"
PROXY_PORT=7860
PROXY_DIR="$SCRIPT_DIR/../gemini-proxy"

echo "╔══════════════════════════════════════════════╗"
echo "║     🚀  Marketing AI Dashboard               ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# --- Check / Start Gemini Proxy ---
if curl -sf "http://localhost:$PROXY_PORT/health" > /dev/null 2>&1; then
  # Check if authenticated
  STATUS=$(curl -s "http://localhost:$PROXY_PORT/health" 2>/dev/null)
  if echo "$STATUS" | grep -q '"authenticated":true'; then
    echo "✅ Gemini Proxy: online & authenticated (port $PROXY_PORT)"
  else
    echo "⚠️  Gemini Proxy: running but NOT logged in"
    echo "   → Run login: bash $PROXY_DIR/start-proxy.sh --login"
  fi
else
  echo "▶️  Starting Gemini Proxy..."
  PROXY_PORT=$PROXY_PORT nohup node "$PROXY_DIR/cli.js" start \
    > /tmp/gemini-proxy.log 2>&1 &
  sleep 4
  if curl -sf "http://localhost:$PROXY_PORT/health" > /dev/null 2>&1; then
    echo "✅ Gemini Proxy: started (port $PROXY_PORT)"
    echo ""
    echo "  ⚠️  Nếu chưa login Gemini, chạy:"
    echo "     bash $PROXY_DIR/start-proxy.sh --login"
  else
    echo "⚠️  Proxy chưa start được. Kiểm tra log:"
    echo "   tail -f /tmp/gemini-proxy.log"
  fi
fi

echo ""

# --- Start Dashboard ---
pkill -f "dashboard.js" > /dev/null 2>&1
sleep 1

echo "▶️  Starting Marketing Dashboard..."
DASHBOARD_PORT=$PORT \
GEMINI_PROXY_URL="http://localhost:$PROXY_PORT" \
  nohup node "$SCRIPT_DIR/dashboard.js" > /tmp/marketing-dashboard.log 2>&1 &
DPID=$!
sleep 3

if curl -sf "http://localhost:$PORT/api/proxy/status" > /dev/null 2>&1; then
  echo "✅ Dashboard: http://localhost:$PORT"
else
  echo "⚠️  Dashboard đang khởi động... PID=$DPID"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📊 Dashboard:     http://localhost:$PORT"
echo "  🤖 Gemini Proxy:  http://localhost:$PROXY_PORT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  📋 Logs:"
echo "    tail -f /tmp/marketing-dashboard.log"
echo "    tail -f /tmp/gemini-proxy.log"
echo ""
echo "  🔐 Login lần đầu:"
echo "    bash $PROXY_DIR/start-proxy.sh --login"
echo ""
echo "  ⏹  Stop all:"
echo "    bash $SCRIPT_DIR/stop.sh"
echo ""
