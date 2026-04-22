/**
 * AgentSee Vector MCP HTTP Client
 *
 * Truy vấn knowledge base audiology của AgentSee (live tại dashboard.vuinghe.com).
 * Auth: header X-Internal-Key = AGENTSEE_INTERNAL_KEY.
 *
 * Endpoints gọi (từ AgentSee src/mcp/vector-http-server.ts):
 *   POST /api/mcp/vector/search_knowledge
 *   POST /api/mcp/vector/search_by_heading
 *   POST /api/mcp/vector/get_vector_store_stats
 *   POST /api/mcp/vector/list_knowledge_files
 *
 * Dùng từ: web (server route handlers) và worker (Node).
 */

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

type ClientConfig = {
  baseUrl: string
  internalKey: string
  fetchImpl?: typeof fetch
  timeoutMs?: number
}

function readConfig(): ClientConfig {
  const baseUrl = process.env.AGENTSEE_MCP_URL
  const internalKey = process.env.AGENTSEE_INTERNAL_KEY
  if (!baseUrl) throw new Error('AGENTSEE_MCP_URL is not set')
  if (!internalKey) throw new Error('AGENTSEE_INTERNAL_KEY is not set')
  return { baseUrl: baseUrl.replace(/\/+$/, ''), internalKey, timeoutMs: 15_000 }
}

async function postJson<T>(path: string, body: unknown, cfg?: Partial<ClientConfig>): Promise<T> {
  const { baseUrl, internalKey, timeoutMs, fetchImpl } = { ...readConfig(), ...cfg }
  const doFetch = fetchImpl ?? fetch
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs ?? 15_000)
  try {
    const res = await doFetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Key': internalKey,
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

// Query knowledge base bằng semantic search. Dùng cho Gemini grounding.
export async function searchKnowledge(
  query: string,
  opts: { topK?: number; minScore?: number } = {},
): Promise<McpSearchResponse> {
  return postJson<McpSearchResponse>('/api/mcp/vector/search_knowledge', {
    query,
    top_k: opts.topK ?? 5,
    min_score: opts.minScore ?? 0.6,
  })
}

// Tìm theo heading (keyword nguyên văn). Dùng khi đã biết tên khái niệm.
export async function searchByHeading(
  keyword: string,
  opts: { limit?: number } = {},
): Promise<McpSearchResponse> {
  return postJson<McpSearchResponse>('/api/mcp/vector/search_by_heading', {
    keyword,
    limit: opts.limit ?? 5,
  })
}

// Health check cho admin UI hiển thị trạng thái MCP.
export async function getStoreStats(): Promise<unknown> {
  return postJson<unknown>('/api/mcp/vector/get_vector_store_stats', {})
}

// Liệt kê file knowledge đã ingest (debug).
export async function listKnowledgeFiles(): Promise<unknown> {
  return postJson<unknown>('/api/mcp/vector/list_knowledge_files', {})
}

// Helper: build grounded context string cho Gemini prompt.
export function buildGroundingContext(results: McpKnowledgeResult[]): string {
  if (!results.length) return '(không có kết quả phù hợp)'
  return results
    .map((r, i) => `[${i + 1}] ${r.title} (score=${r.score.toFixed(2)}, source=${r.source})\n${r.content}`)
    .join('\n\n---\n\n')
}
