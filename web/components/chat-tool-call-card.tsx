import { ToolCall } from '@/types'
import { ChatToolRenderer } from '@/components/chat/chat-tool-renderer'

interface ChatToolCallCardProps {
  toolCall: ToolCall
  onResult?: (toolName: string, result: Record<string, unknown>) => void
}

// Re-export using the new rich renderer
export function ChatToolCallCard({ toolCall, onResult }: ChatToolCallCardProps) {
  return <ChatToolRenderer toolCall={toolCall} onResult={onResult} />
}
