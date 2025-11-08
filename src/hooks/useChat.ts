import { useCallback, useRef } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { parseReminderPatterns } from '@/lib/utils';

export function useChat() {
  const {
    apiKey,
    currentConversationId,
    conversations,
    isLoading,
    setLoading,
    setError,
    addMessage,
    updateMessage,
    createConversation,
    addReminder,
  } = useChatStore();

  const abortControllerRef = useRef<AbortController | null>(null);

  const getCurrentConversation = useCallback(() => {
    if (!currentConversationId) return null;
    return conversations.find((conv) => conv.id === currentConversationId);
  }, [currentConversationId, conversations]);

  const sendMessage = useCallback(async (content: string) => {
    if (!apiKey) {
      setError('Please set your API key first');
      return;
    }

    let conversationId = currentConversationId;
    
    // Create new conversation if none exists
    if (!conversationId) {
      conversationId = createConversation();
    }

    // Add user message
    addMessage(conversationId, {
      content,
      role: 'user',
    });

    // Parse for reminder patterns
    const reminderPatterns = parseReminderPatterns(content);
    reminderPatterns.forEach((pattern) => {
      addReminder({
        type: pattern.type,
        value: pattern.value,
        message: pattern.message,
        context: pattern.context,
        isActive: true,
      });
    });

    // Add assistant message placeholder
    addMessage(conversationId, {
      content: '',
      role: 'assistant',
      isStreaming: true,
    });

    setLoading(true);
    setError(null);

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          message: content,
          conversationHistory: getCurrentConversation()?.messages || [],
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = await response.json();

      // Update the assistant message with the response
      const currentConv = conversations.find((conv) => conv.id === conversationId);
      if (currentConv) {
        const lastMessage = currentConv.messages[currentConv.messages.length - 1];
        updateMessage(conversationId, lastMessage.id, {
          content: data.response,
          isStreaming: false,
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was aborted, don't show error
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      setError(errorMessage);

      // Update the assistant message with error
      const currentConv = conversations.find((conv) => conv.id === conversationId);
      if (currentConv) {
        const lastMessage = currentConv.messages[currentConv.messages.length - 1];
        updateMessage(conversationId, lastMessage.id, {
          content: `Error: ${errorMessage}`,
          isStreaming: false,
        });
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    apiKey,
    currentConversationId,
    conversations,
    addMessage,
    updateMessage,
    createConversation,
    addReminder,
    setLoading,
    setError,
    getCurrentConversation,
  ]);

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
    currentConversation: getCurrentConversation(),
    isLoading,
  };
}
