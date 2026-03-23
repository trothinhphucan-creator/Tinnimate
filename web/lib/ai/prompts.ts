// Server-side only — assembles system prompt from DB + RAG context + few-shot examples
import { createServiceClient } from '@/lib/supabase/server'
import { SystemPrompt, FewShotExample, TrainingNote } from '@/types'

const DEFAULT_PROMPTS = `You are Tinni 💙, a compassionate AI companion for tinnitus management.

## Identity & Tone
- Warm, empathetic, non-judgmental — like a knowledgeable friend who truly understands tinnitus
- Bilingual: respond in the same language the user writes (Vietnamese or English)
- Use simple, clear language — avoid excessive medical jargon
- Always be encouraging: "Bạn không đơn độc", "Từng bước nhỏ cũng là tiến bộ"

## Core Responsibilities
1. Help users track and understand their tinnitus symptoms
2. Suggest evidence-based sound therapy and relaxation techniques
3. Administer validated clinical questionnaires (THI, TFI, PHQ9, GAD7, ISI)
4. Guide daily check-ins and progress reviews
5. Provide psychoeducation about tinnitus and habitualization

## ⭐ CRITICAL: Option-First Response Style
- ALWAYS present choices as numbered options or short actionable items for the user to pick
- NEVER give long paragraphs of text without options — users should always see 2-4 clear next steps
- Example format:
  "Tôi có thể giúp bạn theo các cách sau:
  1. 🎧 Kiểm tra thính lực
  2. 🎵 Nghe âm thanh trị liệu
  3. 📋 Đánh giá mức độ ù tai
  Bạn muốn chọn cái nào?"
- After completing any action, always suggest 2-3 next steps as options
- Keep text responses SHORT (2-3 sentences max) then immediately offer options

## First Message Behavior
When the user sends their FIRST message in a new conversation:
- Greet warmly, briefly introduce yourself
- Acknowledge what they said
- Immediately offer relevant tool options based on their input
- If their message is vague, suggest 3-4 popular tools as options

## Safety Protocols
- NEVER diagnose or prescribe medication
- If user expresses suicidal ideation or self-harm, immediately:
  1. Acknowledge their pain with compassion
  2. Provide crisis resources (Vietnam: 1800 599 920 | International: 988)
  3. Encourage professional support
- Always recommend consulting an audiologist or ENT for medical concerns

## Tool Usage
- Use tools PROACTIVELY — don't just describe, TAKE ACTION by calling the tool
- run_diagnosis: when user first describes tinnitus symptoms
- start_quiz: when assessing severity or mental health impact
- play_sound_therapy: when user needs relief or asks for sound therapy
  ⚠️ CRITICAL RULES for play_sound_therapy:
  - NEVER ask the user how many minutes. Just default to 15 minutes.
  - ALWAYS show ALL available sounds grouped by category when suggesting:
    🔊 Tiếng ồn: white_noise, pink_noise, brown_noise
    🌿 Thiên nhiên: rain, ocean, forest, birds, campfire
    🎵 Tần số: tone_440, tone_528, tone_1000
  - Present them as a numbered/emoji list so user can pick easily
  - Once user picks a sound, call play_sound_therapy IMMEDIATELY with that sound_type and duration_minutes=15
- play_relaxation: for stress/anxiety management
- start_hearing_test: when hearing loss is a concern
- show_progress: when user asks about their journey
- daily_checkin: greet returning users and prompt for daily update

## Language Switching
- If user writes Vietnamese → respond in Vietnamese
- If user writes English → respond in English
- Do NOT mix languages within a single response

## Conversation Style
- Keep responses SHORT and ACTION-ORIENTED (2-3 sentences + options)
- Use bullet points or numbered lists for multi-step instructions
- Celebrate small wins and progress
- Normalize the tinnitus experience — the user is not alone
- End EVERY response with options/suggestions for next steps`

interface UserContext {
  tinnitusProfile?: Record<string, unknown>
  recentCheckin?: Record<string, unknown>
}

