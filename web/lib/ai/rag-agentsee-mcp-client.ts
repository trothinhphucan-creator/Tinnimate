/**
 * RAG client for AgentSee MCP vector knowledge base (tinnitus/audiology docs).
 *
 * Calls the AgentSee dashboard gateway:
 *   POST https://dashboard.vuinghe.com/api/v1/vector/search_knowledge
 *
 * Returns KnowledgeDoc-compatible objects so they can be merged with
 * Supabase pgvector results in rag.ts.
 *
 * Env vars required:
 *   AGENTSEE_MCP_URL     — base URL, e.g. https://dashboard.vuinghe.com/api/v1/vector
 *   AGENTSEE_MCP_API_KEY — API key with scope "vector:search"
 */

import type { KnowledgeDoc } from '@/types'

interface AgentSeeSearchResult {
  title: string
  content: string
  score: number
  source: string
}

interface AgentSeeSearchResponse {
  results?: AgentSeeSearchResult[]
  error?: string
}

// Hard timeout: 5s — never block chat if AgentSee is down
const AGENTSEE_TIMEOUT_MS = 5_000
const DEFAULT_TOP_K = 5
const DEFAULT_MIN_SCORE = 0.55

export async function searchAgentSeeKnowledge(
  query: string,
  limit = DEFAULT_TOP_K,
): Promise<KnowledgeDoc[]> {
  const baseUrl = process.env.AGENTSEE_MCP_URL
  const apiKey = process.env.AGENTSEE_MCP_API_KEY

  if (!baseUrl || !apiKey) {
    // Silently skip when not configured — RAG still works via Supabase
    return []
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), AGENTSEE_TIMEOUT_MS)

  try {
    const res = await fetch(`${baseUrl}/search_knowledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        args: {
          query,
          top_k: limit,
          min_score: DEFAULT_MIN_SCORE,
        },
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      console.warn(`[RAG/AgentSee] HTTP ${res.status} — skipping`)
      return []
    }

    const data: AgentSeeSearchResponse = await res.json()

    if (!data.results?.length) return []

    // Map to KnowledgeDoc shape (id/category/is_active are synthetic)
    return data.results.map((r, i) => ({
      id: `agentsee-${i}-${Date.now()}`,
      title: r.title,
      content: r.content,
      // Attach score + source as suffix so gemini.ts can include it in prompt
      _score: r.score,
      _source: r.source,
      category: 'medical' as const,
      is_active: true,
      created_at: new Date().toISOString(),
    }))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn('[RAG/AgentSee] search failed (skipping):', msg.slice(0, 120))
    return []
  } finally {
    clearTimeout(timer)
  }
}
