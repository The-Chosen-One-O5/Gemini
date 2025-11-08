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
      <div className="flex items-center justify-between p-4 border-b border-[#e5e7eb] dark:border-[#323547] bg-[#ffffff] dark:bg-[#1f2231]">
        <div className="flex items-center gap-3">
          <button
            onClick={handleNewChat}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-xl bg-[#e0e7ff] text-[#1e3a8a] hover:bg-[#cbd5ff] dark:bg-[#3b82f6]/20 dark:text-[#93c5fd] dark:hover:bg-[#3b82f6]/30 transition-colors"
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
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-xl bg-rose-500/15 text-rose-500 dark:text-rose-300 hover:bg-rose-500/25 transition-colors"
          >
            <Square className="w-4 h-4" />
            Stop
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-[#151723]">
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
                <div className="p-3 rounded-xl bg-white/80 dark:bg-[#1f2333] border border-white/50 dark:border-[#2f3244] text-left">
                  <span className="font-medium text-gray-700 dark:text-gray-300">💡 Try:</span>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    &quot;Explain quantum computing in simple terms&quot;
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/80 dark:bg-[#1f2333] border border-white/50 dark:border-[#2f3244] text-left">
                  <span className="font-medium text-gray-700 dark:text-gray-300">🔧 Try:</span>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    &quot;Help me write a Python function to sort a list&quot;
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/80 dark:bg-[#1f2333] border border-white/50 dark:border-[#2f3244] text-left">
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
      <div className="border-t border-[#e5e7eb] dark:border-[#2f3244] bg-[#ffffff] dark:bg-[#1f2231] p-4">
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
                  'bg-[#f3f4f6] dark:bg-[#25283a]',
                  'text-gray-900 dark:text-gray-100',
                  'placeholder-gray-500 dark:placeholder-gray-400',
                  'border border-[#d1d5db] dark:border-[#3a3e53] rounded-2xl',
                  'focus:outline-none focus:ring-2 focus:ring-[#3b82f6]',
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
                'focus:outline-none focus:ring-2 focus:ring-[#3b82f6]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                input.trim() && !isLoading && !isComposing
                  ? 'bg-[#3b82f6] hover:bg-[#2563eb] text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transform hover:scale-105'
                  : 'bg-[#e5e7eb] dark:bg-[#303349] text-gray-500 dark:text-gray-400'
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
