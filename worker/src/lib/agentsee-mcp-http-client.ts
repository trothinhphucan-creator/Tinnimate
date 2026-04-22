/**
 * Worker-side client gọi AgentSee Vector MCP HTTP.
 *
 * Web và worker duplicate logic tối thiểu — worker không import từ web/
 * để tránh cross-package coupling. Giữ cùng shape response để dễ swap.
 *
 * Nguồn: /home/haichu/projects/AgentSee/src/mcp/vector-http-server.ts
 */

import { env } from '../config/environment-schema.js'

// ─── Types ────────────────────────────────────────────────────────────────────

export type McpKnowledgeResult = {
  title: string
  content: string
  score: number
  source: string
}

export type McpSearchResponse = {
  results: McpKnowledgeResult[]
  query?: string
  message?: string
}

/** Flat alias dùng trong pipeline/mcp-query-builder.ts */
export type McpSearchResult = {
  id: string
  content: string
  score: number
  metadata?: Record<string, unknown>
}

// ─── Internal HTTP helper ──────────────────────────────────────────────────────

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 20_000)
  try {
    const res = await fetch(`${env.AGENTSEE_MCP_URL.replace(/\/+$/, '')}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Key': env.AGENTSEE_INTERNAL_KEY,
      },
      body: JSON.stringify(body ?? {}),
      signal: ctrl.signal,
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      throw new Error(`[mcp] ${path} ${res.status}: ${txt.slice(0, 200)}`)
    }
    return (await res.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Search knowledge base. Returns flat McpSearchResult[] (pre-filtered by minScore).
 */
export async function mcpSearchKnowledge(
  query: string,
  topK = 5,
  minScore = 0.55,
): Promise<McpSearchResult[]> {
  const resp = await postJson<McpSearchResponse>('/api/mcp/vector/search_knowledge', {
    query,
    top_k: topK,
    min_score: minScore,
  })
  return (resp.results ?? []).map((r) => ({
    id: r.source ?? r.title,
    content: r.content,
    score: r.score,
    metadata: { title: r.title, source: r.source },
  }))
}

export async function mcpSearchByHeading(keyword: string, limit = 5): Promise<McpSearchResponse> {
  return postJson<McpSearchResponse>('/api/mcp/vector/search_by_heading', { keyword, limit })
}

export async function mcpGetStoreStats(): Promise<{ loaded: boolean; entries?: number }> {
  return postJson<{ loaded: boolean; entries?: number }>('/api/mcp/vector/get_vector_store_stats', {})
}

/** Build prompt-ready context string. Dùng cho reply grounding. */
export function buildMcpGroundingContext(results: McpKnowledgeResult[]): string {
  if (!results.length) return '(không có kết quả phù hợp trong knowledge base)'
  return results
    .map((r, i) => `[${i + 1}] ${r.title} (source=${r.source}, score=${r.score.toFixed(2)})\n${r.content.trim()}`)
    .join('\n\n---\n\n')
}
