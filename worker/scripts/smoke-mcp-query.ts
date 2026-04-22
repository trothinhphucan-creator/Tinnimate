/**
 * Smoke test: gọi AgentSee MCP search_knowledge và in kết quả.
 * Run: npm run smoke:mcp -- "ù tai điều trị"
 */

import { mcpGetStoreStats, mcpSearchKnowledge } from '../src/lib/agentsee-mcp-http-client.js'
import { logger } from '../src/lib/pino-structured-logger.js'

async function main() {
  const query = process.argv.slice(2).join(' ') || 'ù tai điều trị bằng âm thanh'

  logger.info('Checking MCP store stats...')
  const stats = await mcpGetStoreStats()
  logger.info({ stats }, 'MCP store stats')

  logger.info({ query }, 'Running search_knowledge...')
  const results = await mcpSearchKnowledge(query, 5, 0.55)

  if (!results.length) {
    logger.warn('No results returned')
    process.exit(1)
  }

  for (const r of results) {
    logger.info(
      { id: r.id, score: r.score, preview: r.content.slice(0, 120) },
      'Result',
    )
  }
  logger.info({ count: results.length }, 'MCP smoke test OK')
}

main().catch((err) => {
  logger.error({ err: err instanceof Error ? err.message : err }, 'MCP smoke test FAILED')
  process.exit(1)
})
