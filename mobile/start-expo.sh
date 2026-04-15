#!/bin/bash
# start-expo.sh - Chạy Expo Metro qua Tailscale (ổn định, không dùng ngrok)

PORT=8082

echo "🚀 Khởi động Expo Metro Bundler trên port $PORT..."

# Kill process cũ nếu có
pkill -f "expo start" 2>/dev/null
sleep 1

# Lấy Tailscale IP (ổn định nhất)
TAILSCALE_IP=$(tailscale ip -4 2>/dev/null | head -1)

if [ -n "$TAILSCALE_IP" ]; then
  HOST_IP="$TAILSCALE_IP"
  echo "✅ Dùng Tailscale IP: $TAILSCALE_IP"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📱 Kết nối Expo Go:"
  echo "   exp://$TAILSCALE_IP:$PORT"
  echo ""
  echo "⚠️  Đảm bảo điện thoại đã cài & bật Tailscale!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
  # Fallback: dùng LAN IP
  HOST_IP=$(hostname -I | awk '{print $1}')
  echo "⚠️  Không có Tailscale, dùng LAN IP: $HOST_IP"
  echo "   (điện thoại cần cùng mạng WiFi)"
fi

echo ""
REACT_NATIVE_PACKAGER_HOSTNAME="$HOST_IP" \
  npx expo start --port $PORT --host lan
