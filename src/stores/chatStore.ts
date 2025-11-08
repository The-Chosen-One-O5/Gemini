import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ChatState,
  Conversation,
  Message,
  Reminder,
  CookieStatus,
} from '@/types';
import {
  encryptCookieString,
  decryptCookieString,
  sanitizeCookieString,
  areCookiesStale,
} from '@/lib/cookieUtils';

interface SetCookiesOptions {
  validated?: boolean;
}

interface ChatStore extends ChatState {
  // Authentication
  setCookies: (cookieString: string, options?: SetCookiesOptions) => void;
  refreshDecryptedCookies: () => void;
  setCookieStatus: (status: CookieStatus) => void;
  markCookiesValidated: () => void;
  shouldRefreshCookies: () => boolean;
  logout: () => void;

  // Conversations
  createConversation: () => string;
  setCurrentConversation: (id: string | null) => void;
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  deleteConversation: (id: string) => void;
  updateConversationTitle: (id: string, title: string) => void;

  // UI State
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setTheme: (theme: 'dark' | 'light') => void;

  // Reminders
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => void;
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
}

function normalizeConversationDates(conversations: Conversation[]): Conversation[] {
  return conversations.map((conversation) => ({
    ...conversation,
    createdAt: new Date(conversation.createdAt),
    updatedAt: new Date(conversation.updatedAt),
    messages: conversation.messages.map((message) => ({
      ...message,
      timestamp: new Date(message.timestamp),
    })),
  }));
}

