export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Reminder {
  id: string;
  type: 'interval' | 'timeout' | 'scheduled';
  value: number; // milliseconds for interval/timeout, timestamp for scheduled
  message: string;
  context: string;
  isActive: boolean;
  createdAt: Date;
}

export interface ChatState {
  apiKey: string | null;
  isAuthenticated: boolean;
  currentConversationId: string | null;
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
  reminders: Reminder[];
  theme: 'dark' | 'light';
}

export interface ChatRequest {
  message: string;
  conversationHistory: Message[];
}

export interface ChatResponse {
  response: string;
  tokens?: number;
}

export interface TTSRequest {
  text: string;
}

export interface TTSResponse {
  audioUrl?: string;
  error?: string;
}
