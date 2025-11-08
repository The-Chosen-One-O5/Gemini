import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';
import { Copy, Speaker, Loader2 } from 'lucide-react';
import { Message } from '@/types';
import { useTheme } from '@/hooks/useTheme';
import { useTTS } from '@/hooks/useTTS';
import { formatDate, cn } from '@/lib/utils';
import { useState } from 'react';

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

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const handleTTS = () => {
    if (message.role === 'assistant' && !message.isStreaming) {
      generateAndPlay(message.content);
    }
  };

  const renderers: any = {
    code: (props: any) => {
      const { inline, className, children } = props;
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const codeContent = String(children).replace(/\n$/, '');

      if (!inline && language) {
        return (
          <div className="relative group">
            <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 rounded-t-lg">
              <span>{language}</span>
              <button
                onClick={() => handleCopyCode(codeContent)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {copiedCode === codeContent ? (
                  <span className="text-green-600">Copied!</span>
                ) : (
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
              className="!mt-0 !rounded-t-none"
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
            'px-1.5 py-0.5 rounded text-sm font-mono',
            'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
            className
          )}
          {...props}
        >
          {children}
        </code>
      );
    },
    math: (props: any) => {
      const { value } = props;
      return (
        <div className="my-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-center">
          <code className="text-sm font-mono">
            {value}
          </code>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Math rendering (LaTeX)
          </p>
        </div>
      );
    },
    inlineMath: (props: any) => {
      const { value } = props;
      return (
        <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
          {value}
        </code>
      );
    },
  };

  // Process content to handle LaTeX
  const processContent = (content: string) => {
    // Replace $$...$$ with block math
    let processed = content.replace(/\$\$([^$]+)\$\$/g, (match, math) => {
      return `$$${math}$$`;
    });

    // Replace $...$ with inline math
    processed = processed.replace(/\$([^$]+)\$/g, (match, math) => {
      return `$${math}$`;
    });

    return processed;
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm max-w-md">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
      onMouseEnter={() => setShowTimestamp(true)}
      onMouseLeave={() => setShowTimestamp(false)}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0',
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
        )}
      >
        {isUser ? 'U' : 'AI'}
      </div>

      {/* Message Content */}
      <div className={cn('flex-1 max-w-3xl', isUser && 'text-right')}>
        <div
          className={cn(
            'inline-block px-4 py-2 rounded-2xl',
            isUser
              ? 'bg-blue-500 text-white rounded-br-sm'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm'
          )}
        >
          {message.isStreaming ? (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150" />
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                components={renderers}
                remarkPlugins={[]}
                rehypePlugins={[]}
              >
                {processContent(message.content)}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Actions and Timestamp */}
        <div className={cn('flex items-center gap-2 mt-1', isUser ? 'justify-end' : 'justify-start')}>
          {/* TTS Button for AI messages */}
          {!isUser && !isSystem && !message.isStreaming && (
            <button
              onClick={handleTTS}
              disabled={isGenerating}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                'hover:bg-gray-200 dark:hover:bg-gray-600',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              title="Play text-to-speech"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Speaker className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              )}
            </button>
          )}

          {/* Timestamp */}
          {showTimestamp && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(message.timestamp)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
