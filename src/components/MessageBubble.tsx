import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';
import { Copy, Speaker, Loader2 } from 'lucide-react';
import { Message } from '@/types';
import { useTheme } from '@/hooks/useTheme';
import { useTTS } from '@/hooks/useTTS';
import { formatDate, cn } from '@/lib/utils';
import { useState, useMemo, useCallback } from 'react';

interface MessageBubbleProps {
  message: Message;
  isLast?: boolean;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { theme } = useTheme();
  const { generateAndPlay, isGenerating } = useTTS();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showTimestamp, setShowTimestamp] = useState(false);

  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const handleCopyCode = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  }, []);

  const handleTTS = () => {
    if (message.role === 'assistant' && !message.isStreaming) {
      generateAndPlay(message.content);
    }
  };

  const components = useMemo(
    () => ({
      code({ inline, className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '');
        const language = match ? match[1] : '';
        const codeContent = String(children).replace(/\n$/, '');

        if (!inline && language) {
          return (
            <div className="relative group mt-2">
              <div className="flex items-center justify-between bg-[#f1f5f9] dark:bg-[#1f2433] px-4 py-2 text-xs uppercase tracking-wide text-[#1e3a8a] dark:text-[#93c5fd] rounded-t-xl">
                <span>{language}</span>
                <button
                  onClick={() => handleCopyCode(codeContent)}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] bg-white/60 dark:bg-[#2b3144] text-[#1e3a8a] dark:text-[#93c5fd] rounded-lg hover:bg-white dark:hover:bg-[#343a4f] transition-colors"
                >
                  {copiedCode === codeContent ? 'Copied!' : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <SyntaxHighlighter
                style={theme === 'dark' ? oneDark : oneLight}
                language={language}
                PreTag="div"
                className="!mt-0 !rounded-t-none border border-t-0 border-[#e2e8f0] dark:border-[#2f3442]"
                {...props}
              >
                {codeContent}
              </SyntaxHighlighter>
            </div>
          );
        }

        return (
          <code
            className={cn(
              'px-1.5 py-0.5 rounded text-[13px] font-mono',
              'bg-[#e0e7ff] text-[#1e3a8a] dark:bg-[#2b3144] dark:text-[#c7d2fe]'
            )}
            {...props}
          >
            {children}
          </code>
        );
      },
      p({ children }: any) {
        return <p className="leading-relaxed text-[15px] whitespace-pre-wrap">{children}</p>;
      },
      a({ href, children }: any) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#2563eb] dark:text-[#93c5fd] underline-offset-4 hover:underline"
          >
            {children}
          </a>
        );
      },
    }),
    [copiedCode, theme, handleCopyCode]
  );

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="px-4 py-2 bg-amber-100 dark:bg-amber-500/10 text-amber-900 dark:text-amber-200 rounded-lg text-sm max-w-md border border-amber-200 dark:border-amber-500/30">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex gap-3 p-4 transition-colors',
        isUser ? 'flex-row-reverse' : 'flex-row',
        'hover:bg-[#eef2ff] dark:hover:bg-[#1f2333]'
      )}
      onMouseEnter={() => setShowTimestamp(true)}
      onMouseLeave={() => setShowTimestamp(false)}
    >
      <div
        className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold flex-shrink-0 shadow-sm',
          isUser
            ? 'bg-[#3b82f6] text-white'
            : 'bg-[#e2e8f0] dark:bg-[#2a2d3d] text-gray-700 dark:text-gray-200'
        )}
      >
        {isUser ? 'U' : 'AI'}
      </div>

      <div className={cn('flex-1 max-w-3xl', isUser && 'text-right')}>
        <div
          className={cn(
            'inline-block px-4 py-3 rounded-2xl shadow-sm border',
            isUser
              ? 'bg-[#3b82f6] text-white border-[#60a5fa]'
              : 'bg-white dark:bg-[#202334] text-gray-900 dark:text-gray-100 border-[#e2e8f0] dark:border-[#2c3145]'
          )}
        >
          {message.isStreaming ? (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150" />
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none text-left">
              {message.origin === 'reminder' && isUser && (
                <p className="text-[11px] uppercase tracking-wide text-white/70 mb-2">Reminder</p>
              )}
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={components}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <div
          className={cn(
            'flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400',
            isUser ? 'justify-end' : 'justify-start'
          )}
        >
          {!isUser && !isSystem && !message.isStreaming && (
            <button
              onClick={handleTTS}
              disabled={isGenerating}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                'hover:bg-[#e0e7ff] dark:hover:bg-[#2c3145]',
                'focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:ring-offset-1 focus:ring-offset-transparent',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              title="Play text-to-speech"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Speaker className="w-4 h-4" />
              )}
            </button>
          )}

          {showTimestamp && (
            <span>{formatDate(message.timestamp)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
