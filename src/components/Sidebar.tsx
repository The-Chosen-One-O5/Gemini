import { useState, useMemo } from 'react';
import { Trash2, MessageSquare, Edit2, Check, X, Bell, Pause, Play } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { formatDate, truncateText, cn, formatFullDate } from '@/lib/utils';
import { useReminders } from '@/hooks/useReminders';
import { Reminder } from '@/types';

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

function formatDuration(milliseconds: number): string {
  const minutes = Math.round(milliseconds / 60000);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }

  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'}`;
}

function reminderSubtitle(reminder: Reminder): string {
  if (reminder.type === 'interval') {
    return `Every ${formatDuration(reminder.value)}`;
  }

  if (reminder.type === 'timeout') {
    return `In ${formatDuration(reminder.value)} from now`;
  }

  const scheduledDate = new Date(reminder.value);
  return `On ${formatFullDate(scheduledDate)}`;
}

export function Sidebar({ className, onClose }: SidebarProps) {
  const {
    conversations,
    currentConversationId,
    setCurrentConversation,
    deleteConversation,
    updateConversationTitle,
  } = useChatStore();

  const { reminders, pauseReminder, resumeReminder, removeReminder } = useReminders();

  const activeReminderCount = useMemo(
    () => reminders.filter((reminder) => reminder.isActive).length,
    [reminders]
  );

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

  const sortedConversations = useMemo(
    () =>
      [...conversations].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [conversations]
  );

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-[#f8fafc] dark:bg-[#1f1f28] border-r border-[#e2e8f0] dark:border-[#2a2d3a]',
        className
      )}
    >
      <div className="p-4 border-b border-[#e2e8f0] dark:border-[#2a2d3a]">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Conversations</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {conversations.length} {conversations.length === 1 ? 'chat' : 'chats'} saved
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="text-center py-10 px-4">
            <MessageSquare className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No conversations yet
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              Start a new chat to see it here
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {sortedConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  'group relative p-3 rounded-xl cursor-pointer transition-colors border border-transparent',
                  'bg-white dark:bg-[#262936] hover:border-blue-500/50 hover:shadow-md dark:hover:border-blue-400/60',
                  currentConversationId === conversation.id
                    ? 'border-blue-500/60 shadow-lg shadow-blue-500/10'
                    : 'shadow-sm dark:shadow-none'
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
                        className="flex-1 px-2 py-1 text-sm rounded-lg border border-[#e2e8f0] dark:border-[#3b3e50] bg-white dark:bg-[#303349] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveEdit(conversation.id);
                        }}
                        className="p-1 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelEdit();
                        }}
                        className="p-1 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
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
                        <div className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>
                            {conversation.messages.length} {conversation.messages.length === 1 ? 'message' : 'messages'}
                          </span>
                          <span>{formatDate(conversation.updatedAt)}</span>
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
                          className="p-1.5 rounded-lg bg-white dark:bg-[#33374d] text-gray-500 dark:text-gray-300 hover:text-blue-500 hover:bg-blue-500/10"
                          title="Edit title"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteConversation(e, conversation.id)}
                          className="p-1.5 rounded-lg bg-white dark:bg-[#33374d] text-gray-500 dark:text-gray-300 hover:text-rose-500 hover:bg-rose-500/10"
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

      <div className="border-t border-[#e2e8f0] dark:border-[#2a2d3a] bg-white dark:bg-[#1d1f2a]">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-500" />
              Reminders
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {activeReminderCount} active • {reminders.length} total
            </span>
          </div>

          {reminders.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Ask Gemini to "remind me" during a chat and they will appear here.
            </p>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="p-3 rounded-xl bg-[#f1f5f9] dark:bg-[#25283a] border border-[#e2e8f0] dark:border-[#313348] flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                        {reminder.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {reminderSubtitle(reminder)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'text-xs font-semibold px-2 py-0.5 rounded-full',
                        reminder.isActive
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      )}
                    >
                      {reminder.isActive ? 'Active' : 'Paused'}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() =>
                        reminder.isActive ? pauseReminder(reminder.id) : resumeReminder(reminder.id)
                      }
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-[#34384e] text-gray-600 dark:text-gray-300 hover:bg-blue-500/10 hover:text-blue-500"
                    >
                      {reminder.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {reminder.isActive ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      onClick={() => removeReminder(reminder.id)}
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-[#34384e] text-gray-600 dark:text-gray-300 hover:bg-rose-500/10 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