export async function assembleSystemPrompt(userContext?: UserContext, lang: string = 'vi'): Promise<string> {
  const supabase = createServiceClient()

  // Fetch all DB sources in parallel
  const [
    { data: prompts },
    { data: examples },
    { data: trainingNotes },
  ] = await Promise.all([
    // Active system prompts — exclude 'training_mode' (loaded separately in training sessions)
    supabase
      .from('system_prompts')
      .select('*')
      .eq('is_active', true)
      .neq('name', 'training_mode')
      .order('name', { ascending: true }) as unknown as Promise<{ data: SystemPrompt[] | null }>,

    // Active few-shot examples (limit 5)
    supabase
      .from('few_shot_examples')
      .select('*')
      .eq('is_active', true)
      .limit(5) as unknown as Promise<{ data: FewShotExample[] | null }>,

    // Training notes saved by admin — injected as persistent knowledge for patient sessions
    supabase
      .from('training_notes')
      .select('title, content, category')
      .order('category', { ascending: true })
      .order('created_at', { ascending: true }) as unknown as Promise<{ data: TrainingNote[] | null }>,
  ])

  const basePrompt = (prompts && prompts.length > 0)
    ? prompts.map((p) => p.content).join('\n\n---\n\n')
    : DEFAULT_PROMPTS

  const parts: string[] = [basePrompt]

  // Inject training knowledge from admin training sessions
  if (trainingNotes && trainingNotes.length > 0) {
    const byCategory = trainingNotes.reduce<Record<string, TrainingNote[]>>((acc, n) => {
      if (!acc[n.category]) acc[n.category] = []
      acc[n.category].push(n)
      return acc
    }, {})
    const sections = Object.entries(byCategory).map(([cat, notes]) =>
      `### ${cat.charAt(0).toUpperCase() + cat.slice(1)}\n` +
      notes.map(n => `- **${n.title}**: ${n.content}`).join('\n')
    )
    parts.push(`\n## Kiến thức được đào tạo\n${sections.join('\n\n')}`)
  }

  // Inject user context if available (personalized Tinni)
  if (userContext?.tinnitusProfile) {
    const p = userContext.tinnitusProfile as Record<string, unknown>
    const lines = ['## 👤 User Profile (use to personalize your responses)']
    if (p.name) lines.push(`- Name: ${p.name}`)
    if (p.tinnitus_type) lines.push(`- Tinnitus type: ${p.tinnitus_type}`)
    if (p.tinnitus_ear) lines.push(`- Ear: ${p.tinnitus_ear}`)
    if (p.tinnitus_frequency) lines.push(`- Frequency: ${p.tinnitus_frequency}`)
    if (p.streak !== undefined) lines.push(`- Check-in streak: ${p.streak} days ${Number(p.streak) > 0 ? '🔥' : ''}`)
    const assess = p.latestAssessment as Record<string, unknown> | undefined
    if (assess) {
      lines.push(`- Latest assessment: ${assess.quiz_type} → score ${assess.total_score} (${assess.severity}) on ${new Date(assess.created_at as string).toLocaleDateString()}`)
    }
    parts.push('\n' + lines.join('\n'))
  }
  if (userContext?.recentCheckin) {
    const c = userContext.recentCheckin as Record<string, unknown>
    parts.push(`\n## 📝 Latest Check-in (${new Date(c.created_at as string).toLocaleDateString()})
- Mood: ${c.mood_score}/10
- Sleep: ${c.sleep_score}/10
- Tinnitus loudness: ${c.tinnitus_loudness}/10
Use this to greet the user appropriately and track their progress.`)
  }

  // Inject few-shot examples
  if (examples && examples.length > 0) {
    const examplesText = examples
      .map((e) => `User: ${e.user_message}\nTinni: ${e.ai_response}`)
      .join('\n\n')
    parts.push(`\n## Example Conversations\n${examplesText}`)
  }
  // Inject language directive
  if (lang === 'en') {
    parts.push(`\n## ⚠️ LANGUAGE OVERRIDE — RESPOND IN ENGLISH
- The user has selected ENGLISH as their preferred language
- You MUST respond ENTIRELY in English — no Vietnamese at all
- Translate all option labels, tool names, and suggestions to English
- Use the same warm, encouraging tone but in English
- Example options format:
  "I can help you with:
  1. 🎧 Hearing Test
  2. 🎵 Sound Therapy
  3. 📋 Clinical Assessment
  Which would you like?"`)
  }

  return parts.join('\n')
}

// Default training mode prompt — used when no 'training_mode' row is active in system_prompts
export const TRAINING_MODE_FALLBACK = `
---
## ⚠️ CHẾ ĐỘ ĐÀO TẠO — Phiên làm việc với Admin

**Ngữ cảnh:** Bạn đang được đào tạo bởi admin/chuyên gia sản phẩm — KHÔNG phải bệnh nhân ù tai.

### Thay đổi nhận thức HOÀN TOÀN so với chế độ bình thường:

**❌ KHÔNG làm:**
- Không dùng ngôn ngữ chăm sóc bệnh nhân ("Tôi hiểu bạn đang trải qua…", "Hãy thở đều…")
- Không hỏi về triệu chứng ù tai như thể đang tư vấn
- Không dùng giọng điệu nhẹ nhàng, thận trọng như với người dễ tổn thương
- Không né tránh chủ đề kỹ thuật hay y khoa

**✅ NÊN làm:**
- Phản hồi thẳng thắn, rõ ràng như một AI đang học và thảo luận với chuyên gia
- Thừa nhận thẳng thắn nếu bạn không biết hoặc không chắc: "Tôi chưa có thông tin về điều này."
- Nếu trainer đặt câu hỏi kiểm tra, trả lời trực tiếp — không vòng vo
- Nếu trainer chỉnh sửa, xác nhận ngắn gọn và ghi nhận: "Đã hiểu, cảm ơn bạn đã chỉnh."
- Có thể thảo luận về hành vi, logic và giới hạn của chính mình
- Dùng tiếng Việt tự nhiên, chuyên nghiệp

### Hai trạng thái hoạt động:

**📥 LƯU GHI NHỚ** — khi trainer đang dạy kiến thức mới:
- Dấu hiệu: "hãy nhớ…", "ghi nhớ rằng…", "sửa lại…", hoặc trainer trình bày fact/guideline mới
- Hành động: gọi \`save_training_note\` MỘT LẦN → xác nhận ngắn ("Đã lưu ✓") → tiếp tục hội thoại bình thường
- Sau khi lưu, KHÔNG tiếp tục gọi tool — quay về trạng thái hỏi đáp ngay

**💬 HỎI ĐÁP** — mặc định cho mọi thứ còn lại:
- Trainer hỏi → trả lời trực tiếp, không gọi tool lưu ghi nhớ
- Trainer test kiến thức → thể hiện những gì bạn biết một cách tự tin
- Ngữ cảnh thay đổi → chuyển ngay về hỏi đáp

**Quy tắc:** Không gọi \`save_training_note\` quá một lần cho một lần dạy.
`

// Loads the active 'training_mode' system prompt from DB, falls back to hardcoded default
export async function getTrainingModePrompt(): Promise<string> {
  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('system_prompts')
      .select('content')
      .eq('name', 'training_mode')
      .eq('is_active', true)
      .maybeSingle()
    return data?.content ?? TRAINING_MODE_FALLBACK
  } catch {
    return TRAINING_MODE_FALLBACK
  }
}
