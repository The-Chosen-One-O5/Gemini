import { useRef, useEffect, useState } from 'react';
import { Send, Square, Plus } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useChatStore } from '@/stores/chatStore';
import { MessageBubble } from './MessageBubble';
import { cn } from '@/lib/utils';

export function ChatWindow() {
  const { sendMessage, stopStreaming, currentConversation, isLoading } = useChat();
  const { createConversation } = useChatStore();
  const [input, setInput] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading || isComposing) return;
    
    const messageToSend = input.trim();
    setInput('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    await sendMessage(messageToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    }
  };

  const handleNewChat = () => {
    createConversation();
    setInput('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const hasMessages = currentConversation && currentConversation.messages.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <button
            onClick={handleNewChat}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
          {currentConversation && (
            <h2 className="font-medium text-gray-900 dark:text-gray-100">
              {currentConversation.title}
            </h2>
          )}
        </div>
        
        {isLoading && (
          <button
            onClick={stopStreaming}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors"
          >
            <Square className="w-4 h-4" />
            Stop
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {!hasMessages ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="max-w-md">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Welcome to Gemini Chat
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start a conversation with Google&apos;s Gemini 2.0 Flash. Ask questions, get help with coding, explore ideas, and more.
              </p>
              
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-left">
                  <span className="font-medium text-gray-700 dark:text-gray-300">💡 Try:</span>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    &quot;Explain quantum computing in simple terms&quot;
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-left">
                  <span className="font-medium text-gray-700 dark:text-gray-300">🔧 Try:</span>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    &quot;Help me write a Python function to sort a list&quot;
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-left">
                  <span className="font-medium text-gray-700 dark:text-gray-300">⏰ Try:</span>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    &quot;Remind me in 5 minutes to take a break&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="pb-4">
            {currentConversation?.messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                isLast={index === currentConversation.messages.length - 1}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                placeholder="Type your message..."
                className={cn(
                  'w-full px-4 py-3 pr-12 resize-none',
                  'bg-gray-100 dark:bg-gray-700',
                  'text-gray-900 dark:text-gray-100',
                  'placeholder-gray-500 dark:placeholder-gray-400',
                  'border border-gray-300 dark:border-gray-600 rounded-2xl',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  'focus:border-transparent',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'min-h-[48px] max-h-[120px]'
                )}
                disabled={isLoading}
                rows={1}
              />
            </div>
            
            <button
              type="submit"
              disabled={!input.trim() || isLoading || isComposing}
              className={cn(
                'px-4 py-3 rounded-2xl transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                input.trim() && !isLoading && !isComposing
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500'
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
