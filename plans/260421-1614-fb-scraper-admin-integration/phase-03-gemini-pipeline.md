# Phase 03 — Gemini Classification + Reply Drafting (MCP-Grounded)

**Priority:** P0
**Status:** ⏳ PENDING
**Estimate:** 1.5 days
**Depends on:** Phase 01, Phase 02

## Goal

Cho mỗi `fb_posts.status = NEW`:
1. Gemini 2.5 Flash phân loại độ liên quan + intent + urgency.
2. Nếu liên quan (score ≥ 0.6) → gọi AgentSee MCP lấy kiến thức thính học → Gemini sinh reply tiếng Việt empathetic.
3. Lưu draft vào `fb_replies.status = DRAFT` chờ admin duyệt.
4. Vision (Gemini multimodal) phân tích ảnh audiogram/báo cáo đo thính lực nếu post có ảnh liên quan.

## Key Insights

- **Gemini 2.5 Flash** đa phương thức sẵn + rẻ ($0.075/1M input). Không cần tách vision provider.
- **MCP grounding** là điểm mạnh chính: reply phải trích nguồn trong `fb_replies.mcp_sources` để admin verify.
- **PaddleOCR pre-filter** (optional Phase 3.5): chạy OCR local trước → chỉ gửi ảnh có chữ VN lên Gemini để tiết kiệm token.
- **Tinni voice** (xem `docs/brand-guidelines.md`): empathetic, non-diagnostic, bilingual VI/EN, không đưa chẩn đoán y khoa.
- **Crisis keywords**: nếu post chứa "tự tử", "không muốn sống", "kết thúc" → skip auto-draft, flag red, route hotline 1800 599 920.

## Related Files

**Create trong `worker/`:**
- `src/ai/gemini-client.ts` — shared Gemini SDK instance
- `src/ai/classify-post-relevance.ts` — structured output {relevance: 0-1, topic, urgency, intent, lang}
- `src/ai/generate-reply-draft.ts` — takes post + MCP chunks → reply text
- `src/ai/vision-extract-audiogram.ts` — OCR + semantic extract từ ảnh
- `src/ai/crisis-detector.ts` — keyword + classifier cho tự hại
- `src/pipeline/analyze-post-job.ts` — BullMQ consumer: NEW → ANALYZED → REPLY_DRAFTED
- `src/pipeline/prompts/classify-prompt.ts` — system prompt phân loại
- `src/pipeline/prompts/reply-prompt.ts` — system prompt Tinni voice
- `src/pipeline/mcp-query-builder.ts` — build query từ post content

**Modify:**
- `worker/src/queue/bullmq-config.ts` — thêm queue `fb-analyze`

## Prompts

### Classify Prompt (output JSON)
```
Bạn phân loại một post Facebook xem có liên quan đến chứng ù tai (tinnitus) hay không.
Input: {content, images?, author, group_name}
Output JSON schema:
{
  "relevance": 0.0-1.0,
  "topic": "tinnitus_symptom" | "tinnitus_treatment" | "hearing_loss" | "unrelated" | "other",
  "urgency": "low" | "medium" | "high",  // high = nhắc đến tự hại/khẩn cấp
  "intent": "asking_help" | "sharing_experience" | "selling" | "spam" | "other",
  "lang": "vi" | "en" | "mixed",
  "crisis_flag": boolean  // có dấu hiệu tự hại/khẩn cấp sức khỏe tinh thần
}
Chỉ trả JSON, không giải thích.
```

### Reply Prompt (Tinni voice)
```
Bạn là Tinni — trợ lý AI của TinniMate, ứng dụng điều trị ù tai đầu tiên tại Việt Nam.

Giọng điệu:
- Empathetic, nhẹ nhàng, không chẩn đoán y khoa
- Dùng tiếng Việt tự nhiên, xưng "mình" / gọi người đọc "bạn"
- Không bán hàng quá lộ; đề xuất thử app nhẹ ở cuối nếu phù hợp
- Tối đa 120 từ, không emoji quá 2 cái
- Nếu crisis_flag=true → chỉ khuyên gọi 1800 599 920, KHÔNG đưa lời khuyên khác

Dựa trên kiến thức thính học sau (từ knowledge base):
{mcp_chunks}

Hãy viết comment trả lời cho post sau:
"{post_content}"

Yêu cầu:
1. Thừa nhận cảm giác của họ trước.
2. Đưa 1-2 thông tin hữu ích từ knowledge base (trích tự nhiên, không copy nguyên văn).
3. Gợi ý thử TinniMate nếu phù hợp (1 câu ngắn).
4. Không hứa chữa khỏi, không tuyên bố y khoa tuyệt đối.
```

## Implementation Steps

1. **Classify**: gọi Gemini với `generationConfig.responseMimeType = "application/json"` và schema. Lưu kết quả vào `fb_posts.classification`, cập nhật `status = ANALYZED`.

2. **Vision** (nếu `image_urls.length > 0` và topic liên quan):
   - Download ảnh tạm, convert về base64.
   - Nếu có PaddleOCR local: OCR trước, nếu chứa keyword tiếng Việt về thính lực (dB, Hz, PTA, nghe kém) → gửi Gemini vision.
   - Extract {is_audiogram, extracted_text, severity}. Append vào context cho reply.

3. **MCP query**: lấy top 2 câu chứa nội dung chính của post (rule-based trích câu có keyword), gọi `searchKnowledge(query, top_k=5)` — lấy `min_score > 0.6`.

4. **Generate reply**: feed `{post, classification, vision_extract?, mcp_chunks}` vào Gemini → text reply. Nếu reply rỗng/quá 200 từ/chứa disclaimer y khoa thô → reject + retry 1 lần.

5. **Crisis path**: nếu `crisis_flag=true`:
   - Bỏ qua MCP + reply thường.
   - Draft cố định: "Mình rất lo cho bạn. Nếu bạn đang có suy nghĩ tự hại, hãy gọi ngay đường dây nóng hỗ trợ tâm lý 1800 599 920 (miễn phí, 24/7). Bạn không đơn độc."
   - Flag post với `status = REPLY_DRAFTED` nhưng `urgency=high` để admin review trước tiên.

6. **Upsert reply**: insert `fb_replies` với `draft_text`, `mcp_sources`, `status=DRAFT`, `page_id` = fanpage round-robin. Cập nhật `fb_posts.status = REPLY_DRAFTED`.

## Success Criteria

- [ ] 20 post test: classify precision ≥ 0.85 (đúng là liên quan ù tai).
- [ ] Draft reply dài 40-120 từ, trích được ≥ 1 ý từ MCP, không lặp MCP nguyên văn.
- [ ] Crisis keyword test → luôn trả về reply hotline.
- [ ] Cost/post trung bình < $0.003 (gồm classify + vision + generate).
- [ ] Vision extract audiogram: đúng dB/Hz ≥ 70% trên 10 ảnh test.

## Risks

- **Gemini hallucinate kiến thức không trong MCP** — mitigation: prompt nhấn "chỉ dùng thông tin trong knowledge base"; kiểm tra reply chứa ít nhất 1 cụm từ trùng với chunks.
- **Reply nghe như spam/rao** — mitigation: cấm từ "mua", "đăng ký", "giảm giá"; few-shot examples trong prompt.
- **FB tự động ẩn reply** do pattern lặp — mitigation: vary opening phrase (từ list 10 biến thể).

## Next

Phase 04 UI admin duyệt/chỉnh/đăng các draft này.
