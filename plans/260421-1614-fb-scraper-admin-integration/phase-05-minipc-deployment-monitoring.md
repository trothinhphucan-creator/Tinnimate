# Phase 05 — MiniPC Deployment + Monitoring

**Priority:** P1
**Status:** ⏳ PENDING
**Estimate:** 0.5 day
**Depends on:** Phase 02, 03, 04

## Goal

Worker chạy 24/7 trên MiniPC Ubuntu (cùng host với AgentSee MCP), tự restart khi crash, log tập trung, alert khi fanpage bị logout hoặc queue backlog.

## Key Insights

- MiniPC đã chạy AgentSee + Postgres → thêm Redis + worker process nhẹ nhàng.
- Caddy đã proxy `dashboard.vuinghe.com` → thêm route `social-listening-worker.vuinghe.com` → `localhost:4100` (worker HTTP, auth bằng `X-Worker-Key`).
- systemd tốt hơn PM2 trong trường hợp này vì: cần headful Chromium (Xvfb), cần bind-mount Redis socket, journal logs đã sẵn có.

## Related Files

**Create:**
- `/etc/systemd/system/tinnimate-fb-worker.service`
- `/etc/systemd/system/tinnimate-fb-worker-xvfb.service` (nếu cần headful trên server không GUI)
- `/etc/caddy/sites/tinnimate-worker.conf`
- `worker/scripts/deploy-minipc.sh` — rsync worker/ → MiniPC, npm ci, restart service
- `worker/scripts/healthcheck.sh` — curl /health, check fanpages status
- `worker/src/monitoring/metrics-exporter.ts` — simple HTTP `/metrics` (Prometheus format)
- `worker/src/monitoring/alert-webhook.ts` — POST Slack/Telegram khi fanpage logout

## systemd Unit

```ini
[Unit]
Description=TinniMate Facebook Social Listening Worker
After=network.target redis.service
Wants=redis.service

[Service]
Type=simple
User=haichu
WorkingDirectory=/home/haichu/tinnimate/worker
EnvironmentFile=/home/haichu/tinnimate/worker/.env.production
ExecStart=/usr/bin/xvfb-run -a --server-args="-screen 0 1280x720x24" /usr/bin/node dist/index.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=fb-worker

[Install]
WantedBy=multi-user.target
```

## Caddy Config

```
# --- TINNIMATE Social Listening Worker (internal HTTP API) ---
http://social-listening.tinnimate.vuinghe.com {
    # Only reachable internal, admin web calls this
    @authorized header X-Worker-Key "{env.WORKER_SHARED_SECRET}"
    reverse_proxy @authorized localhost:4100
    respond 401 "unauthorized"
}
```

## Monitoring

### Metrics to track
- `fb_worker_posts_scraped_total{source, page}` — counter
- `fb_worker_drafts_generated_total{topic, urgency}` — counter
- `fb_worker_replies_posted_total{page, status}` — counter
- `fb_worker_gemini_tokens_total{model, kind}` — counter
- `fb_worker_queue_depth{queue}` — gauge
- `fb_worker_session_status{page_id}` — gauge (1=online, 0=offline)

### Alerts
- Fanpage `status = LOGGED_OUT` > 1 phút → Telegram admin.
- Queue `fb-analyze` depth > 100 → Telegram.
- Gemini error rate > 10% trong 15 phút → Telegram.
- Crisis post detected → Telegram ngay.

### Log aggregation
- `journalctl -u tinnimate-fb-worker -f` cho realtime.
- Tùy chọn: ship qua Loki nếu đã có stack quan sát chung.

## Deployment Steps

1. SSH vào MiniPC.
2. Install Redis: `sudo apt install redis-server`; verify `redis-cli ping`.
3. Install Chromium deps cho Playwright: `sudo npx playwright install-deps chromium`.
4. Install Xvfb: `sudo apt install xvfb`.
5. `rsync -avz worker/ minipc:/home/haichu/tinnimate/worker/` (exclude node_modules).
6. On MiniPC: `cd /home/haichu/tinnimate/worker && npm ci && npm run build`.
7. Copy `.env.production` (không commit git).
8. `sudo cp systemd/tinnimate-fb-worker.service /etc/systemd/system/`.
9. `sudo systemctl daemon-reload && sudo systemctl enable --now tinnimate-fb-worker`.
10. `sudo systemctl status tinnimate-fb-worker` → verify running.
11. Update Caddy config + reload.
12. Test từ web admin: gọi health endpoint qua reverse proxy.

## Success Criteria

- [ ] Worker tự khởi động khi reboot MiniPC.
- [ ] Chromium headful chạy ổn định trong Xvfb 24h không crash.
- [ ] Alert Telegram bắn khi test logout 1 fanpage thủ công.
- [ ] Metrics scrape được bằng curl `/metrics`.
- [ ] Deploy script `deploy-minipc.sh` idempotent: chạy 2 lần không lỗi.

## Risks

- **Chromium OOM trên MiniPC RAM thấp** — giới hạn concurrency=1, set `--memory-limit=512MB`.
- **Redis persistence** — enable AOF để job queue không mất khi restart.
- **Port 4100 lộ ra ngoài** — đảm bảo Caddy check `X-Worker-Key` trước khi proxy; hoặc bind chỉ `127.0.0.1:4100`.

## Rollback Plan

1. `sudo systemctl stop tinnimate-fb-worker`.
2. Disable scrape cron → không có job mới.
3. Pending drafts vẫn review được (chỉ ảnh hưởng scraping mới).
4. Revert deploy qua git tag trước khi merge.

## Unresolved Questions

- Có cần ship logs ra ngoài MiniPC không (trường hợp MiniPC chết)?
- Có cần backup Redis (`dump.rdb`) vì job queue không phải source of truth — có lẽ không cần.
- Cân nhắc Sentry cho worker error tracking?