function normalizeReminderDates(reminders: Reminder[]): Reminder[] {
  return reminders.map((reminder) => ({
    ...reminder,
    createdAt: new Date(reminder.createdAt),
  }));
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      cookies: null,
      encryptedCookies: null,
      cookiesSetAt: null,
      lastValidatedAt: null,
      cookieStatus: null,
      isAuthenticated: false,
      currentConversationId: null,
      conversations: [],
      isLoading: false,
      error: null,
      reminders: [],
      theme: 'dark',

      setCookies: (cookieString: string, options?: SetCookiesOptions) => {
        const sanitized = sanitizeCookieString(cookieString);
        const encrypted = encryptCookieString(sanitized);
        const timestamp = new Date().toISOString();

        set({
          cookies: sanitized,
          encryptedCookies: encrypted,
          cookiesSetAt: timestamp,
          lastValidatedAt: options?.validated ? timestamp : get().lastValidatedAt,
          cookieStatus: options?.validated ? 'valid' : 'unknown',
          isAuthenticated: options?.validated ? true : get().isAuthenticated,
          error: null,
        });
      },

      refreshDecryptedCookies: () => {
        const { encryptedCookies } = get();
        if (!encryptedCookies) {
          set({ cookies: null, isAuthenticated: false, cookieStatus: null });
          return;
        }

        const decrypted = decryptCookieString(encryptedCookies);
        if (!decrypted) {
          set({
            cookies: null,
            encryptedCookies: null,
            isAuthenticated: false,
            cookieStatus: 'invalid',
          });
        } else {
          set({ cookies: decrypted });
        }
      },

      setCookieStatus: (status: CookieStatus) => {
        set((state) => ({
          cookieStatus: status,
          isAuthenticated:
            status === 'valid'
              ? true
              : status === 'unknown'
              ? state.isAuthenticated
              : status === null
              ? false
              : false,
        }));
      },

      markCookiesValidated: () => {
        const nowIso = new Date().toISOString();
        set((state) => ({
          cookieStatus: 'valid',
          isAuthenticated: true,
          lastValidatedAt: nowIso,
          cookiesSetAt: state.cookiesSetAt ?? nowIso,
        }));
      },

      shouldRefreshCookies: () => {
        const state = get();
        const referenceTimestamp = state.lastValidatedAt || state.cookiesSetAt;
        return areCookiesStale(referenceTimestamp);
      },

      logout: () => {
        set({
          cookies: null,
          encryptedCookies: null,
          cookiesSetAt: null,
          lastValidatedAt: null,
          cookieStatus: null,
          isAuthenticated: false,
          currentConversationId: null,
        });
      },

      createConversation: () => {
        const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();
        const newConversation: Conversation = {
          id,
          title: 'New Chat',
          messages: [],
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          currentConversationId: id,
          error: null,
        }));

        return id;
      },

      setCurrentConversation: (id: string | null) => {
        set({ currentConversationId: id, error: null });
      },

      addMessage: (conversationId: string, messageData: Omit<Message, 'id' | 'timestamp'>) => {
        const message: Message = {
          ...messageData,
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
        };

        set((state) => {
          const conversations = state.conversations.map((conversation) => {
            if (conversation.id !== conversationId) {
              return conversation;
            }

            const updatedMessages = [...conversation.messages, message];
            const title = conversation.title === 'New Chat' && message.role === 'user'
              ? message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
              : conversation.title;

            return {
              ...conversation,
              messages: updatedMessages,
              title,
              updatedAt: new Date(),
            };
          });

          return { conversations };
        });
      },

      updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => {
        set((state) => ({
          conversations: state.conversations.map((conversation) => {
            if (conversation.id !== conversationId) {
              return conversation;
            }

            return {
              ...conversation,
              messages: conversation.messages.map((message) =>
                message.id === messageId ? { ...message, ...updates } : message
              ),
              updatedAt: new Date(),
            };
          }),
        }));
      },

      deleteConversation: (id: string) => {
        set((state) => {
          const remaining = state.conversations.filter((conversation) => conversation.id !== id);
          const currentId = state.currentConversationId === id
            ? remaining[0]?.id ?? null
            : state.currentConversationId;

          return {
            conversations: remaining,
            currentConversationId: currentId,
          };
        });
      },

      updateConversationTitle: (id: string, title: string) => {
        set((state) => ({
          conversations: state.conversations.map((conversation) =>
            conversation.id === id
              ? { ...conversation, title, updatedAt: new Date() }
              : conversation
          ),
        }));
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      setError: (error: string | null) => set({ error }),

      clearError: () => set({ error: null }),

      setTheme: (theme: 'dark' | 'light') => set({ theme }),

      addReminder: (reminderData: Omit<Reminder, 'id' | 'createdAt'>) => {
        const reminder: Reminder = {
          ...reminderData,
          id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
        };

        set((state) => ({
          reminders: [...state.reminders, reminder],
        }));
      },

      updateReminder: (id: string, updates: Partial<Reminder>) => {
        set((state) => ({
          reminders: state.reminders.map((reminder) =>
            reminder.id === id ? { ...reminder, ...updates } : reminder
          ),
        }));
      },

      deleteReminder: (id: string) => {
        set((state) => ({
          reminders: state.reminders.filter((reminder) => reminder.id !== id),
        }));
      },
    }),
    {
      name: 'gemini-chat-storage',
      partialize: (state) => ({
        encryptedCookies: state.encryptedCookies,
        cookiesSetAt: state.cookiesSetAt,
        lastValidatedAt: state.lastValidatedAt,
        cookieStatus: state.cookieStatus,
        isAuthenticated: state.isAuthenticated,
        currentConversationId: state.currentConversationId,
        conversations: state.conversations,
        reminders: state.reminders,
        theme: state.theme,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        if (state.encryptedCookies) {
          const decrypted = decryptCookieString(state.encryptedCookies);
          if (decrypted) {
            state.cookies = decrypted;
            if (!state.cookieStatus) {
              state.cookieStatus = 'unknown';
            }
          } else {
            state.cookies = null;
            state.encryptedCookies = null;
            state.cookieStatus = 'invalid';
            state.isAuthenticated = false;
          }
        }

        if (Array.isArray(state.conversations) && state.conversations.length > 0) {
          state.conversations = normalizeConversationDates(state.conversations);
        }

        if (Array.isArray(state.reminders) && state.reminders.length > 0) {
          state.reminders = normalizeReminderDates(state.reminders);
        }

        if (state.cookieStatus === 'valid') {
          const referenceTimestamp = state.lastValidatedAt || state.cookiesSetAt;
          if (areCookiesStale(referenceTimestamp)) {
            state.cookieStatus = 'expired';
            state.isAuthenticated = false;
          }
        }
      },
    }
  )
);
