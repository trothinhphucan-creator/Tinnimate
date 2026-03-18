// Gemini function calling tool definitions for Tinni chatbot
import { AdminConfig } from '@/types'

// FunctionDeclaration shape compatible with @google/generative-ai
export interface FunctionDeclaration {
  name: string
  description: string
  parameters?: {
    type: string
    properties?: Record<string, unknown>
    required?: string[]
  }
}

export const TOOL_DEFINITIONS: FunctionDeclaration[] = [
  {
    name: 'run_diagnosis',
    description: 'Starts a tinnitus diagnosis flow to assess user symptoms and severity.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'start_quiz',
    description: 'Launches a validated clinical questionnaire for tinnitus/mental health assessment.',
    parameters: {
      type: 'object',
      properties: {
        quiz_type: {
          type: 'string',
          enum: ['THI', 'TFI', 'PHQ9', 'GAD7', 'ISI'],
          description: 'The clinical questionnaire to administer.',
        },
      },
      required: ['quiz_type'],
    },
  },
  {
    name: 'play_sound_therapy',
    description: 'Plays a therapeutic sound session to help mask tinnitus or promote relaxation.',
    parameters: {
      type: 'object',
      properties: {
        sound_type: { type: 'string', description: 'Type of sound (e.g. white_noise, pink_noise, rain).' },
        duration_minutes: { type: 'number', description: 'Duration of the session in minutes.' },
      },
      required: ['sound_type', 'duration_minutes'],
    },
  },
  {
    name: 'play_relaxation',
    description: 'Guides the user through a relaxation or breathing exercise.',
    parameters: {
      type: 'object',
      properties: {
        exercise_type: {
          type: 'string',
          enum: ['breathing', 'pmr', 'visualization'],
          description: 'Type of relaxation exercise.',
        },
      },
      required: ['exercise_type'],
    },
  },
  {
    name: 'start_hearing_test',
    description: 'Initiates an audiometric hearing test to check hearing thresholds.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'show_progress',
    description: "Displays the user's tinnitus and wellness progress over a selected period.",
    parameters: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['week', 'month', 'all'],
          description: 'Time period for the progress report.',
        },
      },
      required: ['period'],
    },
  },
  {
    name: 'daily_checkin',
    description: "Starts the user's daily tinnitus and mood check-in.",
    parameters: { type: 'object', properties: {} },
  },
]

// Returns tool definitions filtered by admin tool_config flags
export function ENABLED_TOOLS(toolConfig: AdminConfig['tool_config']): FunctionDeclaration[] {
  return TOOL_DEFINITIONS.filter((tool) => toolConfig[tool.name] !== false)
}

// Training-only tool: AI can call this to persist knowledge learned during training
export const TRAINING_TOOL: FunctionDeclaration = {
  name: 'save_training_note',
  description:
    'Save an important piece of knowledge, fact, guideline, or behavioral rule to long-term training memory. ' +
    'Call this whenever the trainer teaches you something that should persist across sessions. ' +
    'After saving, confirm to the trainer in Vietnamese.',
  parameters: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Short descriptive title (max 80 chars).' },
      content: { type: 'string', description: 'Full knowledge content or guideline to remember.' },
      category: {
        type: 'string',
        enum: ['medical', 'behavioral', 'faq', 'general'],
        description: 'Category: medical knowledge, behavioral rule, FAQ answer, or general.',
      },
    },
    required: ['title', 'content', 'category'],
  },
}
