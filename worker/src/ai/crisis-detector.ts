/**
 * Crisis detector — phát hiện bài viết có dấu hiệu tự hại / sức khỏe tâm thần khẩn cấp.
 *
 * Layer 1: keyword matching (rẻ, nhanh, không gọi API).
 * Layer 2 (tùy chọn): Gemini confirm nếu keyword không rõ ràng.
 *
 * LUÔN err on the side of caution — false positive tốt hơn false negative.
 */

const CRISIS_KEYWORDS_VI = [
  'tự tử', 'tự vẫn', 'chết đi', 'muốn chết', 'không muốn sống', 'kết thúc cuộc đời',
  'không còn muốn', 'chán sống', 'tuyệt vọng', 'không chịu được nữa', 'hết hy vọng',
  'bỏ lại tất cả', 'không còn ý nghĩa', 'tôi sẽ biến mất', 'nhảy lầu', 'uống thuốc tự tử',
]

const CRISIS_KEYWORDS_EN = [
  'suicid', 'want to die', 'end my life', 'kill myself', 'no reason to live',
  'can\'t go on', 'ending it all', 'better off dead', 'hopeless', 'self harm',
  'self-harm', 'hurt myself',
]

const ALL_CRISIS_KW = [...CRISIS_KEYWORDS_VI, ...CRISIS_KEYWORDS_EN]

/**
 * Kiểm tra crisis bằng keyword match — O(n·m) nhưng n nhỏ.
 * Returns true nếu bất kỳ crisis keyword nào xuất hiện.
 */
export function detectCrisisByKeyword(content: string): boolean {
  const lower = content.toLowerCase()
  return ALL_CRISIS_KW.some((kw) => lower.includes(kw))
}

/**
 * Draft cứng cho crisis posts — không customize, luôn giống nhau.
 * Reference: Đường dây hỗ trợ tâm lý TPHCM miễn phí 1800 599 920.
 */
export const CRISIS_DRAFT_REPLY = `Mình rất lo cho bạn và cảm ơn bạn đã chia sẻ. Nếu bạn đang có những suy nghĩ muốn tự làm hại bản thân, hãy gọi ngay đường dây hỗ trợ tâm lý miễn phí 1800 599 920 (24/7). Bạn không đơn độc trong hành trình này. 💙`

/**
 * Determine if a post should be flagged as crisis.
 * Returns: { isCrisis: boolean, matchedKeyword?: string }
 */
export function assessCrisisRisk(content: string): {
  isCrisis: boolean
  matchedKeyword?: string
} {
  const lower = content.toLowerCase()
  for (const kw of ALL_CRISIS_KW) {
    if (lower.includes(kw)) {
      return { isCrisis: true, matchedKeyword: kw }
    }
  }
  return { isCrisis: false }
}
