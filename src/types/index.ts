export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  content: string;
  role: MessageRole;
  timestamp: Date;
  isStreaming?: boolean;
  origin?: 'user' | 'reminder' | 'system';
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export type ReminderType = 'interval' | 'timeout' | 'scheduled';

export interface Reminder {
  id: string;
  type: ReminderType;
  value: number; // milliseconds for interval/timeout, timestamp for scheduled
  message: string;
  context: string;
  isActive: boolean;
  createdAt: Date;
}

export type CookieStatus = 'unknown' | 'valid' | 'invalid' | 'expired' | null;

export interface ChatState {
  cookies: string | null;
  encryptedCookies: string | null;
  cookiesSetAt: string | null;
  lastValidatedAt: string | null;
  cookieStatus: CookieStatus;
  isAuthenticated: boolean;
  currentConversationId: string | null;
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
  reminders: Reminder[];
  theme: 'dark' | 'light';
}

export interface ChatRequestOptions {
  origin?: 'chat' | 'reminder';
  skipReminderParsing?: boolean;
}

export interface ChatRequest {
  message: string;
  conversationHistory: Message[];
  cookies: string;
  options?: ChatRequestOptions;
}

export interface ChatResponse {
  response: string;
  success: boolean;
  info?: string;
}

export interface TTSRequest {
  text: string;
  cookies: string;
}

export interface TTSResponse {
  audioUrl?: string;
  error?: string;
  success: boolean;
}

export interface CookieValidationRequest {
  cookies: string;
}

export interface CookieValidationResponse {
  valid: boolean;
  message?: string;
}
