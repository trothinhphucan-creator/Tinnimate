// Shared TypeScript types for TinniMate

export type SubscriptionTier = 'free' | 'premium' | 'pro' | 'ultra'

export type TinnitusType = 'ringing' | 'buzzing' | 'hissing' | 'clicking' | 'roaring' | 'pulsatile'
export type TinnitusSide = 'left' | 'right' | 'both' | 'in_head'
export type TinnitusDuration = 'under_3m' | '3_12m' | 'over_1y'
export type TinnitusCause = 'noise' | 'stress' | 'medication' | 'trauma' | 'unknown'

export type QuizType = 'THI' | 'TFI' | 'PHQ9' | 'GAD7' | 'ISI'

export type TherapySound =
  | 'white_noise' | 'pink_noise' | 'brown_noise'
  | 'rain' | 'ocean' | 'forest' | 'campfire'
  | 'birds' | 'creek' | 'thunder' | 'wind'
  | 'singing_bowl' | 'wind_chimes' | 'crickets' | 'heartbeat' | 'om_drone'
  | 'binaural_alpha' | 'binaural_theta' | 'binaural_delta'
  | 'notch_therapy'

export type ChatRole = 'user' | 'assistant' | 'tool'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  toolCall?: ToolCall
  toolResult?: ToolResult
  timestamp: Date
  feedback?: 'good' | 'bad'
  note?: string
}

export interface ToolCall {
  name: string
  args: Record<string, unknown>
}

export interface ToolResult {
  name: string
  result: Record<string, unknown>
}

// Admin config types
export interface AdminConfig {
  id: string
  ai_model: string
  temperature: number
  max_tokens: number
  tool_config: Record<string, boolean>
  rate_limits: RateLimits
  pricing_config: PricingConfig
  updated_at: string
}

export interface PricingConfig {
  plans: PlanConfig[]
  gateways: PaymentGateways
  trial_days: number
  yearly_discount: number // 0-100 percent
}

export interface PlanConfig {
  tier: SubscriptionTier
  name: string
  emoji: string
  price_usd: number
  price_vnd: number
  stripe_price_id: string
  features_en: string[]
  features_vi: string[]
  highlighted: boolean
}

export interface PaymentGateways {
  stripe: { enabled: boolean; secret_key: string; webhook_secret: string }
  momo: { enabled: boolean; partner_code: string; access_key: string; secret_key: string; endpoint: string }
  vnpay: { enabled: boolean; tmn_code: string; hash_secret: string; endpoint: string }
}


export interface RateLimits {
  free: TierLimits
  premium: TierLimits
  pro: TierLimits
  ultra: TierLimits
}

export interface TierLimits {
  chat: number       // -1 = unlimited
  quiz: number
  hearing_test: number
}

export interface SystemPrompt {
  id: string
  name: string
  content: string
  version: number
  is_active: boolean
  notes?: string
  created_at: string
}

export interface KnowledgeDoc {
  id: string
  title: string
  content: string
  category: 'medical' | 'therapy' | 'faq' | 'general'
  is_active: boolean
  created_at: string
}

export interface FewShotExample {
  id: string
  user_message: string
  ai_response: string
  category?: string
  is_active: boolean
  created_at: string
}

export interface TrainingSession {
  id: string
  messages: ChatMessage[]
  feedback: Record<string, 'good' | 'bad' | string>
  notes?: string
  created_at: string
}

export interface TrainingNote {
  id: string
  title: string
  content: string
  category: 'medical' | 'behavioral' | 'faq' | 'general'
  created_at: string
}

export interface TinnitusProfile {
  type: TinnitusType
  side: TinnitusSide
  duration: TinnitusDuration
  cause: TinnitusCause
  severity: number // 1-10
}

export interface User {
  id: string
  email: string
  name?: string
  subscription_tier: SubscriptionTier
  is_admin: boolean
  created_at: string
}

export type ProviderType = 'gemini' | 'openai' | 'anthropic' | 'litellm'

export interface LLMModel {
  id: string
  name: string
  model_id: string
  provider: ProviderType
  api_key_env?: string
  api_key_override?: string
  context_window: number
  max_output_tokens: number
  input_cost_per_1m: number
  output_cost_per_1m: number
  is_active: boolean
  notes?: string
  sort_order: number
  created_at: string
}

export interface UsageLog {
  id: string
  user_id?: string
  conversation_id?: string
  model_id: string
  provider: string
  input_tokens: number
  output_tokens: number
  input_cost_usd: number
  output_cost_usd: number
  is_training: boolean
  created_at: string
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
}

// ── CRM / Admin extended types ──────────────────────────────

export interface UserDetail {
  id: string
  email: string | null
  name: string | null
  subscription_tier: SubscriptionTier
  is_admin: boolean
  admin_notes?: string | null
  stripe_customer_id?: string | null
  created_at: string
  updated_at: string
}

export interface TinnitusProfileRow {
  id: string
  user_id: string
  type?: string
  side?: string
  duration?: string
  cause?: string
  severity?: number
  pitch_hz?: number
  created_at: string
}

export interface AssessmentRow {
  id: string
  user_id: string
  quiz_type: string
  score: number
  interpretation?: string
  ai_analysis?: string
  created_at: string
}

export interface CheckinRow {
  id: string
  user_id: string
  mood: number
  sleep_quality: number
  tinnitus_loudness: number
  tinnitus_distress: number
  notes?: string
  created_at: string
}

export interface TherapySessionRow {
  id: string
  user_id: string
  sound_type?: string
  duration_sec?: number
  mood_before?: number
  mood_after?: number
  created_at: string
}

export interface SubscriptionRow {
  id: string
  user_id: string
  stripe_subscription_id?: string
  stripe_price_id?: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  current_period_end?: string
  created_at: string
}

export interface PaymentOrderRow {
  id: string
  user_id?: string
  gateway: string
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  stripe_session_id?: string
  stripe_payment_intent?: string
  metadata?: Record<string, unknown>
  created_at: string
}

export interface Promotion {
  id: string
  code: string
  kind: 'percent' | 'fixed' | 'trial_extend' | 'tier_grant'
  value?: number
  tier_grant?: SubscriptionTier
  applies_to_tiers?: string[]
  max_uses?: number
  used_count: number
  starts_at?: string
  ends_at?: string
  is_active: boolean
  notes?: string
  created_at: string
}

export interface PromotionRedemption {
  id: string
  promotion_id: string
  user_id: string
  order_id?: string
  redeemed_at: string
  profile?: { name?: string; email?: string }
}

export interface AdminAuditEntry {
  id: number
  admin_id?: string
  action: string
  target_type?: string
  target_id?: string
  diff?: { before?: unknown; after?: unknown }
  ip?: string
  created_at: string
}
