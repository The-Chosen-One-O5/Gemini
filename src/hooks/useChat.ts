import { useCallback, useRef } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { parseReminderPatterns } from '@/lib/utils';
import { ChatRequestOptions, Message } from '@/types';

export function useChat() {
  const {
    cookies,
    cookieStatus,
    shouldRefreshCookies,
    markCookiesValidated,
    setCookieStatus,
    currentConversationId,
    isLoading,
    setLoading,
    setError,
    addMessage,
    updateMessage,
    createConversation,
    addReminder,
  } = useChatStore();

  const currentConversation = useChatStore((state) =>
    state.currentConversationId
      ? state.conversations.find((conversation) => conversation.id === state.currentConversationId) ?? null
      : null
  );

  const abortControllerRef = useRef<AbortController | null>(null);

  const getConversationById = useCallback((conversationId: string | null) => {
    if (!conversationId) return null;
    const state = useChatStore.getState();
    return state.conversations.find((conversation) => conversation.id === conversationId) ?? null;
  }, []);

  const buildHistoryPayload = useCallback((conversationId: string) => {
    const conversation = getConversationById(conversationId);
    if (!conversation) return [] as Message[];

    const sanitized = conversation.messages
      .filter((message) => !(message.role === 'assistant' && message.isStreaming))
      .map((message) => ({ ...message }));

    if (sanitized.length > 0) {
      const lastMessage = sanitized[sanitized.length - 1];
      if (lastMessage.role === 'user') {
        sanitized.pop();
      }
    }

    return sanitized;
  }, [getConversationById]);

  const sendMessage = useCallback(
    async (content: string, options: ChatRequestOptions = {}) => {
      const trimmed = content.trim();
      if (!trimmed) {
        return;
      }

      if (!cookies) {
        setError('Please paste your Gemini cookies to start chatting.');
        return;
      }

      if (cookieStatus === 'invalid') {
        setError('Your Gemini cookies are invalid. Please refresh them from gemini.google.com.');
        return;
      }

      if (cookieStatus === 'expired' || shouldRefreshCookies()) {
        setCookieStatus('expired');
        setError('Your Gemini cookies look expired. Please refresh them from gemini.google.com.');
        return;
      }

      let conversationId = currentConversationId;
      if (!conversationId) {
        conversationId = createConversation();
      }

      const origin = options.origin ?? 'chat';

      addMessage(conversationId, {
        content: trimmed,
        role: 'user',
        origin: origin === 'reminder' ? 'reminder' : 'user',
      });

      if (!options.skipReminderParsing) {
        const reminderPatterns = parseReminderPatterns(trimmed);
        reminderPatterns.forEach((pattern) => {
          addReminder({
            type: pattern.type,
            value: pattern.value,
            message: pattern.message,
            context: pattern.context,
            isActive: true,
          });
        });
      }

      addMessage(conversationId, {
        content: '',
        role: 'assistant',
        isStreaming: true,
      });

      setLoading(true);
      setError(null);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const historyForRequest = buildHistoryPayload(conversationId);

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: trimmed,
            conversationHistory: historyForRequest,
            cookies,
            options: {
              origin,
            },
          }),
          signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data?.success) {
          const errorMessage =
            data?.error ||
            (response.status === 401 || response.status === 403
              ? 'Cookies expired or invalid. Please refresh them from gemini.google.com.'
              : response.status === 429
              ? 'Too many requests. Please try again later.'
              : 'Failed to send message. Please try again.');

          if (response.status === 401 || response.status === 403) {
            setCookieStatus('invalid');
          }

          setError(errorMessage);

          const latestConversation = getConversationById(conversationId);
          const lastMessage = latestConversation?.messages.at(-1);
          if (lastMessage) {
            updateMessage(conversationId, lastMessage.id, {
              content: `Error: ${errorMessage}`,
              isStreaming: false,
            });
          }

          return;
        }

        const latestConversation = getConversationById(conversationId);
        const lastMessage = latestConversation?.messages.at(-1);
        if (lastMessage) {
          updateMessage(conversationId, lastMessage.id, {
            content: data.response,
            isStreaming: false,
          });
        }

        markCookiesValidated();
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        const errorMessage =
          error instanceof Error ? error.message : 'Failed to send message. Please try again.';
        setError(errorMessage);

        const latestConversation = getConversationById(conversationId);
        const lastMessage = latestConversation?.messages.at(-1);
        if (lastMessage) {
          updateMessage(conversationId, lastMessage.id, {
            content: `Error: ${errorMessage}`,
            isStreaming: false,
          });
        }
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [
      addMessage,
      addReminder,
      buildHistoryPayload,
      cookies,
      cookieStatus,
      createConversation,
      currentConversationId,
      markCookiesValidated,
      setCookieStatus,
      setError,
      setLoading,
      shouldRefreshCookies,
      updateMessage,
    ]
  );

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  }, [setLoading]);

  return {
    sendMessage,
    stopStreaming,
    currentConversation,
    isLoading,
  };
}
