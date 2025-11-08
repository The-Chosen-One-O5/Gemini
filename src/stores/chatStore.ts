import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatState, Conversation, Message, Reminder } from '@/types';

interface ChatStore extends ChatState {
  // Authentication
  setApiKey: (apiKey: string) => void;
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
  setTheme: (theme: 'dark' | 'light') => void;
  
  // Reminders
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => void;
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      // Initial state
      apiKey: null,
      isAuthenticated: false,
      currentConversationId: null,
      conversations: [],
      isLoading: false,
      error: null,
      reminders: [],
      theme: 'dark',

      // Authentication
      setApiKey: (apiKey: string) => {
        set({ apiKey, isAuthenticated: true });
      },

      logout: () => {
        set({
          apiKey: null,
          isAuthenticated: false,
          currentConversationId: null,
          error: null,
        });
      },

      // Conversations
      createConversation: () => {
        const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newConversation: Conversation = {
          id,
          title: 'New Chat',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
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
          const conversations = state.conversations.map((conv) => {
            if (conv.id === conversationId) {
              const updatedMessages = [...conv.messages, message];
              const title = conv.title === 'New Chat' && message.role === 'user' 
                ? message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
                : conv.title;
              
              return {
                ...conv,
                messages: updatedMessages,
                title,
                updatedAt: new Date(),
              };
            }
            return conv;
          });

          return { conversations };
        });
      },

      updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => {
        set((state) => ({
          conversations: state.conversations.map((conv) => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                messages: conv.messages.map((msg) =>
                  msg.id === messageId ? { ...msg, ...updates } : msg
                ),
                updatedAt: new Date(),
              };
            }
            return conv;
          }),
        }));
      },

      deleteConversation: (id: string) => {
        set((state) => {
          const newConversations = state.conversations.filter((conv) => conv.id !== id);
          const newCurrentId = state.currentConversationId === id 
            ? (newConversations.length > 0 ? newConversations[0].id : null)
            : state.currentConversationId;
          
          return {
            conversations: newConversations,
            currentConversationId: newCurrentId,
          };
        });
      },

      updateConversationTitle: (id: string, title: string) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === id ? { ...conv, title, updatedAt: new Date() } : conv
          ),
        }));
      },

      // UI State
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),

      setTheme: (theme: 'dark' | 'light') => set({ theme }),

      // Reminders
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
        apiKey: state.apiKey,
        isAuthenticated: state.isAuthenticated,
        conversations: state.conversations,
        currentConversationId: state.currentConversationId,
        reminders: state.reminders,
        theme: state.theme,
      }),
    }
  )
);
