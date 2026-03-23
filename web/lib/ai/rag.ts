// Server-side only — RAG vector similarity search via Supabase pgvector
import { KnowledgeDoc } from '@/types'
import { createServiceClient } from '@/lib/supabase/server'

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

// Search knowledge base using cosine similarity (threshold 0.7)
// Returns empty array on any error — never blocks chat
// Hard timeout: 8s total (includes embedding + DB query)
export async function searchKnowledge(
  query: string,
  limit = 3
): Promise<KnowledgeDoc[]> {
  // Outer timeout to guarantee this never exceeds 8s
  const timeoutPromise = new Promise<KnowledgeDoc[]>((resolve) =>
    setTimeout(() => resolve([]), 8000)
  )

  const searchPromise = (async (): Promise<KnowledgeDoc[]> => {
    try {
      const embedding = await embedText(query)
      // If embedding failed (empty array), skip DB query
      if (!embedding.length) return []

      const supabase = createServiceClient()
      const { data, error } = await supabase.rpc('match_knowledge', {
        query_embedding: embedding,
        match_threshold: 0.7,
        match_count: limit,
      })

      if (error) {
        console.error('[RAG] match_knowledge error:', error.message)
        return []
      }

      return (data ?? []) as KnowledgeDoc[]
    } catch (err) {
      console.error('[RAG] searchKnowledge error:', err instanceof Error ? err.message : err)
      return []
    }
  })()

  return Promise.race([searchPromise, timeoutPromise])
}
