// Server-side only — RAG vector similarity search (Supabase pgvector + AgentSee MCP)
import { KnowledgeDoc } from '@/types'
import { createServiceClient } from '@/lib/supabase/server'
import { searchAgentSeeKnowledge } from './rag-agentsee-mcp-client'

// Embed text using Gemini embedding model (768 dimensions to match pgvector column)
export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY ?? ''
  // Hard timeout: 5s — never block chat if embedding API is slow/down
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: { parts: [{ text }] },
          outputDimensionality: 768,
        }),
        signal: controller.signal,
      }
    )
    if (!res.ok) throw new Error(`Embedding API ${res.status}: ${await res.text()}`)
    const data = await res.json()
    return data.embedding.values
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn('[RAG] embedText failed (skipping RAG):', msg.slice(0, 100))
    // Silent fallback — return empty so chat still works without RAG
    return []
  } finally {
    clearTimeout(timer)
  }
}

// Search Supabase pgvector knowledge base (768d cosine similarity, threshold 0.7)
async function searchSupabaseKnowledge(query: string, limit: number): Promise<KnowledgeDoc[]> {
  try {
    const embedding = await embedText(query)
    if (!embedding.length) return []

    const supabase = createServiceClient()
    const { data, error } = await supabase.rpc('match_knowledge', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: limit,
    })

    if (error) {
      console.error('[RAG/Supabase] match_knowledge error:', error.message)
      return []
    }

    return (data ?? []) as KnowledgeDoc[]
  } catch (err) {
    console.error('[RAG/Supabase] error:', err instanceof Error ? err.message : err)
    return []
  }
}

// Merge results from multiple sources, deduplicating by title similarity.
// AgentSee docs come first (specialist audiology KB); Supabase fills remaining slots.
function mergeAndDedup(agentSee: KnowledgeDoc[], supabase: KnowledgeDoc[], limit: number): KnowledgeDoc[] {
  const seen = new Set<string>()
  const merged: KnowledgeDoc[] = []

  const addDoc = (doc: KnowledgeDoc) => {
    const key = doc.title.toLowerCase().slice(0, 40)
    if (!seen.has(key) && merged.length < limit) {
      seen.add(key)
      merged.push(doc)
    }
  }

  agentSee.forEach(addDoc)
  supabase.forEach(addDoc)
  return merged
}

// Search knowledge base using both Supabase pgvector AND AgentSee MCP in parallel.
// Returns empty array on any error — never blocks chat.
// Hard timeout: 8s total.
export async function searchKnowledge(
  query: string,
  limit = 6
): Promise<KnowledgeDoc[]> {
  const timeoutPromise = new Promise<KnowledgeDoc[]>((resolve) =>
    setTimeout(() => resolve([]), 8000)
  )

  const searchPromise = (async (): Promise<KnowledgeDoc[]> => {
    // Run both sources in parallel; each handles its own errors internally
    const [agentSeeDocs, supabaseDocs] = await Promise.all([
      searchAgentSeeKnowledge(query, limit),
      searchSupabaseKnowledge(query, limit),
    ])
    return mergeAndDedup(agentSeeDocs, supabaseDocs, limit)
  })()

  return Promise.race([searchPromise, timeoutPromise])
}
