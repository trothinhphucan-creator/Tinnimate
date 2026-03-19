// Shared TypeScript types for TinniMate

export type SubscriptionTier = 'free' | 'premium' | 'pro'

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
