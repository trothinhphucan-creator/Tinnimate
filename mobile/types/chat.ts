export type ChatRole = 'user' | 'assistant' | 'tool'

export interface ToolCall {
  name: string
  args: Record<string, unknown>
}

export interface ToolResult {
  name: string
  result: Record<string, unknown>
}

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  toolCall?: ToolCall
  toolResult?: ToolResult
  timestamp?: Date
}

export type SoundType =
  | 'white_noise'
  | 'pink_noise'
  | 'brown_noise'
  | 'rain'
  | 'ocean'
  | 'forest'
  | 'campfire'
  | 'birds'
  | 'zen_bells'
  | '528hz'
  | 'binaural_alpha'
  | 'binaural_theta'
  | 'binaural_delta'
  | 'notch_therapy'

export type QuizType = 'THI' | 'PHQ9' | 'GAD7' | 'ISI' | 'PSS'

export type ExerciseType = 'breathing' | 'progressive_relaxation' | 'meditation'
