// Pure utility functions for sentiment detection and engagement analysis (no DB calls)

const CRISIS_KEYWORDS = [
  'tự tử', 'muốn chết', 'không muốn sống', 'suicide', 'kill myself',
]

const NEGATIVE_KEYWORDS = [
  'lo lắng', 'sợ', 'căng thẳng', 'tệ',
  'anxiety', 'scared', 'stressed', 'terrible',
]

const POSITIVE_KEYWORDS = [
  'tốt', 'khỏe', 'vui',
  'better', 'good', 'great', 'happy',
]

export type Sentiment = 'positive' | 'neutral' | 'negative' | 'crisis'

// Detects emotional sentiment from user message text
export function detectSentiment(text: string): Sentiment {
  const lower = text.toLowerCase()

  if (CRISIS_KEYWORDS.some((kw) => lower.includes(kw))) return 'crisis'
  if (NEGATIVE_KEYWORDS.some((kw) => lower.includes(kw))) return 'negative'
  if (POSITIVE_KEYWORDS.some((kw) => lower.includes(kw))) return 'positive'
  return 'neutral'
}

// Returns number of days elapsed since last activity date (0 if null)
export function getDaysSinceLastActivity(lastActivityDate: Date | null): number {
  if (!lastActivityDate) return 0
  const diffMs = Date.now() - lastActivityDate.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

// Returns true when user should receive a re-engagement nudge (> 3 days inactive)
export function shouldTriggerReengagement(daysSince: number): boolean {
  return daysSince > 3
}
