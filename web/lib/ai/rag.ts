// Server-side only — RAG vector similarity search via Supabase pgvector
import { GoogleGenerativeAI } from '@google/generative-ai'
import { KnowledgeDoc } from '@/types'
import { createServiceClient } from '@/lib/supabase/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Embed text using Gemini embedding model (768 dimensions to match pgvector column)
export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY ?? ''
  try {
    // Use REST API directly to set outputDimensionality=768 (SDK doesn't support it)
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: { parts: [{ text }] },
          outputDimensionality: 768,
        }),
      }
    )
    if (!res.ok) throw new Error(`Embedding API ${res.status}: ${await res.text()}`)
    const data = await res.json()
    return data.embedding.values
  } catch (err) {
    console.warn('[RAG] gemini-embedding-001 failed:', err instanceof Error ? err.message : err)
    // Silent fallback — return empty so chat still works without RAG
    return []
  }
}

// Search knowledge base using cosine similarity (threshold 0.7)
// Returns empty array on any error — never blocks chat
export async function searchKnowledge(
  query: string,
  limit = 3
): Promise<KnowledgeDoc[]> {
  try {
    const embedding = await embedText(query)
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
}
