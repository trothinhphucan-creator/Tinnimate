#!/usr/bin/env bash
pkill -f "marketing-dashboard/dashboard.js" 2>/dev/null
pkill -f "gemini-proxy/cli.js start" 2>/dev/null
pkill -f "gemini-proxy/src/server" 2>/dev/null
echo "✅ All services stopped."
