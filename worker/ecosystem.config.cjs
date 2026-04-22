/**
 * PM2 ecosystem config for TinniMate FB Worker.
 *
 * Usage:
 *   pm2 start ecosystem.config.cjs     (production — dùng dist/)
 *   pm2 start ecosystem.config.cjs --env development  (dùng tsx src/)
 *
 * Đổi sang dist/: thay "npm" + "run dev" → "node" + ["dist/index.js"]
 */

module.exports = {
  apps: [
    {
      name: 'tinnimate-fb-worker',
      script: '/usr/bin/npm',
      args: 'run dev',
      cwd: '/home/haichu/tinnimate/worker',
      interpreter: 'none',

      // Pre-start: fix Redis eviction policy (runtime, no sudo needed)
      post_update: [],
      pre_start: [
        'redis-cli CONFIG SET maxmemory-policy noeviction || true',
      ],

      // env mặc định — override thêm qua .env
      env: {
        NODE_ENV: 'development',
        DISPLAY: '',  // không set → NEEDS_HELPER login flow
      },
      env_production: {
        NODE_ENV: 'production',
        DISPLAY: ':99',  // Xvfb virtual display
      },

      // Reliability
      autorestart: true,
      max_restarts: 10,
      restart_delay: 10000,
      max_memory_restart: '800M',

      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/home/haichu/.pm2/logs/tinnimate-fb-worker-error.log',
      out_file: '/home/haichu/.pm2/logs/tinnimate-fb-worker-out.log',
      merge_logs: true,
    },
  ],
}
