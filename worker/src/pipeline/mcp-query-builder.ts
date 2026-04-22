/**
 * MCP Query Builder — builds optimal search queries từ post content.
 *
 * Strategy:
 * 1. Extract sentences chứa tinnitus/hearing keywords (rule-based).
 * 2. Nếu không có → dùng toàn bộ content (rút ngắn 200 chars).
 * 3. Gọi searchKnowledge() với top_k=5, min_score=0.60.
 */

import { mcpSearchKnowledge, type McpSearchResult } from '../lib/agentsee-mcp-http-client.js'
import { logger } from '../lib/pino-structured-logger.js'

/** Keywords để extract câu liên quan */
const TINNITUS_KEYWORDS = [
  'ù tai', 'ù tai', 'tinnitus', 'tiếng ù', 'tiếng kêu', 'tiếng vo ve',
  'nghe kém', 'điếc', 'thính lực', 'tai', 'ù', 'ringing', 'buzzing',
  'audiogram', 'đo thính lực', 'máy trợ thính', 'cochlear', 'ốc tai',
]

/**
 * Extract 2 best sentences from content for MCP query.
 */
function extractBestQuery(content: string): string {
  const sentences = content
    .split(/[.!?\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15)

  // Ưu tiên câu có keyword
  const relevant = sentences.filter((s) =>
    TINNITUS_KEYWORDS.some((kw) => s.toLowerCase().includes(kw)),
  )

  if (relevant.length > 0) {
    // Take top 2, concat
    return relevant.slice(0, 2).join('. ').slice(0, 400)
  }

  // Fallback: use first 200 chars of content
  return content.slice(0, 200)
}

export type McpKnowledgeChunk = {
  id: string
  content: string
  score: number
  metadata?: Record<string, unknown>
}

/**
 * Query AgentSee MCP với content của post.
 * Returns up to 5 chunks với score ≥ 0.55.
 */
export async function queryMcpForPost(
  postContent: string,
  topK = 5,
  minScore = 0.55,
): Promise<McpKnowledgeChunk[]> {
  const query = extractBestQuery(postContent)
  logger.debug({ query: query.slice(0, 80) }, 'MCP query')

  let results: McpSearchResult[]
  try {
    results = await mcpSearchKnowledge(query, topK)
  } catch (err) {
    logger.warn({ err: (err as Error).message }, 'MCP search failed — proceeding without chunks')
    return []
  }

  const filtered = results
    .filter((r) => r.score >= minScore)
    .map((r) => ({
      id: r.id,
      content: r.content,
      score: r.score,
      metadata: r.metadata,
    }))

  logger.debug({ found: results.length, filtered: filtered.length }, 'MCP chunks fetched')
  return filtered
}

/**
 * Format MCP chunks vào text block để inject vào Gemini prompt.
 */
export function formatChunksForPrompt(chunks: McpKnowledgeChunk[]): string {
  if (chunks.length === 0) return '(Không tìm thấy kiến thức liên quan trong knowledge base)'

  return chunks
    .map((c, i) => `[Nguồn ${i + 1} — score: ${c.score.toFixed(2)}]\n${c.content.slice(0, 600)}`)
    .join('\n\n---\n\n')
}
