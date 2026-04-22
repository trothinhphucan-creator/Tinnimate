rm -f /tmp/cf_expo.log
cloudflared tunnel --url http://localhost:8081 --logfile /tmp/cf_expo.log &
CF_PID=$!
cd /home/haichu/tinnimate/mobile && npx expo start --port 8081 --lan > /dev/null 2>&1 &
EXPO_PID=$!
echo "Waiting for Cloudflare tunnel..."
sleep 8
CF_URL=$(grep -o 'https://[^[:space:]]*\.trycloudflare\.com' /tmp/cf_expo.log | head -1)
if [ -z "$CF_URL" ]; then
  sleep 4
  CF_URL=$(grep -o 'https://[^[:space:]]*\.trycloudflare\.com' /tmp/cf_expo.log | head -1)
fi
if [ -n "$CF_URL" ]; then
  EXPO_URL=$(echo $CF_URL | sed 's|https://|exp://|')
  echo "Tunnel URL: $EXPO_URL"
  npx qrcode-terminal "$EXPO_URL"
else
  echo "Failed to get Cloudflare URL. Logs:"
  cat /tmp/cf_expo.log
fi
