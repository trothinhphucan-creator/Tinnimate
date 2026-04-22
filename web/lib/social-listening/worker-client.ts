/**
 * HTTP client cho worker — gọi từ web API routes.
 * Worker chạy trên MiniPC, URL cấu hình qua FB_WORKER_URL env.
 * Default port 4100 khớp với worker/.env (WORKER_HTTP_PORT=4100).
 */

const WORKER_URL =
  process.env.FB_WORKER_URL ?? process.env.WORKER_URL ?? 'http://localhost:4100'
const WORKER_KEY =
  process.env.FB_WORKER_SHARED_SECRET ?? process.env.WORKER_SHARED_SECRET ?? ''

async function workerFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${WORKER_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Worker-Key': WORKER_KEY,
      ...(options.headers ?? {}),
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Worker ${path} → ${res.status}: ${text.slice(0, 200)}`)
  }

  return res.json() as Promise<T>
}

export const workerClient = {
  health: () =>
    workerFetch<{ status: string; phase: string; mcpReachable: boolean }>('/health'),

  startLogin: (pageId: string, label: string) =>
    workerFetch<{ loginId: string; message: string }>('/worker/login/start', {
      method: 'POST',
      body: JSON.stringify({ pageId, label }),
    }),

  getLoginStatus: (loginId: string) =>
    workerFetch<{
      loginId: string
      pageId: string
      status: 'PENDING' | 'WAITING_2FA' | 'SUCCESS' | 'FAILED' | 'TIMEOUT'
      errorMessage: string | null
    }>(`/worker/login/${loginId}/status`),

  triggerScrapeNow: () =>
    workerFetch<{ queued: number; skipped: number }>('/worker/scrape/run-now', { method: 'POST' }),

  pageHealth: (pageId: string) =>
    workerFetch<{ id: string; label: string; status: string }>(`/worker/page/${pageId}/health`, {
      method: 'POST',
    }),

  pageLogout: (pageId: string) =>
    workerFetch<{ ok: boolean }>(`/worker/page/${pageId}/logout`, { method: 'POST' }),

  postReply: (replyId: string) =>
    workerFetch<{ ok: boolean; postedAt: string }>('/worker/reply/post', {
      method: 'POST',
      body: JSON.stringify({ replyId }),
    }),
}
