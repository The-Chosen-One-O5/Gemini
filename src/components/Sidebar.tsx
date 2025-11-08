import { useState } from 'react';
import { Trash2, MessageSquare, Edit2, Check, X } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { formatDate, truncateText, cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ className, onClose }: SidebarProps) {
  const {
    conversations,
    currentConversationId,
    setCurrentConversation,
    deleteConversation,
    updateConversationTitle,
  } = useChatStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleSelectConversation = (id: string) => {
    setCurrentConversation(id);
    onClose?.();
  };

  const handleDeleteConversation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation?')) {
      deleteConversation(id);
    }
  };

  const handleStartEdit = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    setEditingId(id);
    setEditingTitle(title);
  };

  const handleSaveEdit = (id: string) => {
    if (editingTitle.trim()) {
      updateConversationTitle(id, editingTitle.trim());
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const sortedConversations = [...conversations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">
          Conversations
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {conversations.length} {conversations.length === 1 ? 'chat' : 'chats'}
        </p>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No conversations yet
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              Start a new chat to see it here
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {sortedConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  'group relative p-3 rounded-lg cursor-pointer transition-colors',
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  currentConversationId === conversation.id
                    ? 'bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700'
                    : 'border border-transparent'
                )}
                onClick={() => handleSelectConversation(conversation.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  {editingId === conversation.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit(conversation.id);
                          } else if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                        className={cn(
                          'flex-1 px-2 py-1 text-sm rounded border',
                          'bg-white dark:bg-gray-700',
                          'border-gray-300 dark:border-gray-600',
                          'text-gray-900 dark:text-gray-100',
                          'focus:outline-none focus:ring-2 focus:ring-blue-500'
                        )}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveEdit(conversation.id);
                        }}
                        className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelEdit();
                        }}
                        className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                          {conversation.title}
                        </h3>
                        <div className="mt-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {conversation.messages.length} {conversation.messages.length === 1 ? 'message' : 'messages'}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {formatDate(conversation.updatedAt)}
                          </p>
                        </div>
                        {conversation.messages.length > 0 && (
                          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                            {truncateText(
                              conversation.messages[conversation.messages.length - 1].content,
                              100
                            )}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleStartEdit(e, conversation.id, conversation.title)}
                          className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          title="Edit title"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteConversation(e, conversation.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete conversation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
